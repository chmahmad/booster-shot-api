export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { contactIds, tag } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0 || !tag) {
    return res.status(400).json({ error: 'Missing contactIds array or tag' });
  }

  console.log('Starting tag addition:', { contactIds, tag }); // Log input

  try {
    const results = [];

    for (const contactId of contactIds) {
      try {
        const ghlApiUrl = `https://rest.gohighlevel.com/v1/contacts/${contactId}/tags`;
        console.log(`Processing contact ${contactId}`);

        const payload = { tags: [tag] };
        console.log('Sending payload:', payload);

        const response = await fetch(ghlApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        let data;
        try {
          data = await response.json();
          console.log('API Response:', data);
        } catch (jsonError) {
          const text = await response.text();
          console.error('Non-JSON Response:', text);
          throw new Error(`API returned non-JSON response: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            data
          });
          results.push({ 
            contactId, 
            success: false, 
            error: data.error || `HTTP ${response.status}: ${response.statusText}`,
            responseData: data
          });
        } else {
          console.log('Successfully added tag');
          results.push({ 
            contactId, 
            success: true, 
            data,
            // Add verification flag
            verified: false // We'll verify this in the next step
          });
        }

        if (contactIds.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`Error processing contact ${contactId}:`, error);
        results.push({ 
          contactId, 
          success: false, 
          error: error.message 
        });
      }
    }

    // Verification step - check if tags were actually added
    for (const result of results.filter(r => r.success)) {
      try {
        const verifyUrl = `https://rest.gohighlevel.com/v1/contacts/${result.contactId}`;
        const verifyResponse = await fetch(verifyUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          },
        });
        
        const contactData = await verifyResponse.json();
        const hasTag = contactData.tags?.includes(tag);
        
        if (!hasTag) {
          console.error('Verification failed - tag not present:', contactData.tags);
          result.success = false;
          result.error = 'Tag not found after addition';
          result.verified = false;
        } else {
          result.verified = true;
        }
      } catch (verifyError) {
        console.error('Verification error:', verifyError);
        result.verified = false;
      }
    }

    const allSuccess = results.every(r => r.success);
    const allVerified = results.filter(r => r.success).every(r => r.verified);

    return res.status(allSuccess ? 200 : 207).json({
      success: allSuccess,
      allVerified,
      results,
      message: allSuccess ? 'All tags added successfully' : 
               allVerified ? 'Some tags were not added successfully' :
               'Some tags appeared to add but verification failed'
    });

  } catch (error) {
    console.error('API Add Tag Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
}
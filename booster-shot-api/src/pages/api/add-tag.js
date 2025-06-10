export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { contactIds, tag } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0 || !tag) {
    return res.status(400).json({ error: 'Missing contactIds array or tag' });
  }

  try {
    const results = [];

    for (const contactId of contactIds) {
      try {
        const ghlApiUrl = `https://rest.gohighlevel.com/v1/contacts/${contactId}/tags`;

        const response = await fetch(ghlApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags: [tag] }),
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          // Handle non-JSON responses
          const text = await response.text();
          throw new Error(`API returned non-JSON response: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
          results.push({ 
            contactId, 
            success: false, 
            error: data.error || `HTTP ${response.status}: ${response.statusText}` 
          });
        } else {
          results.push({ contactId, success: true, data });
        }

        // Add small delay between requests to avoid rate limiting
        if (contactIds.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`Error processing contact ${contactId}:`, error);
        results.push({ 
          contactId, 
          success: false, 
          error: error.message || 'Failed to add tag' 
        });
      }
    }

    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
      return res.status(200).json({ success: true, results });
    } else {
      return res.status(207).json({ 
        success: false, 
        results,
        message: 'Some tags were not added successfully'
      });
    }
  } catch (error) {
    console.error('API Add Tag Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
}
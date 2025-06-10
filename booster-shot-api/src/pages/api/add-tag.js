export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Clone the body first to prevent "already read" errors
  const body = JSON.parse(JSON.stringify(req.body));
  const { contactIds, tag } = body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0 || !tag) {
    return res.status(400).json({ error: 'Missing contactIds array or tag' });
  }

  try {
    const results = [];

    for (const contactId of contactIds) {
      try {
        const ghlApiUrl = `https://rest.gohighlevel.com/v1/contacts/${contactId}/tags`;
        
        // Create fresh payload each time
        const payload = { tags: [tag.trim()] }; // Trim whitespace

        const response = await fetch(ghlApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Read response as text first to avoid JSON parse errors
        const responseText = await response.text();
        let data;
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          data = { error: responseText };
        }

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Immediate verification
        const verifyResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          },
        });

        const contactData = await verifyResponse.json();
        const tagAdded = contactData.tags?.includes(tag);

        if (!tagAdded) {
          throw new Error('Tag not found after addition');
        }

        results.push({ contactId, success: true });

      } catch (error) {
        console.error(`Error with contact ${contactId}:`, error.message);
        results.push({
          contactId,
          success: false,
          error: error.message,
        });
      }

      // Add delay between requests if needed
      if (contactIds.length > 1) await new Promise(resolve => setTimeout(resolve, 200));
    }

    const allSuccess = results.every(r => r.success);
    return res.status(allSuccess ? 200 : 207).json({
      success: allSuccess,
      results,
      message: allSuccess ? 'All tags added successfully' : 'Some tags failed to add'
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
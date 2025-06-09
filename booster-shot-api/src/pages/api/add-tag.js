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

    // Loop over each contact ID to add the tag
    for (const contactId of contactIds) {
      const ghlApiUrl = `https://rest.gohighlevel.com/v1/contacts/${contactId}/tags`;

      const response = await fetch(ghlApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log error and collect failure info
        results.push({ contactId, success: false, error: data.error || 'Failed to add tag' });
      } else {
        results.push({ contactId, success: true, data });
      }
    }

    // Check if all succeeded
    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
      return res.status(200).json({ success: true, results });
    } else {
      return res.status(207).json({ success: false, results }); // 207 Multi-Status
    }
  } catch (error) {
    console.error('API Add Tag Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// /pages/api/add-tag.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { contactId, tagName } = req.body;

  console.log('Add tag request body:', req.body); // Log incoming request body

  if (!contactId || !tagName) {
    console.error('Missing contactId or tagName:', { contactId, tagName });
    return res.status(400).json({ error: 'Missing contactId or tagName' });
  }

  try {
    // Go High Level API endpoint for adding a tag to a contact
    const ghlApiUrl = `https://rest.gohighlevel.com/v1/contacts/${contactId}/tags`;

    const response = await fetch(ghlApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`, // Place your GHL API key in .env.local
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tag: tagName }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('GHL Error:', data);
      return res.status(response.status).json({ error: data.error || 'Failed to add tag' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Add Tag Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_TOKEN = process.env.GHL_API_TOKEN;

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Missing GHL_API_TOKEN in environment variables' });
  }

  const contacts = [];
  let page = 1;
  const limit = 100; // max allowed by GHL API if documented, else use 50

  try {
    while (true) {
      const url = `https://rest.gohighlevel.com/v1/contacts?page=${page}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json({ error: 'Failed to fetch contacts', details: errorData });
      }

      const data = await response.json();

      if (!data.contacts || data.contacts.length === 0) {
        // No more contacts, break the loop
        break;
      }

      contacts.push(...data.contacts);

      if (data.contacts.length < limit) {
        // Less than limit means last page
        break;
      }

      page++;
    }

    res.status(200).json({ contacts });

  } catch (error) {
    console.error('Error fetching contacts from GHL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

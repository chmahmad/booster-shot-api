export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_TOKEN = process.env.GHL_API_TOKEN;

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Missing GHL_API_TOKEN in environment variables' });
  }

  let contacts = [];
  let startAfter = null;
  let startAfterId = null;
  const limit = 100; // if supported

  try {
    while (true) {
      const url = new URL('https://rest.gohighlevel.com/v1/contacts');

      if (startAfter) url.searchParams.append('startAfter', startAfter);
      if (startAfterId) url.searchParams.append('startAfterId', startAfterId);
      url.searchParams.append('limit', limit);

      const response = await fetch(url.toString(), {
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
        break; // no more contacts
      }

      contacts = contacts.concat(data.contacts);

      // For next iteration, update cursor params
      // Assume API returns something like data.pagination with startAfter and startAfterId for next page
      if (data.pagination && data.pagination.startAfter && data.pagination.startAfterId) {
        startAfter = data.pagination.startAfter;
        startAfterId = data.pagination.startAfterId;
      } else {
        // No pagination cursor returned means we are done
        break;
      }
    }

    res.status(200).json({ contacts });

  } catch (error) {
    console.error('Error fetching contacts from GHL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

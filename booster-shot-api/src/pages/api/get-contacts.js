export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_TOKEN = process.env.GHL_API_TOKEN;

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Missing GHL_API_TOKEN in environment variables' });
  }

  const limit = parseInt(req.query.limit) || 100;
  const startAfter = req.query.startAfter || null;
  const startAfterId = req.query.startAfterId || null;
  const locationId = req.query.locationId || null;

  try {
    const url = new URL('https://rest.gohighlevel.com/v1/contacts');

    if (startAfter) url.searchParams.append('startAfter', startAfter);
    if (startAfterId) url.searchParams.append('startAfterId', startAfterId);
    if (limit) url.searchParams.append('limit', limit);
    if (locationId) url.searchParams.append('locationId', locationId);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: 'Failed to fetch contacts', details: errorData });
    }

    const data = await response.json();

    return res.status(200).json({
      contacts: data.contacts || [],
      nextPage: data.pagination
        ? {
            startAfter: data.pagination.startAfter || null,
            startAfterId: data.pagination.startAfterId || null,
          }
        : null,
      total: data.meta?.total || data.total || 0,
    });
  } catch (error) {
    console.error('Error fetching contacts from GHL:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

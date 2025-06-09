export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_TOKEN = process.env.GHL_API_TOKEN;
  const locationId = req.query.locationId;
  const limit = parseInt(req.query.limit) || 20;
  const startAfter = req.query.startAfter || null;
  const startAfterId = req.query.startAfterId || null;

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Missing GHL_API_TOKEN' });
  }

  try {
    const url = new URL('https://rest.gohighlevel.com/v1/contacts');
    url.searchParams.append('limit', limit);
    if (locationId) url.searchParams.append('locationId', locationId);
    if (startAfter) url.searchParams.append('startAfter', startAfter);
    if (startAfterId) url.searchParams.append('startAfterId', startAfterId);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GHL API Error:', errorData);
      return res.status(response.status).json({ error: errorData.message || 'API Error' });
    }

    const data = await response.json();
    console.log('GHL API Data:', { 
      contactsCount: data.contacts?.length,
      pagination: data.pagination 
    });

    // Determine if more contacts exist
    const hasMore = data.contacts?.length >= limit && 
                   data.pagination?.startAfter && 
                   data.pagination?.startAfterId;

    return res.status(200).json({
      contacts: data.contacts || [],
      pagination: {
        nextPageUrl: hasMore
          ? `/api/get-contacts?locationId=${locationId}&limit=${limit}&startAfter=${data.pagination.startAfter}&startAfterId=${data.pagination.startAfterId}`
          : null,
        total: data.meta?.total || data.total || 0,
        hasMore // For debugging
      }
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
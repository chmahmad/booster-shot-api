export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_TOKEN = process.env.GHL_API_TOKEN;
  const { locationId, limit = 20, startAfter, startAfterId } = req.query;

  if (!API_TOKEN) {
    return res.status(500).json({ error: 'Missing API token' });
  }

  try {
    const url = new URL('https://rest.gohighlevel.com/v1/contacts');
    const params = new URLSearchParams({
      limit,
      ...(locationId && { locationId }),
      ...(startAfter && { startAfter }),
      ...(startAfterId && { startAfterId })
    });

    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      return res.status(response.status).json({ error: error.message || 'API Error' });
    }

    const data = await response.json();
    
    // Critical Fix: Proper pagination detection
    const receivedCount = data.contacts?.length || 0;
    const hasMore = receivedCount > 0 && receivedCount >= limit;
    const nextPageToken = hasMore ? data.pagination : null;

    return res.status(200).json({
      contacts: data.contacts || [],
      pagination: {
        nextPageUrl: nextPageToken
          ? `/api/get-contacts?locationId=${locationId}&limit=${limit}&startAfter=${nextPageToken.startAfter}&startAfterId=${nextPageToken.startAfterId}`
          : null,
        total: data.meta?.total || data.total || 0,
        hasMore
      }
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
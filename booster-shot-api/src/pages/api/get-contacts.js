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

    if (locationId) url.searchParams.append('locationId', locationId);
    if (limit) url.searchParams.append('limit', limit);
    if (startAfter) url.searchParams.append('startAfter', startAfter);
    if (startAfterId) url.searchParams.append('startAfterId', startAfterId);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

	return res.status(200).json({
  contacts: data.contacts || [],
  pagination: {  // Make sure this matches what you check in the frontend
    nextPageUrl: data.pagination?.startAfter && data.pagination?.startAfterId
      ? `/api/get-contacts?locationId=${locationId}&limit=${limit}&startAfter=${data.pagination.startAfter}&startAfterId=${data.pagination.startAfterId}`
      : null,
    total: data.meta?.total || data.total || 0,
  }
});

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
console.log('Next page URL:', data.pagination?.nextPageUrl);
}

const GHL_API_KEY = process.env.GHL_API_KEY || process.env.GHL_API_TOKEN;
const GHL_API_CONTACTS_URL = "https://rest.gohighlevel.com/v1/contacts/";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { locationId } = req.query;
  if (!locationId) {
    return res.status(400).json({ error: 'Missing locationId' });
  }
  if (!GHL_API_KEY) {
    console.error('GHL API Key missing!');
    return res.status(500).json({ error: 'API key missing' });
  }

  try {
    let allTags = new Set();
    let nextPage = 1;
    let hasMore = true;
    const pageLimit = 1000;
    let totalContactsFetched = 0;

    while (hasMore && nextPage <= 5) {
      const resp = await fetch(
        `${GHL_API_CONTACTS_URL}?locationId=${locationId}&limit=${pageLimit}&page=${nextPage}`,
        {
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
          }
        }
      );
      if (!resp.ok) {
        const body = await resp.text();
        console.error(`GHL API error: ${resp.status} - ${body}`);
        throw new Error(`Failed to fetch contacts: ${resp.statusText}`);
      }
      const data = await resp.json();
      const contacts = Array.isArray(data.contacts) ? data.contacts : [];
      totalContactsFetched += contacts.length;
      contacts.forEach(c => {
        if (Array.isArray(c.tags)) {
          c.tags.forEach(tag => allTags.add(tag));
        }
      });
      hasMore = data.pagination && data.pagination.hasMore;
      nextPage++;
      if (!hasMore) break;
    }
    console.log(`Fetched ${totalContactsFetched} contacts. Found tags: ${Array.from(allTags).join(', ')}`);
    return res.status(200).json({ tags: Array.from(allTags) });
  } catch (err) {
    console.error('get-tags error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch tags' });
  }
}
// This is a new API route for fetching all tags for a location (subaccount) in GoHighLevel

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
    return res.status(500).json({ error: 'API key missing' });
  }

  // We'll fetch the first 1000 contacts and collect all unique tags.
  try {
    let allTags = new Set();
    let nextPage = 1;
    let hasMore = true;
    const pageLimit = 1000;
    while (hasMore && nextPage <= 5) { // up to 5000 contacts
      const resp = await fetch(
        `${GHL_API_CONTACTS_URL}?locationId=${locationId}&limit=${pageLimit}&page=${nextPage}`,
        {
          headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
          }
        }
      );
      if (!resp.ok) throw new Error('Failed to fetch contacts');
      const data = await resp.json();
      const contacts = Array.isArray(data.contacts) ? data.contacts : [];
      contacts.forEach(c => {
        if (Array.isArray(c.tags)) {
          c.tags.forEach(tag => allTags.add(tag));
        }
      });
      hasMore = data.pagination && data.pagination.hasMore;
      nextPage++;
      if (!hasMore) break;
    }
    return res.status(200).json({ tags: Array.from(allTags) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch tags' });
  }
}
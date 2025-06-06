export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_TOKEN = process.env.GHL_API_TOKEN;      // Your GHL API token (Bearer token)
  const ACCOUNT_ID = process.env.GHL_ACCOUNT_ID;    // Your subaccount ID

  if (!API_TOKEN || !ACCOUNT_ID) {
    return res.status(500).json({ error: 'Missing GHL_API_TOKEN or GHL_ACCOUNT_ID in environment variables' });
  }

  try {
    const url = new URL('https://api.gohighlevel.com/v1/contacts/v1/contacts');
    url.searchParams.append('accountId', ACCOUNT_ID);
    // You can add pagination parameters here if needed, e.g. page, limit

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
    // GHL returns contacts inside data.contacts array, confirm with their docs if needed
    res.status(200).json({ contacts: data.contacts || [] });

  } catch (error) {
    console.error('Error fetching contacts from GHL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

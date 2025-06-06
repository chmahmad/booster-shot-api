export default async function handler(req, res) {
  const { apiKey, locationId } = req.query;

  if (!apiKey || !locationId) {
    return res.status(400).json({ error: "Missing apiKey or locationId" });
  }

  try {
    const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

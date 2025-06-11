import Papa from "papaparse";

// Disable Next.js default body parsing for streaming
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Get the tab gid from the query, default to 0 (first tab)
  const gid = req.query.gid || "0";
  // Your Google Sheet ID
  const sheetId = "1WgpBMk5OUy-tHwSS2tM8lmGS_vrXg50Ws04llO8XUYI";
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch Google Sheet" });
    }
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    res.status(200).json(parsed.data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Unknown error" });
  }
}
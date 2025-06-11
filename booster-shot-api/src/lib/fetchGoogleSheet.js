import Papa from 'papaparse';

// Use a CORS proxy for frontend access. For production, use a server-side proxy!
const CORS_PROXY = "https://corsproxy.io/?";

/**
 * Fetches and parses a public Google Sheet as an array of objects.
 * @param {string} sheetId - The Google Sheet ID.
 * @param {number|string} [gid=0] - The sheet tab GID (default: 0, first tab).
 * @returns {Promise<Array<Object>>} - Resolves to array of row objects.
 */
export async function fetchGoogleSheet(sheetId, gid = 0) {
  if (!sheetId) throw new Error("sheetId is required");
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const proxiedUrl = CORS_PROXY + encodeURIComponent(csvUrl);
  return new Promise((resolve, reject) => {
    Papa.parse(proxiedUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: results => resolve(results.data),
      error: err => reject(err),
    });
  });
}
import Papa from 'papaparse';

// Use a CORS proxy for frontend access. For production, use a server-side proxy!
const CORS_PROXY = "https://corsproxy.io/?";

/**
 * Fetches and parses your public Google Sheet as an array of objects.
 * @param {number} [gid=0] - The sheet tab GID (default: 0, first tab).
 * @returns {Promise<Array<Object>>} - Resolves to array of row objects.
 */
export async function fetchGoogleSheet(gid = 0) {
  // Your sheet ID for https://docs.google.com/spreadsheets/d/1WgpBMk5OUy-tHwSS2tM8lmGS_vrXg50Ws04llO8XUYI/edit
  const sheetId = "1WgpBMk5OUy-tHwSS2tM8lmGS_vrXg50Ws04llO8XUYI";
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

// Example usage:
// fetchGoogleSheet() // or fetchGoogleSheet(0)
//   .then(rows => console.log(rows))
//   .catch(err => console.error(err));
import Papa from 'papaparse';

// Use a CORS proxy for frontend access. For production, use a server-side proxy!
const CORS_PROXY = "https://corsproxy.io/?";

/**
 * Fetches and parses a public Google Sheet as an array of objects.
 * @param {string} sheetId - The Google Sheet ID.
 * @param {number|string} [gid=0] - (Optional) The sheet GID/tab number.
 * @returns {Promise<Array<Object>>} - Resolves to array of row objects.
 */
export async function fetchGoogleSheet(sheetId, gid = 0) {
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
// fetchGoogleSheet('1WgpBMk5OUy-tHwSS2tM8lmGS_vrXg50Ws04llO8XUYI')
//   .then(rows => console.log(rows))
//   .catch(err => console.error(err));
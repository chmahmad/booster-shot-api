import Papa from 'papaparse';

/**
 * Fetches and parses the public Google Sheet as an array of objects.
 * @param {string} sheetId - The Google Sheet ID.
 * @param {number|string} [gid=0] - (Optional) The sheet GID/tab number.
 * @returns {Promise<Array<Object>>} - Resolves to array of row objects.
 *
 * NOTE: Google Sheets CSV export requires the sheet to be shared as "Anyone with the link".
 *       If you get CORS errors, you may need to use a CORS proxy for frontend apps.
 */
export async function fetchGoogleSheet(sheetId, gid = 0) {
  // Use the new sheet ID and correct URL format (no &id=... part)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  return new Promise((resolve, reject) => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: results => resolve(results.data),
      error: err => reject(err),
    });
  });
}

// Example usage (with your new sheet ID):
// fetchGoogleSheet('1WgpBMk5OUy-tHwSS2tM8lmGS_vrXg50Ws04llO8XUYI')
//   .then(rows => console.log(rows))
//   .catch(err => console.error(err));
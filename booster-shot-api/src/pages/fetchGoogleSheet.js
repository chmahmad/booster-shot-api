import Papa from 'papaparse';

/**
 * Fetches and parses the public Google Sheet as an array of objects.
 * @param {string} sheetId - The Google Sheet ID.
 * @param {number} [gid=0] - (Optional) The sheet GID/tab number.
 * @returns {Promise<Array<Object>>} - Resolves to array of row objects.
 */
export async function fetchGoogleSheet(sheetId, gid = 0) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}&gid=${gid}`;
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

// Example usage:
// fetchGoogleSheet('1VIg_-o7akUicqWX0CuVedozJW44UEM6vcQ-RCpvsdoE')
//   .then(rows => console.log(rows))
//   .catch(err => console.error(err));
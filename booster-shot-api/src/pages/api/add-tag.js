export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Clone body to prevent parsing issues
  const { contactIds, tag } = JSON.parse(JSON.stringify(req.body));

  if (!contactIds || !Array.isArray(contactIds) || !tag) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    // GHL Bulk Tagging Endpoint
    const ghlBulkUrl = 'https://rest.gohighlevel.com/v1/contacts/tags';
    
    // Process in batches to avoid timeout and rate limits
    const BATCH_SIZE = 100; // Number of contacts per batch
    const results = [];
    const totalBatches = Math.ceil(contactIds.length / BATCH_SIZE);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batchStart = batchNum * BATCH_SIZE;
      const batchEnd = Math.min((batchNum + 1) * BATCH_SIZE, contactIds.length);
      const batchIds = contactIds.slice(batchStart, batchEnd);

      try {
        const response = await fetch(ghlBulkUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactIds: batchIds,
            tags: [tag.trim()]
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // If bulk fails, fall back to individual tagging
          console.warn(`Bulk tagging failed for batch ${batchNum + 1}, falling back to individual`);
          const batchResults = await processIndividualTags(batchIds, tag);
          results.push(...batchResults);
        } else {
          // Bulk success - verify a sample of contacts
          const sampleSize = Math.min(5, batchIds.length);
          const sampleIds = batchIds.slice(0, sampleSize);
          const verificationResults = await verifyTags(sampleIds, tag);
          
          batchIds.forEach(contactId => {
            results.push({
              contactId,
              success: verificationResults.every(r => r.success),
              verified: verificationResults.every(r => r.success)
            });
          });
        }

        // Add delay between batches to avoid rate limiting
        if (batchNum < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error processing batch ${batchNum + 1}:`, error);
        batchIds.forEach(contactId => {
          results.push({
            contactId,
            success: false,
            error: error.message
          });
        });
      }
    }

    const allSuccess = results.every(r => r.success);
    return res.status(allSuccess ? 200 : 207).json({
      success: allSuccess,
      results,
      message: allSuccess ? 'All tags added successfully' : 
               'Tags processed with some failures'
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Fallback function for individual tagging
async function processIndividualTags(contactIds, tag) {
  const results = [];
  const MAX_RETRIES = 2;
  const BASE_DELAY = 500;

  for (const contactId of contactIds) {
    let retryCount = 0;
    let success = false;
    let lastError = '';

    while (retryCount < MAX_RETRIES && !success) {
      try {
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, BASE_DELAY * retryCount));
        }

        const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}/tags`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags: [tag] }),
        });

        if (response.status === 429) {
          lastError = 'Rate limit exceeded';
          retryCount++;
          continue;
        }

        const data = await response.json();
        if (!response.ok) {
          lastError = data.message || `HTTP ${response.status}`;
          retryCount++;
          continue;
        }

        success = true;
        results.push({ contactId, success: true });

      } catch (error) {
        lastError = error.message;
        retryCount++;
      }
    }

    if (!success) {
      results.push({ contactId, success: false, error: lastError });
    }

    // Small delay between individual requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// Verification function
async function verifyTags(contactIds, tag) {
  const results = [];
  
  for (const contactId of contactIds) {
    try {
      const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        },
      });

      const data = await response.json();
      const tagExists = data.tags?.includes(tag);
      results.push({ contactId, success: tagExists });
    } catch (error) {
      console.error(`Verification failed for ${contactId}:`, error);
      results.push({ contactId, success: false });
    }
  }

  return results;
}
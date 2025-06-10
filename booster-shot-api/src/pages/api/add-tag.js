export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { contactIds, tag } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || !tag) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const results = [];
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(contactIds.length / BATCH_SIZE);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batchStart = batchNum * BATCH_SIZE;
      const batchEnd = Math.min((batchNum + 1) * BATCH_SIZE, contactIds.length);
      const batchIds = contactIds.slice(batchStart, batchEnd);

      try {
        // Try bulk tagging first
        const bulkResponse = await fetch('https://rest.gohighlevel.com/v1/contacts/tags', {
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

        // Handle response properly
        const responseText = await bulkResponse.text();
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          responseData = { error: responseText };
        }

        if (!bulkResponse.ok) {
          throw new Error(responseData.error || `HTTP ${bulkResponse.status}: ${bulkResponse.statusText}`);
        }

        // If bulk succeeded, verify a sample
        const sampleIds = batchIds.slice(0, Math.min(5, batchIds.length));
        for (const contactId of sampleIds) {
          try {
            const verifyResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}`, {
              headers: {
                'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
              },
            });
            const contactData = await verifyResponse.json();
            const tagExists = contactData.tags?.includes(tag);
            
            results.push({
              contactId,
              success: tagExists,
              verified: tagExists
            });
          } catch (verifyError) {
            results.push({
              contactId,
              success: false,
              error: `Verification failed: ${verifyError.message}`
            });
          }
        }

        // Assume success for non-verified contacts in batch
        batchIds.forEach(contactId => {
          if (!sampleIds.includes(contactId)) {
            results.push({ contactId, success: true, verified: false });
          }
        });

      } catch (bulkError) {
        // Fallback to individual tagging if bulk fails
        console.warn(`Bulk tagging failed, falling back to individual: ${bulkError.message}`);
        const batchResults = await processIndividualTags(batchIds, tag);
        results.push(...batchResults);
      }

      // Add delay between batches
      if (batchNum < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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

async function processIndividualTags(contactIds, tag) {
  const results = [];
  const MAX_RETRIES = 2;
  const BASE_DELAY = 1000;

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

        // Handle response properly
        const responseText = await response.text();
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          responseData = { error: responseText };
        }

        if (response.status === 429) {
          lastError = 'Rate limit exceeded';
          retryCount++;
          continue;
        }

        if (!response.ok) {
          lastError = responseData.error || `HTTP ${response.status}: ${response.statusText}`;
          retryCount++;
          continue;
        }

        // Verify tag was added
        const verifyResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          },
        });
        const contactData = await verifyResponse.json();
        success = contactData.tags?.includes(tag);

        if (!success) {
          lastError = 'Tag not found after addition';
          retryCount++;
          continue;
        }

      } catch (error) {
        lastError = error.message;
        retryCount++;
      }
    }

    results.push({
      contactId,
      success,
      error: success ? undefined : lastError || 'Max retries exceeded'
    });

    // Small delay between individual requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}
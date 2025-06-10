export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { contactIds, tag } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || !tag) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    // First check rate limit status
    const rateLimitCheck = await fetch('https://rest.gohighlevel.com/v1/contacts', {
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`
      }
    });

    const remaining = parseInt(rateLimitCheck.headers.get('ratelimit-remaining') || '0');
    const resetTime = parseInt(rateLimitCheck.headers.get('ratelimit-reset') || '0');

    if (remaining <= 0) {
      const resetDate = new Date(Date.now() + resetTime * 1000);
      return res.status(429).json({
        error: `Rate limit exceeded. Resets at: ${resetDate.toISOString()}`,
        resetTime: resetTime
      });
    }

    // Process contacts
    const results = [];
    const MAX_RETRIES = 3;
    const BASE_DELAY = 2000;

    for (const contactId of contactIds) {
      let retryCount = 0;
      let success = false;
      let lastError = '';

      while (retryCount < MAX_RETRIES && !success) {
        try {
          if (retryCount > 0) {
            const delay = BASE_DELAY * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}/tags`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tags: [tag] }),
            timeout: 10000
          });

          // Handle text response first
          const responseText = await response.text();
          let responseData = {};

          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = { error: responseText };
          }

          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('ratelimit-reset') || '0');
            lastError = `Rate limit exceeded (resets in ${retryAfter}s)`;
            // Stop processing further, inform the user about rate limit and when to retry
            return res.status(429).json({
              error: `Rate limit exceeded. Resets at: ${new Date(Date.now() + retryAfter * 1000).toISOString()}`,
              results,
              resetTime: retryAfter
            });
          }

          if (!response.ok) {
            lastError = responseData.error || `HTTP ${response.status}`;
            retryCount++;
            continue;
          }

          // Verification
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

      // Enforce minimum delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return res.status(207).json({
      success: results.every(r => r.success),
      results,
      message: 'Processing complete'
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
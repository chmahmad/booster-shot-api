const GHL_API_KEY = process.env.GHL_API_KEY || process.env.GHL_API_TOKEN;
const GHL_API_URL = "https://rest.gohighlevel.com/v1/contacts";
const GHL_CUSTOM_VALUES_URL = "https://rest.gohighlevel.com/v1/custom-values";
const BATCH_SIZE = 100;      // GHL burst limit per 10 seconds
const BATCH_INTERVAL = 10_000; // 10 seconds in ms

// Custom Value ID for "Booster shot message"
const BOOSTER_SHOT_MESSAGE_ID = "ihlURpt2R0a74k2nCB0i";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { contactIds, tag, boosterShotMessage, locationId } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0 || !tag) {
    return res.status(400).json({ error: 'contactIds (array) and tag are required' });
  }

  if (!GHL_API_KEY) {
    return res.status(500).json({ error: 'API key missing' });
  }

  let results = [];
  let rateLimitHit = false;
  let resetTime = null;

  async function tagContact(contactId) {
    try {
      const response = await fetch(`${GHL_API_URL}/${contactId}/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags: [tag] })
      });

      if (response.status === 429) {
        // Rate limit hit
        const retryAfter = parseInt(response.headers.get('ratelimit-reset')) || 10;
        rateLimitHit = true;
        resetTime = retryAfter;
        return { contactId, success: false, error: 'Rate limit hit', resetTime: retryAfter };
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { contactId, success: false, error: errData.error || response.statusText };
      }

      return { contactId, success: true };
    } catch (err) {
      return { contactId, success: false, error: err.message || 'Unknown error' };
    }
  }

  // Tagging contacts in batches
  for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
    const batch = contactIds.slice(i, i + BATCH_SIZE);

    // Tag contacts in this batch in parallel (up to 100 at once)
    const batchResults = await Promise.all(batch.map(tagContact));
    results.push(...batchResults);

    // If a rate limit was hit, stop further processing
    if (rateLimitHit) {
      break;
    }

    // If there are more contacts, wait 10s before next batch
    if (i + BATCH_SIZE < contactIds.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_INTERVAL));
    }
  }

  // Set Custom Value for Booster Shot Message (location-wide)
  let customValueResult = null;
  if (boosterShotMessage && locationId) {
    try {
      const customValueRes = await fetch(`${GHL_CUSTOM_VALUES_URL}/${BOOSTER_SHOT_MESSAGE_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value: boosterShotMessage,
          locationId
        })
      });

      if (!customValueRes.ok) {
        const errData = await customValueRes.json().catch(() => ({}));
        customValueResult = { success: false, error: errData.error || customValueRes.statusText };
      } else {
        customValueResult = { success: true };
      }
    } catch (err) {
      customValueResult = { success: false, error: err.message || 'Unknown error' };
    }
  }

  if (rateLimitHit) {
    return res.status(429).json({
      error: `Rate limit exceeded. Try again after ${resetTime} seconds.`,
      results,
      resetTime,
      customValueResult
    });
  }

  // Success
  return res.status(200).json({ results, customValueResult });
}
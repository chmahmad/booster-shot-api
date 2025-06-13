// Simple in-memory storage (use Redis/database for production)
const messageStore = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { locationId, message, metadata } = req.body;

    if (!locationId || !message) {
      return res.status(400).json({ error: 'locationId and message are required' });
    }

    // Store the message with exact formatting preserved
    const messageData = {
      locationId,
      message: message, // Preserves exact spacing and formatting
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      receivedAt: Date.now()
    };

    // Store in memory (replace with database in production)
    messageStore.set(locationId, messageData);

    console.log(`Webhook received for location ${locationId}:`, messageData);

    return res.status(200).json({ 
      success: true, 
      message: 'Message stored successfully',
      locationId 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

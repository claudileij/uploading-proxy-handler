const axios = require('axios');

/**
 * Sends a webhook notification.
 * @param {string} url - The webhook URL to send the notification to.
 * @param {object} payload - The data to send in the webhook.
 */
const sendWebhook = async (url, payload) => {
  if (!url) {
    console.log('No webhook URL provided, skipping webhook.');
    return;
  }

  try {
    console.log(`Sending webhook to ${url} with payload:`, payload);
    await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Webhook sent successfully.');
  } catch (error) {
    // Log the error but don't let it fail the main request.
    // The client has already received the presigned URL.
    console.error('Error sending webhook:', error.message);
    if (error.response) {
      console.error('Webhook response error:', error.response.data);
    }
  }
};

module.exports = { sendWebhook };

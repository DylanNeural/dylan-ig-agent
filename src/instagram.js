const axios = require('axios');

const IG_API = 'https://graph.facebook.com/v19.0';

async function sendMessage(recipientId, text) {
  await axios.post(
    `${IG_API}/me/messages`,
    {
      recipient: { id: recipientId },
      message: { text }
    },
    {
      params: { access_token: process.env.META_PAGE_TOKEN }
    }
  );
}

async function markAsSeen(recipientId) {
  try {
    await axios.post(
      `${IG_API}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'mark_seen'
      },
      {
        params: { access_token: process.env.META_PAGE_TOKEN }
      }
    );
  } catch (e) {
    // Non critique, on ignore si ça échoue
  }
}

async function showTyping(recipientId) {
  try {
    await axios.post(
      `${IG_API}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on'
      },
      {
        params: { access_token: process.env.META_PAGE_TOKEN }
      }
    );
  } catch (e) {
    // Non critique
  }
}

module.exports = { sendMessage, markAsSeen, showTyping };

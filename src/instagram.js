const axios = require('axios');

const IG_API = 'https://graph.instagram.com/v21.0';

function authHeader() {
  return { Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}` };
}

async function sendMessage(recipientId, text) {
  await axios.post(
    `${IG_API}/me/messages`,
    {
      recipient: { id: recipientId },
      message: { text }
    },
    { headers: authHeader() }
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
      { headers: authHeader() }
    );
  } catch (e) {}
}

async function showTyping(recipientId) {
  try {
    await axios.post(
      `${IG_API}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on'
      },
      { headers: authHeader() }
    );
  } catch (e) {}
}

module.exports = { sendMessage, markAsSeen, showTyping };

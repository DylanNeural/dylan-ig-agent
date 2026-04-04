const axios = require('axios');

const IG_API = 'https://graph.facebook.com/v19.0';

function getIgId() {
  const id = process.env.IG_USER_ID;
  if (!id) throw new Error('IG_USER_ID manquant dans les variables d\'environnement');
  return id;
}

async function sendMessage(recipientId, text) {
  await axios.post(
    `${IG_API}/${getIgId()}/messages`,
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
      `${IG_API}/${getIgId()}/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'mark_seen'
      },
      {
        params: { access_token: process.env.META_PAGE_TOKEN }
      }
    );
  } catch (e) {}
}

async function showTyping(recipientId) {
  try {
    await axios.post(
      `${IG_API}/${getIgId()}/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on'
      },
      {
        params: { access_token: process.env.META_PAGE_TOKEN }
      }
    );
  } catch (e) {}
}

module.exports = { sendMessage, markAsSeen, showTyping };
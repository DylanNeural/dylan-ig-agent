require('dotenv').config();
const express = require('express');
const { generateReply } = require('./claude');
const { sendMessage, markAsSeen, showTyping } = require('./instagram');
const { getHistory, addMessage } = require('./memory');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

// ─── Vérification des variables d'environnement ───────────────────────────────
const requiredEnvVars = ['META_VERIFY_TOKEN', 'META_APP_SECRET', 'META_PAGE_TOKEN', 'OPENAI_API_KEY'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ Variable manquante dans .env : ${key}`);
    process.exit(1);
  }
}

// ─── GET /webhook — vérification Meta ─────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook vérifié par Meta');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️  Tentative de vérification échouée');
    res.sendStatus(403);
  }
});

// ─── POST /webhook — réception des messages ───────────────────────────────────
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== 'instagram') return;

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {

      // Ignorer les messages envoyés PAR Dylan (echo)
      if (event.message?.is_echo) continue;

      // Ignorer si pas de texte (stories, réactions, stickers...)
      const incomingText = event.message?.text;
      if (!incomingText) continue;

      const senderId = event.sender.id;
      console.log(`📩 Message de ${senderId} : ${incomingText}`);

      try {
        // 1. Marquer comme lu
        await markAsSeen(senderId);

        // 2. Afficher "en train d'écrire..."
        await showTyping(senderId);

        // 3. Récupérer l'historique de la conversation
        const history = getHistory(senderId);

        // 4. Ajouter un délai naturel (entre 1.5s et 3s selon la longueur du message)
        const typingDelay = Math.min(1500 + incomingText.length * 30, 3000);
        await sleep(typingDelay);

        // 5. Générer la réponse avec Claude
        const reply = await generateReply(history, incomingText);
        console.log(`💬 Réponse générée : ${reply}`);

        // 6. Sauvegarder dans la mémoire
        addMessage(senderId, 'user', incomingText);
        addMessage(senderId, 'assistant', reply);

        // 7. Envoyer la réponse
        await sendMessage(senderId, reply);
        console.log(`✅ Réponse envoyée à ${senderId}`);

      } catch (err) {
        console.error(`❌ Erreur pour ${senderId} :`, err.response?.data || err.message);
      }
    }
  }
});

// ─── GET / — health check ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', agent: 'Dylan IG Agent', uptime: process.uptime() });
});

// ─── Utilitaires ───────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Démarrage ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Dylan IG Agent démarré sur le port ${PORT}`);
  console.log(`📡 Webhook : POST /webhook`);
  console.log(`🏥 Health  : GET  /\n`);
});

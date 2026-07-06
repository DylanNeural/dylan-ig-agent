require('dotenv').config();
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const { generateReply, transcribeAudio } = require('./claude');
const { sendMessage, markAsSeen, showTyping } = require('./instagram');
const { getHistory, addMessage } = require('./memory');
const { isEnabled, setEnabled } = require('./state');

const app = express();
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

// ─── Vérification des variables d'environnement ───────────────────────────────
const requiredEnvVars = ['META_VERIFY_TOKEN', 'IG_APP_SECRET', 'IG_ACCESS_TOKEN', 'OPENAI_API_KEY', 'ADMIN_TOKEN'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ Variable manquante dans .env : ${key}`);
    process.exit(1);
  }
}

// ─── Vérification de la signature Meta (X-Hub-Signature-256) ──────────────────
function isValidSignature(req) {
  const signature = req.get('x-hub-signature-256');
  if (!signature) return false;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.IG_APP_SECRET)
    .update(req.rawBody)
    .digest('hex');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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
  if (!isValidSignature(req)) {
    console.warn('⚠️  Signature webhook invalide — requête rejetée');
    return res.sendStatus(401);
  }
  res.sendStatus(200);

  const body = req.body;
  if (body.object !== 'instagram') return;

  if (!isEnabled()) {
    console.log('⏸️  Bot en pause — message ignoré');
    return;
  }

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {

      // Ignorer les messages envoyés PAR Dylan (echo)
      if (event.message?.is_echo) continue;

      const senderId = event.sender.id;
      const audioAttachment = event.message?.attachments?.find(a => a.type === 'audio');

      // Ignorer si pas de texte ni de vocal (stories, images, réactions, stickers...)
      let incomingText = event.message?.text;
      if (!incomingText && !audioAttachment) continue;

      try {
        // 0. Transcrire le vocal si besoin
        if (!incomingText && audioAttachment) {
          incomingText = await transcribeAudio(audioAttachment.payload.url);
          console.log(`🎙️  Vocal transcrit de ${senderId} : ${incomingText}`);
        } else {
          console.log(`📩 Message de ${senderId} : ${incomingText}`);
        }

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

// ─── GET /health — health check ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: 'Dylan IG Agent', uptime: process.uptime() });
});

// ─── GET /api/status — état public (activé / en pause) ────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ enabled: isEnabled() });
});

// ─── POST /api/toggle — activer/désactiver le bot (protégé) ───────────────────
app.post('/api/toggle', (req, res) => {
  if (req.get('authorization') !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.sendStatus(401);
  }
  const enabled = !isEnabled();
  setEnabled(enabled);
  console.log(enabled ? '▶️  Bot réactivé' : '⏸️  Bot mis en pause');
  res.json({ enabled });
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

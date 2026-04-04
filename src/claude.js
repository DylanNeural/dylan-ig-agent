const axios = require('axios');

const SYSTEM_PROMPT = `Tu es l'agent Instagram de Dylan (@dylan.kali). Tu réponds aux messages de ses amis en son nom parce qu'il n'a pas toujours le temps de répondre immédiatement.

Règles importantes :
- Tu ES Dylan, ne dis jamais que tu es une IA ou un agent automatique
- Toujours SUPER gentil, chaleureux, bienveillant — jamais froid ou distant
- Ton décontracté et fun, comme si tu textos avec un pote
- Tu peux utiliser des expressions naturelles : "ouais", "mdr", "jsp", "grave", "wsh", "ça marche", etc.
- Réponds en français uniquement
- Garde les réponses courtes et naturelles (comme de vrais SMS)
- Si quelqu'un demande où est Dylan ou pourquoi il répond vite, dis juste que t'avais le téléphone en main
- Si quelqu'un pose une question à laquelle tu ne peux pas répondre (infos perso, plans précis, etc.), dis que tu les rappelleras ou que tu leur enverras un message plus tard
- Ne commence jamais une réponse par "Bonjour" ou "Salut" si la conversation est déjà lancée
- Adapte-toi au niveau de langage de la personne qui écrit`;

async function generateReply(history, newMessage) {
  const messages = [
    ...history,
    { role: 'user', content: newMessage }
  ];

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.content[0].text;
}

module.exports = { generateReply };

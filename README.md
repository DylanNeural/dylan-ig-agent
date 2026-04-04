# Dylan IG Agent 🤖

Agent Instagram automatique — répond aux DMs de tes amis en ton nom, avec un ton décontracté et super gentil.

---

## Ce que fait l'agent

- Reçoit les DMs Instagram en temps réel via webhook
- Affiche "vu" et "en train d'écrire..." avant de répondre (comportement naturel)
- Génère une réponse avec Claude (Anthropic) en se faisant passer pour toi
- Se souvient des conversations (mémoire persistante par utilisateur)
- Répond en français, ton décontracté et fun

---

## Prérequis

- Node.js 18+
- Un compte Instagram Pro (Business ou Créateur)
- Une Page Facebook liée à ce compte Instagram
- Un compte sur [railway.app](https://railway.app)
- Une clé API Anthropic → [console.anthropic.com](https://console.anthropic.com)

---

## Étape 1 — Créer l'app Meta

1. Va sur [developers.facebook.com](https://developers.facebook.com) → **Mes apps → Créer une app**
2. Choisis **Business** comme type
3. Donne-lui un nom (ex: "Dylan Agent")
4. Une fois créée, dans le dashboard :
   - **Ajouter un produit** → **Instagram** → Configurer
   - **Ajouter un produit** → **Webhooks** → Configurer

### Récupérer l'App Secret
- Va dans **Paramètres → Avancés**
- Copie l'**App Secret** → c'est ta variable `META_APP_SECRET`

### Connecter ton compte Instagram
- Va dans **Instagram → Paramètres de base**
- Connecte ton compte Instagram Pro
- Ajoute les permissions : `instagram_manage_messages` et `pages_messaging`

### Générer le Page Access Token
- Va dans **Instagram → Génération de token**
- Sélectionne ta Page Facebook liée
- Génère et copie le token → c'est ta variable `META_PAGE_TOKEN`

> ⚠️ Le token expire. Pour un token permanent, utilise l'[outil de débogage de token](https://developers.facebook.com/tools/debug/accesstoken/) pour l'échanger contre un token longue durée.

---

## Étape 2 — Installation locale

```bash
# Clone ou décompresse le projet
cd dylan-ig-agent

# Installe les dépendances
npm install

# Crée ton fichier .env
cp .env.example .env
```

Remplis le fichier `.env` :

```env
META_VERIFY_TOKEN=un_token_que_tu_inventes_toi_meme
META_APP_SECRET=ton_app_secret_meta
META_PAGE_TOKEN=ton_page_access_token
ANTHROPIC_API_KEY=ta_cle_anthropic
PORT=3000
```

---

## Étape 3 — Déploiement sur Railway

### 3a. Crée un repo GitHub

```bash
git init
git add .
git commit -m "initial commit"
# Crée un repo sur github.com puis :
git remote add origin https://github.com/TON_USER/dylan-ig-agent.git
git push -u origin main
```

### 3b. Déploie sur Railway

1. Va sur [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Sélectionne ton repo `dylan-ig-agent`
3. Railway détecte automatiquement Node.js et lance `node src/index.js`

### 3c. Ajoute les variables d'environnement

Dans Railway → ton projet → **Variables**, ajoute :

| Clé | Valeur |
|-----|--------|
| `META_VERIFY_TOKEN` | le token que t'as inventé |
| `META_APP_SECRET` | ton app secret Meta |
| `META_PAGE_TOKEN` | ton page access token |
| `ANTHROPIC_API_KEY` | ta clé Anthropic |

Railway gère `PORT` automatiquement, pas besoin de l'ajouter.

### 3d. Récupère ton URL publique

Dans Railway → ton projet → **Settings → Domains** → génère un domaine.
Tu obtiens quelque chose comme `https://dylan-ig-agent.up.railway.app`

---

## Étape 4 — Connecter le webhook Meta

1. Dans ton app Meta → **Webhooks → Instagram → Configurer**
2. Remplis :
   - **URL de rappel** : `https://TON_URL.railway.app/webhook`
   - **Token de vérification** : la valeur de `META_VERIFY_TOKEN`
3. Clique **Vérifier et enregistrer**
4. Dans les **champs d'abonnement**, coche `messages` → **S'abonner**

✅ Si la vérification passe, ton agent est en ligne.

---

## Étape 5 — Test

Demande à un ami de t'envoyer un DM Instagram.

Dans les logs Railway tu dois voir :
```
📩 Message de 1234567890 : wsh t'es là ?
💬 Réponse générée : ouais ouais je suis là, quoi de neuf !
✅ Réponse envoyée à 1234567890
```

---

## Structure du projet

```
dylan-ig-agent/
├── src/
│   ├── index.js      ← Serveur Express + gestion webhook
│   ├── claude.js     ← Appel API Anthropic + prompt système
│   ├── instagram.js  ← Envoi messages + actions (vu, typing)
│   └── memory.js     ← Mémoire persistante des conversations
├── .env.example      ← Template des variables d'environnement
├── .gitignore
├── package.json
├── railway.json      ← Config déploiement Railway
└── README.md
```

---

## Personnaliser le comportement de l'agent

Tout se passe dans `src/claude.js`, dans la constante `SYSTEM_PROMPT`.

Tu peux modifier :
- Le ton général
- Les règles de réponse
- Ce que l'agent doit dire ou ne jamais dire
- La longueur des réponses

---

## Problèmes courants

**Le webhook ne se vérifie pas**
→ Vérifie que `META_VERIFY_TOKEN` dans Railway est identique à ce que t'as mis dans Meta

**"Token invalide" dans les logs**
→ Ton `META_PAGE_TOKEN` a expiré, génère-en un nouveau dans Meta et mets à jour Railway

**L'agent ne répond pas**
→ Vérifie dans Meta que l'abonnement au champ `messages` est bien actif

**Erreur 403 de l'API Anthropic**
→ Ta clé `ANTHROPIC_API_KEY` est incorrecte ou tu n'as pas de crédits

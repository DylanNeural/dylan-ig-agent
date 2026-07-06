const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'state.json');

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Erreur chargement état:', e.message);
  }
  return { enabled: true };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Erreur sauvegarde état:', e.message);
  }
}

let state = loadState();

function isEnabled() {
  return state.enabled;
}

function setEnabled(value) {
  state.enabled = value;
  saveState(state);
}

module.exports = { isEnabled, setEnabled };

const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '..', 'memory.json');
const MAX_MESSAGES_PER_USER = 20;

function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Erreur chargement mémoire:', e.message);
  }
  return {};
}

function saveMemory(memory) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (e) {
    console.error('Erreur sauvegarde mémoire:', e.message);
  }
}

let memory = loadMemory();

function getHistory(userId) {
  return memory[userId] || [];
}

function addMessage(userId, role, content) {
  if (!memory[userId]) {
    memory[userId] = [];
  }
  memory[userId].push({ role, content });

  if (memory[userId].length > MAX_MESSAGES_PER_USER) {
    memory[userId] = memory[userId].slice(-MAX_MESSAGES_PER_USER);
  }

  saveMemory(memory);
}

function clearHistory(userId) {
  delete memory[userId];
  saveMemory(memory);
}

module.exports = { getHistory, addMessage, clearHistory };

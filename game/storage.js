/* ══════════════════════════════════════
   OSKAR BEACH STORIES - SAVE SYSTEM
   Versioned, migration-safe localStorage
══════════════════════════════════════ */

const SAVE_KEY = 'oskar_player_data';
const CURRENT_SAVE_VERSION = 2;

const DEFAULT_PLAYER_DATA = {
  saveVersion: CURRENT_SAVE_VERSION,
  name: '',
  bones: 0,
  achievements: [],
  statistics: {
    gamesPlayed: 0,
    level1Completed: 0,
    level2Completed: 0,
    level3Completed: 0,
    level4Completed: 0,
    level5Completed: 0,
    level6Completed: 0,
    level7Completed: 0,
    level8Completed: 0,
    totalPlayTime: 0,
    bubblePopsTotal: 0,
    bubbleGamesPlayed: 0,
    bubbleLevelWins: 0,
    bestBubbleScore: 0,
    froggerGamesPlayed: 0,
    froggerLevelWins: 0,
    bestFroggerTime: 0,
  },
  highscores: {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
    level6: 0,
    level7: 0,
    level8: 0,
  },
  dailyChallenges: {}
};

function migrateSaveData(data) {
  if (!data || typeof data !== 'object') return { ...DEFAULT_PLAYER_DATA };

  if (!data.saveVersion) data.saveVersion = 0;

  // v0 → v1
  if (data.saveVersion < 1) {
    data.saveVersion = 1;
    if (typeof data.bones !== 'number') data.bones = 0;
    if (!Array.isArray(data.achievements)) data.achievements = [];
    if (!data.statistics || typeof data.statistics !== 'object') data.statistics = { ...DEFAULT_PLAYER_DATA.statistics };
    if (!data.highscores || typeof data.highscores !== 'object') data.highscores = { ...DEFAULT_PLAYER_DATA.highscores };
    if (!data.dailyChallenges || typeof data.dailyChallenges !== 'object') data.dailyChallenges = {};
  }

  // v1 → v2: remove crab stats, add bubble + frogger + level8
  if (data.saveVersion < 2) {
    data.saveVersion = 2;
    if (data.statistics) {
      delete data.statistics.crabsCaughtTotal;
      delete data.statistics.crabGamesPlayed;
      delete data.statistics.crabLevelWins;
      delete data.statistics.bestCrabRoundTime;
    }
  }

  const filled = { ...DEFAULT_PLAYER_DATA, ...data };
  filled.statistics = { ...DEFAULT_PLAYER_DATA.statistics, ...data.statistics };
  filled.highscores = { ...DEFAULT_PLAYER_DATA.highscores, ...data.highscores };

  return filled;
}

function loadPlayerData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_PLAYER_DATA };
    const parsed = JSON.parse(raw);
    return migrateSaveData(parsed);
  } catch (e) {
    console.warn('[Storage] Failed to load save data, using defaults:', e);
    return { ...DEFAULT_PLAYER_DATA };
  }
}

function savePlayerData(data) {
  try {
    data.saveVersion = CURRENT_SAVE_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[Storage] Failed to save data:', e);
  }
}

function updateHighscore(level, score) {
  const data = loadPlayerData();
  const key = `level${level}`;
  if (score > (data.highscores[key] || 0)) {
    data.highscores[key] = score;
    savePlayerData(data);
  }
}

function incrementStat(statKey, amount = 1) {
  const data = loadPlayerData();
  if (data.statistics[statKey] !== undefined) {
    data.statistics[statKey] += amount;
    savePlayerData(data);
  }
}

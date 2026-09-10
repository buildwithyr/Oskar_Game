/* ══════════════════════════════════════
   OSKAR BEACH STORIES - SAVE SYSTEM
   Versioned, migration-safe localStorage
══════════════════════════════════════ */

const SAVE_KEY = 'oskar_player_data';
const CURRENT_SAVE_VERSION = 6;

// Factory statt geteiltem Objekt: jeder Aufruf liefert eine frische,
// tiefe Kopie. Ein einfaches `{ ...DEFAULT_PLAYER_DATA }` würde die
// verschachtelten Objekte (statistics, highscores, ...) nur per Referenz
// teilen – jede Änderung an den Statistiken eines Spielstands hätte dann
// auch den nächsten "leeren" Spielstand verändert.
function createDefaultPlayerData() {
  return {
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
      froggerGamesPlayed: 0,
      froggerLevelWins: 0,
      bestFroggerTime: 0,
      danceGamesPlayed: 0,
      danceLevelWins: 0,
      digGamesPlayed: 0,
      digLevelWins: 0,
      run3dGamesPlayed: 0,
      run3dLevelWins: 0,
      totalBonesEarned: 0,   // steigt nur, zählt nie runter – Basis für das Sammelalbum
    },
    // "Höher ist besser" passt nicht für jedes Level: Beach Run (Meter) und
    // Candy Match (Punkte) ja, aber Buddel-Spaß oder Strandpromenade wären
    // z.B. mit wenigen Versuchen/schneller Zeit besser dran. Die aktuellen
    // Level nutzen alle einen aufsteigenden Punkte-/Distanz-/Zähl-Wert, das
    // Schema bleibt hier absichtlich generisch (höher = besser) und lässt
    // Raum für künftige Level mit anderer Metrik.
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
    dailyChallenges: {},
    collection: {},          // Sammelalbum: { itemId: true }
    settings: createDefaultSettings(),
  };
}

function createDefaultSettings() {
  return {
    vibration: true,
    reducedMotion: false,
    largeText: false,
  };
}

// Rückwärtskompatibel: Code, der noch die alte Konstante importiert/liest,
// bekommt weiterhin ein Default-Objekt (aber bitte createDefaultPlayerData()
// für neue Stellen verwenden, s.o.).
const DEFAULT_PLAYER_DATA = createDefaultPlayerData();

function migrateSaveData(data) {
  if (!data || typeof data !== 'object') return createDefaultPlayerData();

  if (!data.saveVersion) data.saveVersion = 0;

  // v0 → v1
  if (data.saveVersion < 1) {
    data.saveVersion = 1;
    if (typeof data.bones !== 'number') data.bones = 0;
    if (!Array.isArray(data.achievements)) data.achievements = [];
    if (!data.statistics || typeof data.statistics !== 'object') data.statistics = createDefaultPlayerData().statistics;
    if (!data.highscores || typeof data.highscores !== 'object') data.highscores = createDefaultPlayerData().highscores;
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

  // v2 → v3: add dance and dig levels
  if (data.saveVersion < 3) {
    data.saveVersion = 3;
  }

  // v3 → v4: add pseudo-3D runner
  if (data.saveVersion < 4) {
    data.saveVersion = 4;
  }

  // v4 → v5: compact the remaining level progress from the previous 11-slot
  // layout down to the current 8-slot layout.
  if (data.saveVersion < 5) {
    const oldStats = data.statistics || {};
    const oldScores = data.highscores || {};

    data.statistics = {
      ...oldStats,
      level1Completed: oldStats.level1Completed || 0,
      level2Completed: oldStats.level3Completed || 0,
      level3Completed: oldStats.level4Completed || 0,
      level4Completed: oldStats.level5Completed || 0,
      level5Completed: oldStats.level8Completed || 0,
      level6Completed: oldStats.level9Completed || 0,
      level7Completed: oldStats.level10Completed || 0,
      level8Completed: oldStats.level11Completed || 0,
    };

    data.highscores = {
      level1: oldScores.level1 || 0,
      level2: oldScores.level3 || 0,
      level3: oldScores.level4 || 0,
      level4: oldScores.level5 || 0,
      level5: oldScores.level8 || 0,
      level6: oldScores.level9 || 0,
      level7: oldScores.level10 || 0,
      level8: oldScores.level11 || 0,
    };

    data.saveVersion = 5;
  }

  // v5 → v6: Beach Run (Level 2) und Candy Match (Level 3) hatten durch die
  // Funktionsnamen-Kollision (beide hießen l3StopGame) einen Bug: Beach-Run-
  // Verluste schrieben den Highscore fälschlich unter "level3" statt
  // "level2". Alter, versehentlich unter level3 gelandeter Fortschritt wird
  // hier zum echten level2-Highscore gerettet, sofern level2 noch leer war;
  // außerdem kommen jetzt Sammelalbum und Einstellungen dazu.
  if (data.saveVersion < 6) {
    if (data.highscores) {
      if ((data.highscores.level2 || 0) === 0 && (data.highscores.level3 || 0) > 0) {
        data.highscores.level2 = data.highscores.level3;
      }
    }
    if (!data.collection || typeof data.collection !== 'object') data.collection = {};
    if (!data.settings || typeof data.settings !== 'object') data.settings = createDefaultSettings();
    data.saveVersion = 6;
  }

  const defaults = createDefaultPlayerData();
  const filled = { ...defaults, ...data };
  filled.statistics = { ...defaults.statistics, ...data.statistics };
  filled.highscores = { ...defaults.highscores, ...data.highscores };
  filled.settings    = { ...defaults.settings, ...data.settings };
  filled.collection  = { ...(data.collection && typeof data.collection === 'object' ? data.collection : {}) };
  filled.dailyChallenges = (data.dailyChallenges && typeof data.dailyChallenges === 'object') ? data.dailyChallenges : {};
  filled.achievements = Array.isArray(data.achievements) ? data.achievements : [];

  // Remove keys for deleted or formerly higher-numbered levels after merge.
  for (const key of [
    'level9Completed', 'level10Completed', 'level11Completed',
    'bubblePopsTotal', 'bubbleGamesPlayed', 'bubbleLevelWins', 'bestBubbleScore'
  ]) {
    delete filled.statistics[key];
  }
  for (const key of ['level9', 'level10', 'level11']) {
    delete filled.highscores[key];
  }

  return sanitizePlayerData(filled);
}

// Sinnvolle Validierung: nie negative/NaN-Zahlen, keine kaputten Typen.
// Verhindert, dass ein manuell editiertes oder korruptes localStorage die
// App zum Absturz bringt.
function sanitizePlayerData(data) {
  data.bones = Number.isFinite(data.bones) && data.bones >= 0 ? Math.floor(data.bones) : 0;
  data.name = typeof data.name === 'string' ? data.name.slice(0, 40) : '';

  for (const key of Object.keys(data.statistics || {})) {
    const v = data.statistics[key];
    data.statistics[key] = Number.isFinite(v) && v >= 0 ? v : 0;
  }
  for (const key of Object.keys(data.highscores || {})) {
    const v = data.highscores[key];
    data.highscores[key] = Number.isFinite(v) && v >= 0 ? v : 0;
  }
  if (typeof data.settings !== 'object' || !data.settings) data.settings = createDefaultSettings();
  data.settings.vibration     = data.settings.vibration !== false;
  data.settings.reducedMotion = data.settings.reducedMotion === true;
  data.settings.largeText     = data.settings.largeText === true;

  return data;
}

function loadPlayerData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultPlayerData();
    const parsed = JSON.parse(raw);
    return migrateSaveData(parsed);
  } catch (e) {
    console.warn('[Storage] Failed to load save data, using defaults:', e);
    return createDefaultPlayerData();
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

// ── Export / Import (Phase 3.2) ──────────────────────────────────
// Kein Cloud-Sync nötig: der Spielstand lässt sich als JSON-Datei
// sichern und auf einem anderen Gerät/Browser wieder einspielen.
function exportPlayerDataString() {
  return JSON.stringify(loadPlayerData(), null, 2);
}

// Gibt { ok: true } oder { ok: false, error } zurück, ohne zu werfen –
// der Aufrufer (Settings-UI) kann so kindgerecht Erfolg/Fehler anzeigen.
function importPlayerDataString(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Das ist kein gültiger Spielstand.' };
    }
    const migrated = migrateSaveData(parsed);
    savePlayerData(migrated);
    return { ok: true, data: migrated };
  } catch (e) {
    return { ok: false, error: 'Datei konnte nicht gelesen werden.' };
  }
}

// Node-Testhaken (im Browser wirkungslos, da `module` dort nicht existiert).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CURRENT_SAVE_VERSION,
    createDefaultPlayerData,
    createDefaultSettings,
    migrateSaveData,
    sanitizePlayerData,
  };
}

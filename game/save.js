/* ══════════════════════════════════════
   CENTRAL SAVE SYSTEM — Update-safe
   Version history:
   v1 → initial
   v2 → added memoryGamesWon, findLetterSolved, matchScore, gameCounts
══════════════════════════════════════ */

const SAVE_KEY = 'oskar_beach_stories'
const CURRENT_SAVE_VERSION = 2

const DEFAULT_PLAYER_DATA = {
  saveVersion: 2,
  name: "",
  bones: 0,
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    totalPlayTimeMs: 0,
    snacksCaught: 0,
    mazesSolved: 0,
    memoryPairsFound: 0,
    memoryGamesWon: 0,
    letterPuzzlesSolved: 0,
    findLetterSolved: 0,
    beachRunMeters: 0,
    matchScore: 0,
    gameCounts: {
      level1: 0, level2: 0, level3: 0, level4: 0,
      level5: 0, level6: 0, level7: 0
    }
  },
  highscores: {
    snackHunt: 0,
    beachRun: 0,
    memory: 0,
    matchScore: 0,
    letterGame: 0,
    findLetter: 0
  },
  achievements: [],
  dailyChallenges: {
    date: "",
    challenges: [],
    progress: {},
    bonusCollected: false
  }
}

let playerData = null

function loadPlayerData() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) {
      playerData = _deepClone(DEFAULT_PLAYER_DATA)
      return playerData
    }
    const parsed = JSON.parse(raw)
    playerData = migrateSaveData(parsed)
    savePlayerData()
    return playerData
  } catch(e) {
    console.warn('Save data load error, resetting:', e)
    playerData = _deepClone(DEFAULT_PLAYER_DATA)
    savePlayerData()
    return playerData
  }
}

function savePlayerData() {
  if (!playerData) return
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(playerData))
  } catch(e) {
    console.warn('Could not save player data:', e)
  }
}

function migrateSaveData(data) {
  if (!data || typeof data !== 'object') {
    return _deepClone(DEFAULT_PLAYER_DATA)
  }
  const result = _deepMergeDefaults(_deepClone(DEFAULT_PLAYER_DATA), data)

  const v = result.saveVersion || 1
  if (v < 2) {
    // v1→v2: new fields already filled by _deepMergeDefaults with defaults
  }

  result.saveVersion = CURRENT_SAVE_VERSION
  return result
}

function _deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function _deepMergeDefaults(defaults, source) {
  const result = _deepClone(defaults)
  for (const key of Object.keys(source)) {
    if (source[key] === null || source[key] === undefined) continue
    const srcIsPlainObj = typeof source[key] === 'object' && !Array.isArray(source[key])
    const defIsPlainObj = typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])
    if (srcIsPlainObj && defIsPlainObj) {
      result[key] = _deepMergeDefaults(result[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

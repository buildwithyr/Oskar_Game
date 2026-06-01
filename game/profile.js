/* ══════════════════════════════════════
   PROFILE — Bones, Achievements, Daily Challenges, Stats
══════════════════════════════════════ */

// ── Bone Rewards ─────────────────────────────────────────────
const BONE_REWARDS = {
  SNACK_HUNT_WIN:  10,
  MAZE_WIN:        15,
  BEACH_RUN_WIN:   20,
  MEMORY_WIN:      15,
  MATCH_WIN:       10,
  LETTER_WIN:       5,
  FIND_LETTER_WIN:  5,
  DAILY_BONUS:     25
}

// ── Achievement Definitions ───────────────────────────────────
const ACHIEVEMENTS_DEF = [
  {
    id: 'first_steps', icon: '🐾', title: 'Erste Schritte',
    desc: 'Spiele ein Spiel',
    check: (s) => s.gamesPlayed >= 1
  },
  {
    id: 'bone_hunter', icon: '🦴', title: 'Knochenjäger',
    desc: 'Sammle 100 Knochen',
    check: (s, p) => p.bones >= 100
  },
  {
    id: 'snack_pro', icon: '🍖', title: 'Snack-Profi',
    desc: 'Fange 100 Leckerlis',
    check: (s) => s.snacksCaught >= 100
  },
  {
    id: 'maze_master', icon: '🌴', title: 'Labyrinth-Meister',
    desc: 'Löse 10 Labyrinthe',
    check: (s) => s.mazesSolved >= 10
  },
  {
    id: 'beach_runner', icon: '🥏', title: 'Strandläufer',
    desc: 'Laufe insgesamt 1000 Meter',
    check: (s) => s.beachRunMeters >= 1000
  },
  {
    id: 'memory_pro', icon: '🧠', title: 'Gedächtnis-Profi',
    desc: 'Gewinne 20 Memory-Spiele',
    check: (s) => s.memoryGamesWon >= 20
  },
  {
    id: 'letter_friend', icon: '🔤', title: 'Buchstabenfreund',
    desc: 'Löse 50 Buchstabenrätsel',
    check: (s) => (s.letterPuzzlesSolved + s.findLetterSolved) >= 50
  },
  {
    id: 'legend', icon: '🏆', title: 'Oskar-Legende',
    desc: 'Schalte alle anderen Erfolge frei',
    check: (s, p) => {
      const others = ACHIEVEMENTS_DEF.filter(a => a.id !== 'legend')
      return others.every(a => p.achievements.includes(a.id))
    }
  }
]

// ── Daily Challenges Pool ─────────────────────────────────────
const DAILY_CHALLENGES_POOL = [
  { id: 'catch_20',   text: 'Fange 20 Leckerlis',        type: 'snacksCaught',      goal: 20  },
  { id: 'run_200',    text: 'Laufe 200 Meter',            type: 'beachRunMeters',    goal: 200 },
  { id: 'win_memory', text: 'Gewinne ein Memory-Spiel',   type: 'memoryGamesWon',    goal: 1   },
  { id: 'letters_5',  text: 'Löse 5 Buchstabenrätsel',   type: 'letterPuzzlesSolved', goal: 5 },
  { id: 'maze_1',     text: 'Löse ein Labyrinth',         type: 'mazesSolved',       goal: 1   },
  { id: 'find_10',    text: 'Finde 10 Buchstaben',        type: 'findLetterSolved',  goal: 10  }
]

// ── Award Bones ───────────────────────────────────────────────
function awardBones(amount, reason) {
  if (!playerData) return
  playerData.bones += amount
  savePlayerData()
  updateMenuBones()
  if (reason) showToast(`🦴 +${amount} Knochen! ${reason}`)
}

// ── Stat & Game-Count Tracking ────────────────────────────────
function incrementGameCount(levelKey) {
  if (!playerData) return
  playerData.stats.gamesPlayed++
  if (playerData.stats.gameCounts && levelKey in playerData.stats.gameCounts) {
    playerData.stats.gameCounts[levelKey]++
  }
  savePlayerData()
}

function addPlayTime(ms) {
  if (!playerData) return
  playerData.stats.totalPlayTimeMs = (playerData.stats.totalPlayTimeMs || 0) + ms
  savePlayerData()
}

function updateHighscore(key, value) {
  if (!playerData) return false
  if (value > (playerData.highscores[key] || 0)) {
    playerData.highscores[key] = value
    savePlayerData()
    return true
  }
  return false
}

// ── Level Win Handlers ────────────────────────────────────────

function onLevel1Win(snacksCaught, playTimeMs) {
  if (!playerData) return
  playerData.stats.gamesWon++
  playerData.stats.snacksCaught += snacksCaught
  addPlayTime(playTimeMs || 0)
  updateHighscore('snackHunt', snacksCaught)
  savePlayerData()
  awardBones(BONE_REWARDS.SNACK_HUNT_WIN, 'Snack Hunt gewonnen!')
  updateDailyProgress('snacksCaught', snacksCaught)
  checkAchievements()
}

function onLevel2Win(playTimeMs) {
  if (!playerData) return
  playerData.stats.gamesWon++
  playerData.stats.mazesSolved++
  addPlayTime(playTimeMs || 0)
  savePlayerData()
  awardBones(BONE_REWARDS.MAZE_WIN, 'Labyrinth gelöst!')
  updateDailyProgress('mazesSolved', 1)
  checkAchievements()
}

function onLevel3Win(meters, playTimeMs) {
  if (!playerData) return
  playerData.stats.gamesWon++
  playerData.stats.beachRunMeters += Math.floor(meters)
  addPlayTime(playTimeMs || 0)
  updateHighscore('beachRun', Math.floor(meters))
  savePlayerData()
  awardBones(BONE_REWARDS.BEACH_RUN_WIN, 'Beach Run geschafft!')
  updateDailyProgress('beachRunMeters', Math.floor(meters))
  checkAchievements()
}

function onLevel4Win(score, playTimeMs) {
  if (!playerData) return
  playerData.stats.gamesWon++
  playerData.stats.matchScore = (playerData.stats.matchScore || 0) + score
  addPlayTime(playTimeMs || 0)
  updateHighscore('matchScore', score)
  savePlayerData()
  awardBones(BONE_REWARDS.MATCH_WIN, 'Candy Match gewonnen!')
  checkAchievements()
}

function onLevel5Win(playTimeMs) {
  if (!playerData) return
  playerData.stats.gamesWon++
  playerData.stats.memoryGamesWon++
  playerData.stats.memoryPairsFound += 6
  addPlayTime(playTimeMs || 0)
  updateHighscore('memory', playerData.stats.memoryGamesWon)
  savePlayerData()
  awardBones(BONE_REWARDS.MEMORY_WIN, 'Memory gewonnen!')
  updateDailyProgress('memoryGamesWon', 1)
  checkAchievements()
}

function onLevel6Win(questionsAnswered, playTimeMs) {
  if (!playerData) return
  playerData.stats.gamesWon++
  playerData.stats.letterPuzzlesSolved += questionsAnswered
  addPlayTime(playTimeMs || 0)
  savePlayerData()
  awardBones(BONE_REWARDS.LETTER_WIN, 'Buchstaben-Rätsel gelöst!')
  updateDailyProgress('letterPuzzlesSolved', questionsAnswered)
  checkAchievements()
}

function onLevel7Win(roundsCompleted, playTimeMs) {
  if (!playerData) return
  playerData.stats.gamesWon++
  playerData.stats.findLetterSolved += roundsCompleted
  addPlayTime(playTimeMs || 0)
  savePlayerData()
  awardBones(BONE_REWARDS.FIND_LETTER_WIN, 'Buchstaben gefunden!')
  updateDailyProgress('findLetterSolved', roundsCompleted)
  checkAchievements()
}

// ── Achievements ──────────────────────────────────────────────
function checkAchievements() {
  if (!playerData) return
  const newUnlocks = []
  for (const ach of ACHIEVEMENTS_DEF) {
    if (playerData.achievements.includes(ach.id)) continue
    try {
      if (ach.check(playerData.stats, playerData)) {
        playerData.achievements.push(ach.id)
        newUnlocks.push(ach)
      }
    } catch(e) { /* guard */ }
  }
  if (newUnlocks.length > 0) {
    savePlayerData()
    updateMenuAchievements()
    let delay = 600
    for (const ach of newUnlocks) {
      setTimeout(() => showAchievementUnlocked(ach), delay)
      delay += 3000
    }
  }
}

function showAchievementUnlocked(ach) {
  const old = document.getElementById('achievementPopup')
  if (old) old.remove()
  const el = document.createElement('div')
  el.id = 'achievementPopup'
  el.className = 'achievement-popup'
  el.innerHTML = `
    <div class="achievement-popup-inner">
      <div class="achievement-popup-icon">${ach.icon}</div>
      <div class="achievement-popup-text">
        <div class="achievement-popup-label">Erfolg freigeschaltet!</div>
        <div class="achievement-popup-title">${ach.title}</div>
        <div class="achievement-popup-desc">${ach.desc}</div>
      </div>
    </div>
  `
  document.body.appendChild(el)
  vibe(VIBRATE.LARGE)
  setTimeout(() => {
    el.classList.add('achievement-popup-hide')
    setTimeout(() => el.remove(), 500)
  }, 3200)
}

// ── Daily Challenges ──────────────────────────────────────────
function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function getDailyChallenges() {
  if (!playerData) return []
  const today = getTodayString()

  if (playerData.dailyChallenges.date !== today) {
    const pool = [...DAILY_CHALLENGES_POOL]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const selected = pool.slice(0, 3)
    playerData.dailyChallenges.date = today
    playerData.dailyChallenges.challenges = selected.map(c => c.id)
    playerData.dailyChallenges.progress = {}
    playerData.dailyChallenges.bonusCollected = false
    for (const c of selected) {
      playerData.dailyChallenges.progress[c.id] = 0
    }
    savePlayerData()
  }

  return playerData.dailyChallenges.challenges.map(id => {
    const def = DAILY_CHALLENGES_POOL.find(c => c.id === id)
    if (!def) return null
    const prog = playerData.dailyChallenges.progress[id] || 0
    return { ...def, progress: prog, completed: prog >= def.goal }
  }).filter(Boolean)
}

function updateDailyProgress(statType, amount) {
  if (!playerData) return
  const today = getTodayString()
  if (playerData.dailyChallenges.date !== today) getDailyChallenges()

  let changed = false
  const challenges = getDailyChallenges()
  for (const ch of challenges) {
    if (ch.type === statType && !ch.completed) {
      const prev = playerData.dailyChallenges.progress[ch.id] || 0
      playerData.dailyChallenges.progress[ch.id] = prev + amount
      changed = true
    }
  }
  if (changed) {
    savePlayerData()
    checkDailyBonus()
    updateMenuDailyChallenge()
  }
}

function checkDailyBonus() {
  if (!playerData || playerData.dailyChallenges.bonusCollected) return
  const challenges = getDailyChallenges()
  if (challenges.length > 0 && challenges.every(c => c.completed)) {
    playerData.dailyChallenges.bonusCollected = true
    savePlayerData()
    setTimeout(() => {
      awardBones(BONE_REWARDS.DAILY_BONUS, 'Alle Tagesaufgaben erledigt! 🎉')
    }, 800)
  }
}

// ── Menu Display ──────────────────────────────────────────────
function updateMenuDisplay() {
  if (!playerData) return
  updateMenuBones()
  updateMenuAchievements()
  updateMenuGreeting()
  updateMenuDailyChallenge()
  updateMenuProgress()
}

function updateMenuGreeting() {
  const el = document.getElementById('greetingName')
  if (el) el.textContent = playerData.name || 'Oskar'
}

function updateMenuBones() {
  document.querySelectorAll('.menu-bones-count').forEach(el => {
    el.textContent = (playerData && playerData.bones) ? playerData.bones : 0
  })
}

function updateMenuAchievements() {
  const el = document.getElementById('menuAchievementCount')
  if (el) el.textContent = `${playerData.achievements.length} / ${ACHIEVEMENTS_DEF.length}`
  updateMenuProgress()
}

function updateMenuProgress() {
  const el = document.getElementById('menuProgressBar')
  if (!el || !playerData) return
  const pct = (playerData.achievements.length / ACHIEVEMENTS_DEF.length) * 100
  el.style.width = pct + '%'
}

function updateMenuDailyChallenge() {
  const el = document.getElementById('menuDailyChallenge')
  if (!el || !playerData) return
  const challenges = getDailyChallenges()
  if (!challenges.length) return

  const html = challenges.map(ch => {
    const pct = Math.min(100, Math.round((ch.progress / ch.goal) * 100))
    return `
      <div class="daily-item ${ch.completed ? 'daily-done' : ''}">
        <div class="daily-item-row">
          <span class="daily-item-icon">${ch.completed ? '✅' : '⏳'}</span>
          <span class="daily-item-text">${ch.text}</span>
          <span class="daily-item-pct">${pct}%</span>
        </div>
        <div class="daily-bar-bg"><div class="daily-bar-fill" style="width:${pct}%"></div></div>
      </div>
    `
  }).join('')

  const bonusNote = playerData.dailyChallenges.bonusCollected
    ? '<div class="daily-bonus-done">🎉 Tagesbonus kassiert! +25 🦴</div>'
    : '<div class="daily-bonus-hint">Alle erledigen → +25 🦴</div>'

  el.innerHTML = html + bonusNote
}

// ── Stats Screen ──────────────────────────────────────────────
function renderStatsScreen() {
  if (!playerData) return
  const s = playerData.stats
  const h = playerData.highscores

  const gameNames = {
    level1: 'Snack Hunt', level2: 'Maze Escape', level3: 'Beach Run',
    level4: 'Candy Match', level5: 'Oskar Memory',
    level6: 'Buchstaben', level7: 'Finde Buchstaben'
  }
  let favGame = '—'
  let maxCount = 0
  for (const [key, count] of Object.entries(s.gameCounts || {})) {
    if (count > maxCount) { maxCount = count; favGame = gameNames[key] || key }
  }

  const timeMins = Math.floor((s.totalPlayTimeMs || 0) / 60000)

  const ids = [
    ['statBones',       playerData.bones],
    ['statGamesPlayed', s.gamesPlayed],
    ['statGamesWon',    s.gamesWon],
    ['statPlayTime',    timeMins + ' Min'],
    ['statFavorite',    favGame],
    ['statBestRun',     (h.beachRun || 0) + ' m'],
    ['statSnacks',      s.snacksCaught],
    ['statMazes',       s.mazesSolved],
    ['statMemory',      s.memoryPairsFound],
    ['statLetters',     (s.letterPuzzlesSolved || 0) + (s.findLetterSolved || 0)]
  ]
  for (const [id, val] of ids) {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }

  // Highscores
  const hsIds = [
    ['hsBestRun',     (h.beachRun || 0) + ' m'],
    ['hsMatchScore',  h.matchScore || 0],
    ['hsMemoryWins',  h.memory || 0]
  ]
  for (const [id, val] of hsIds) {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  }
}

// ── Achievements Screen ───────────────────────────────────────
function renderAchievementsScreen() {
  if (!playerData) return
  const el = document.getElementById('achievementsList')
  if (!el) return

  const unlockedCount = playerData.achievements.length
  const total = ACHIEVEMENTS_DEF.length

  const header = document.getElementById('achScreenCount')
  if (header) header.textContent = `${unlockedCount} von ${total} freigeschaltet`

  el.innerHTML = ACHIEVEMENTS_DEF.map(ach => {
    const unlocked = playerData.achievements.includes(ach.id)
    return `
      <div class="achievement-item ${unlocked ? 'ach-unlocked' : 'ach-locked'}">
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <div class="ach-status">${unlocked ? '✅' : '🔒'}</div>
      </div>
    `
  }).join('')
}

// ── Name Input ────────────────────────────────────────────────
function showNameScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById('screen-name').classList.add('active')
  setTimeout(() => {
    const inp = document.getElementById('nameInput')
    if (inp) inp.focus()
  }, 300)
}

function submitPlayerName() {
  const input = document.getElementById('nameInput')
  const name = (input ? input.value : '').trim()
  if (!name) {
    input && input.classList.add('name-input-error')
    setTimeout(() => input && input.classList.remove('name-input-error'), 600)
    return
  }
  playerData.name = name
  savePlayerData()
  document.getElementById('screen-name').classList.remove('active')
  document.getElementById('intro').classList.add('active')
  updateMenuDisplay()
  checkAchievements()
}

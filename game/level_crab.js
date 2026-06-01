/* ══════════════════════════════════════
   LEVEL 2 – KREBSE FANGEN
   Whack-a-Mole mit Krebsen im Sand
══════════════════════════════════════ */

const TARGET_CRABS     = 10
const EARLY_VISIBLE_MS = 1800   // Krebse 1–3
const MID_VISIBLE_MS   = 1400   // Krebse 4–7
const LATE_VISIBLE_MS  = 1000   // Krebse 8–10
const BETWEEN_CRABS_MS = 500    // Pause zwischen zwei Krebsen
const APPEAR_ANIM_MS   = 350    // CSS-Slide-up-Dauer

// --- State ---
let crabRunning     = false
let crabsCaught     = 0
let crabActiveHole  = -1
let crabLastHole    = -1
let crabHideTimer   = null
let crabNextTimer   = null
let crabGameStart   = 0


/* ══════ Entry Point ══════ */

function startCrabLevel() {
  crabStopGame()
  showScreen('level2crab')
  document.getElementById('crabStartScreen').classList.remove('hidden')
  document.getElementById('crabCountdown').classList.add('hidden')
  document.getElementById('crabGameArea').classList.add('hidden')
}


/* ══════ Countdown ══════ */

function beginCrabCountdown() {
  document.getElementById('crabStartScreen').classList.add('hidden')
  const cdEl   = document.getElementById('crabCountdown')
  const numEl  = document.getElementById('crabCountdownNum')
  cdEl.classList.remove('hidden')

  const steps = ['3', '2', '1', 'LOS!']
  let i = 0

  function tick() {
    numEl.textContent = steps[i]
    // restart animation
    numEl.classList.remove('crab-cd-anim')
    void numEl.offsetWidth
    numEl.classList.add('crab-cd-anim')

    i++
    if (i < steps.length) {
      crabNextTimer = setTimeout(tick, 900)
    } else {
      crabNextTimer = setTimeout(() => {
        cdEl.classList.add('hidden')
        startCrabGame()
      }, 600)
    }
  }
  tick()
}


/* ══════ Game Setup ══════ */

function startCrabGame() {
  crabsCaught    = 0
  crabRunning    = true
  crabActiveHole = -1
  crabLastHole   = -1
  crabGameStart  = Date.now()

  document.getElementById('crabGameArea').classList.remove('hidden')
  updateCrabCounter()
  buildCrabGrid()

  const data = loadPlayerData()
  data.statistics.crabGamesPlayed = (data.statistics.crabGamesPlayed || 0) + 1
  savePlayerData(data)

  crabNextTimer = setTimeout(spawnCrab, 300)
}

function buildCrabGrid() {
  const grid = document.getElementById('crabGrid')
  grid.innerHTML = ''
  for (let i = 0; i < 9; i++) {
    const hole = document.createElement('div')
    hole.className = 'crab-hole'
    hole.dataset.index = i

    const img = document.createElement('img')
    img.src = ASSETS.KREBS
    img.className = 'crab-img'
    img.alt = 'Krebs'
    img.draggable = false

    hole.appendChild(img)
    hole.addEventListener('click',      () => catchCrab(i))
    hole.addEventListener('touchstart', (e) => { e.preventDefault(); catchCrab(i) }, { passive: false })
    grid.appendChild(hole)
  }
}


/* ══════ Spawn / Hide ══════ */

function getVisibleMs() {
  if (crabsCaught < 3) return EARLY_VISIBLE_MS
  if (crabsCaught < 7) return MID_VISIBLE_MS
  return LATE_VISIBLE_MS
}

function spawnCrab() {
  if (!crabRunning) return

  // Wähle zufälliges Loch (nicht das letzte)
  let hole
  do {
    hole = Math.floor(Math.random() * 9)
  } while (hole === crabLastHole)

  crabLastHole   = hole
  crabActiveHole = hole

  const holeEl = document.getElementById('crabGrid').children[hole]
  if (!holeEl) return

  holeEl.classList.add('peeking')

  crabHideTimer = setTimeout(() => {
    hideCrab(hole, false)
  }, getVisibleMs())
}

function hideCrab(holeIndex, caught) {
  clearTimeout(crabHideTimer)
  crabHideTimer  = null
  crabActiveHole = -1

  const holeEl = document.getElementById('crabGrid')?.children[holeIndex]
  if (holeEl) {
    holeEl.classList.remove('peeking')
    if (caught) holeEl.classList.add('caught')
    setTimeout(() => holeEl?.classList.remove('caught'), 350)
  }

  if (!crabRunning) return
  crabNextTimer = setTimeout(spawnCrab, BETWEEN_CRABS_MS)
}


/* ══════ Fang-Logik ══════ */

function catchCrab(holeIndex) {
  if (!crabRunning) return
  if (holeIndex !== crabActiveHole) return

  clearTimeout(crabHideTimer)
  crabHideTimer = null

  crabsCaught++
  vibe(VIBRATE.MEDIUM)
  updateCrabCounter()
  hideCrab(holeIndex, true)

  if (crabsCaught >= TARGET_CRABS) {
    crabRunning = false
    clearTimeout(crabNextTimer)
    crabNextTimer = null
    setTimeout(crabWin, 400)
  }
}

function updateCrabCounter() {
  const el = document.getElementById('crabCounter')
  if (el) el.textContent = `Krebse: ${crabsCaught} / ${TARGET_CRABS}`
}


/* ══════ Gewinn ══════ */

function crabWin() {
  const elapsed = Math.round((Date.now() - crabGameStart) / 1000)

  const data = loadPlayerData()
  data.statistics.crabsCaughtTotal = (data.statistics.crabsCaughtTotal || 0) + TARGET_CRABS
  data.statistics.crabLevelWins    = (data.statistics.crabLevelWins    || 0) + 1

  if (data.statistics.bestCrabRoundTime === 0 || elapsed < data.statistics.bestCrabRoundTime) {
    data.statistics.bestCrabRoundTime = elapsed
  }

  data.bones = (data.bones || 0) + 1

  checkCrabAchievements(data)
  savePlayerData(data)

  vibe(VIBRATE.LARGE)

  showLevelComplete({
    title:  'Geschafft! 🦀',
    text:   '10 Krebse gefangen!\n+1 Knochen 🦴',
    button: 'Weiter',
    next:   () => {
      crabStopGame()
      showScreen('intro')
    }
  })

  // "Nochmal"-Link unter dem Popup ergänzen
  setTimeout(() => {
    const popup = document.querySelector('.level-complete-popup')
    if (!popup || popup.querySelector('.crab-retry-btn')) return
    const retryBtn = document.createElement('button')
    retryBtn.className = 'crab-retry-btn'
    retryBtn.textContent = '🔄 Nochmal spielen'
    retryBtn.addEventListener('click', () => {
      const overlay = document.querySelector('.level-complete-overlay')
      if (overlay) overlay.remove()
      startCrabLevel()
    })
    popup.appendChild(retryBtn)
  }, 250)
}


/* ══════ Achievements ══════ */

function checkCrabAchievements(data) {
  const total = data.statistics.crabsCaughtTotal || 0
  const milestones = [
    { id: 'crab_first', min: 1,   toast: '🦀 Erster Krebs gefangen!' },
    { id: 'crab_10',    min: 10,  toast: '🏆 10 Krebse insgesamt!' },
    { id: 'crab_50',    min: 50,  toast: '🏆 50 Krebse insgesamt!' },
    { id: 'crab_100',   min: 100, toast: '🏆 100 Krebse insgesamt!' }
  ]
  milestones.forEach(m => {
    if (total >= m.min && !data.achievements.includes(m.id)) {
      data.achievements.push(m.id)
      setTimeout(() => showToast(m.toast, 2800), 1200)
    }
  })
}


/* ══════ Cleanup ══════ */

function crabStopGame() {
  crabRunning = false
  clearTimeout(crabHideTimer)
  clearTimeout(crabNextTimer)
  crabHideTimer  = null
  crabNextTimer  = null
  crabActiveHole = -1
}

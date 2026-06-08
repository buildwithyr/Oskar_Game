/* ══════════════════════════════════════
   LEVEL 8 – FROGGER AM STRAND
   Oskar überquert die Strandpromenade
══════════════════════════════════════ */

// ── Layout ─────────────────────────────────────────────────────
// 9 rows top→bottom, heights in px
const FROG_ROWS = [
  { type: 'goal',     h: 62,  bg: '#2d7a0a' },   // 0: Ziel-Zone
  { type: 'water',    h: 76,  bg: '#1565c0' },   // 1: Wasser (→)
  { type: 'water',    h: 76,  bg: '#0d47a1' },   // 2: Wasser (←)
  { type: 'water',    h: 76,  bg: '#1976d2' },   // 3: Wasser (→)
  { type: 'island',   h: 48,  bg: '#5d4037' },   // 4: Sichere Insel
  { type: 'road',     h: 76,  bg: '#263238' },   // 5: Straße (←)
  { type: 'road',     h: 76,  bg: '#37474f' },   // 6: Straße (→)
  { type: 'sidewalk', h: 44,  bg: '#546e7a' },   // 7: Gehweg (sicher)
  { type: 'start',    h: 186, bg: '#e8c46a' },   // 8: Start (sicher)
]
// Row top Y positions (computed from heights)
const FROG_ROW_Y = FROG_ROWS.reduce((acc, r, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + FROG_ROWS[i - 1].h)
  return acc
}, [])

const FROG_W         = 390    // game field width (matches max container)
const FROG_COL_STEP  = 39     // 10 columns
const FROG_COLS      = 10
const FROG_OSKAR_W   = 46
const FROG_OSKAR_H   = 46
const FROG_LIVES     = 3
const FROG_TIMER_MAX = 60     // seconds per attempt

// Goal slot center-X positions (5 slots)
const FROG_GOALS_X = [39, 117, 195, 273, 351]

// Obstacle config: { row, x, w, speed (px/frame), dir, type, emoji }
function frogMakeObstacles() {
  return [
    // Water row 1 →
    { row: 1, x: 10,  w: 128, speed: 1.1, dir:  1, type: 'log',  emoji: '' },
    { row: 1, x: 230, w: 105, speed: 1.1, dir:  1, type: 'log',  emoji: '' },
    // Water row 2 ←
    { row: 2, x: 50,  w: 148, speed: 1.5, dir: -1, type: 'log',  emoji: '' },
    { row: 2, x: 280, w: 108, speed: 1.5, dir: -1, type: 'log',  emoji: '' },
    // Water row 3 →  (slow, wide)
    { row: 3, x: 20,  w: 158, speed: 0.85,dir:  1, type: 'log',  emoji: '' },
    { row: 3, x: 250, w: 118, speed: 0.85,dir:  1, type: 'log',  emoji: '' },
    // Road row 5 ←  (reduced speed, wider gap)
    { row: 5, x: 30,  w: 68,  speed: 1.8, dir: -1, type: 'car',  emoji: '🚗' },
    { row: 5, x: 260, w: 68,  speed: 1.8, dir: -1, type: 'car',  emoji: '🚗' },
    // Road row 6 →  (reduced speed, one fewer vehicle)
    { row: 6, x: 70,  w: 72,  speed: 1.4, dir:  1, type: 'car',  emoji: '🚕' },
    { row: 6, x: 300, w: 64,  speed: 1.4, dir:  1, type: 'car',  emoji: '🛵' },
  ]
}

// ── State ───────────────────────────────────────────────────────
let frogRunning    = false
let frogRow        = 8
let frogX          = 195
let frogLives      = FROG_LIVES
let frogGoalsFilled = []    // which goal slots are filled
let frogObstacles  = []
let frogOnLog      = null   // currently riding log object
let frogRafId      = null
let frogTimer      = FROG_TIMER_MAX
let frogTimerTick  = null
let frogDead       = false  // briefly true during death anim
let frogShells     = []     // bonus shells on logs
let frogTimers     = new Set()

// ── Entry Point ─────────────────────────────────────────────────
function startFroggerLevel() {
  frogStop()
  showScreen('level8')

  document.getElementById('frogStartScreen').classList.remove('hidden')
  document.getElementById('frogGameArea').classList.add('hidden')
}

function frogStartGame() {
  frogStop()
  frogRunning = true

  document.getElementById('frogStartScreen').classList.add('hidden')
  document.getElementById('frogGameArea').classList.remove('hidden')

  frogGoalsFilled = []
  frogLives       = FROG_LIVES
  frogObstacles   = frogMakeObstacles()
  frogShells      = []
  frogDead        = false

  frogBuildField()
  frogSpawnShells()
  frogRespawn()

  const data = loadPlayerData()
  data.statistics.froggerGamesPlayed = (data.statistics.froggerGamesPlayed || 0) + 1
  savePlayerData(data)

  frogUpdateHUD()
}

// ── Field Builder ────────────────────────────────────────────────
function frogBuildField() {
  const field = document.getElementById('frogField')
  field.innerHTML = ''

  FROG_ROWS.forEach((row, i) => {
    const div = document.createElement('div')
    div.className  = `frog-row frog-row-type-${row.type}`
    div.dataset.row = i
    div.style.cssText = `
      position:absolute; left:0; right:0;
      top:${FROG_ROW_Y[i]}px; height:${row.h}px;
      background:${row.bg};
    `

    // Goal zone: add slots
    if (row.type === 'goal') {
      FROG_GOALS_X.forEach((gx, si) => {
        const slot = document.createElement('div')
        slot.className   = 'frog-goal-slot'
        slot.dataset.slot = si
        slot.style.left  = (gx - 24) + 'px'
        div.appendChild(slot)
      })
      // Label
      const lbl = document.createElement('div')
      lbl.className   = 'frog-goal-label'
      lbl.textContent = 'ZIEL'
      div.appendChild(lbl)
    }

    // Direction arrows for water/road
    if (row.type === 'water') {
      const arr = document.createElement('div')
      const laneRow = i  // 1, 2, 3
      const dirs = [1, -1, 1]
      arr.className   = 'frog-dir-arrow'
      arr.textContent = dirs[laneRow - 1] > 0 ? '▶▶' : '◀◀'
      div.appendChild(arr)
    }
    if (row.type === 'road') {
      const arr = document.createElement('div')
      arr.className   = 'frog-dir-arrow'
      arr.textContent = (i === 5) ? '◀◀' : '▶▶'
      div.appendChild(arr)
    }

    // Island label
    if (row.type === 'island') {
      div.innerHTML += '<div class="frog-island-label">🏝️ SAFE 🌴</div>'
    }

    field.appendChild(div)
  })

  // Obstacle elements
  frogObstacles.forEach((obs, idx) => {
    const el = document.createElement('div')
    el.className = obs.type === 'log' ? 'frog-log' : 'frog-car'
    if (obs.type === 'car') {
      el.textContent = obs.dir > 0 ? obs.emoji : obs.emoji
      el.style.transform = obs.dir < 0 ? 'scaleX(-1)' : ''
    }
    el.style.width  = obs.w + 'px'
    el.style.height = (FROG_ROWS[obs.row].h - 12) + 'px'
    el.style.top    = (FROG_ROW_Y[obs.row] + 6) + 'px'
    el.style.left   = obs.x + 'px'
    obs.el = el
    field.appendChild(el)
  })

  // Oskar element
  const oskar = document.createElement('img')
  oskar.id        = 'frogOskar'
  oskar.className = 'frog-oskar'
  oskar.src       = 'assets/OskarCartoon.png'
  oskar.alt       = 'Oskar'
  field.appendChild(oskar)
}

function frogSpawnShells() {
  // Place shells on random logs
  const logs = frogObstacles.filter(o => o.type === 'log')
  logs.forEach(log => {
    if (Math.random() < 0.55) {
      const shell = {
        log:       log,
        offsetX:   20 + Math.random() * (log.w - 40),
        collected: false,
        el:        null,
      }
      const el = document.createElement('div')
      el.className   = 'frog-shell'
      el.textContent = '🐚'
      el.style.top   = (FROG_ROW_Y[log.row] + FROG_ROWS[log.row].h / 2 - 14) + 'px'
      el.style.left  = (log.x + shell.offsetX) + 'px'
      shell.el = el
      document.getElementById('frogField').appendChild(el)
      frogShells.push(shell)
    }
  })
}

// ── Game Loop ─────────────────────────────────────────────────────
function frogLoop() {
  if (!frogRunning) return

  const fieldEl = document.getElementById('frogField')
  const fieldW  = fieldEl ? fieldEl.offsetWidth : FROG_W

  // Update obstacle positions
  frogObstacles.forEach(obs => {
    obs.x += obs.speed * obs.dir
    // Wrap around
    if (obs.dir > 0 && obs.x > fieldW + 10)        obs.x = -obs.w - 10
    if (obs.dir < 0 && obs.x < -obs.w - 10)        obs.x = fieldW + 10
    obs.el.style.left = obs.x + 'px'
  })

  // Drift with log
  if (frogOnLog && !frogDead) {
    frogX += frogOnLog.speed * frogOnLog.dir
    // Fell off screen edge while on log
    if (frogX < -FROG_OSKAR_W / 2 || frogX > fieldW + FROG_OSKAR_W / 2) {
      frogDie()
      return
    }
  }

  // Update shell positions (follow their log)
  frogShells.forEach(sh => {
    if (!sh.collected) {
      sh.el.style.left = (sh.log.x + sh.offsetX) + 'px'
    }
  })

  if (!frogDead) {
    frogCheckCollisions(fieldW)
    frogCheckShellPickup()
  }

  frogRenderOskar()

  frogRafId = requestAnimationFrame(frogLoop)
}

// ── Collision ─────────────────────────────────────────────────────
function frogCheckCollisions(fieldW) {
  const rowType = FROG_ROWS[frogRow].type
  const ox = frogX - FROG_OSKAR_W / 2   // Oskar left edge
  const ow = FROG_OSKAR_W

  if (rowType === 'water') {
    // Must be on a log
    const onLog = frogObstacles.find(obs =>
      obs.row === frogRow && obs.type === 'log' &&
      frogAabb(ox, ow, obs.x, obs.w)
    )
    if (!onLog) {
      frogOnLog = null
      frogDie()
    } else {
      frogOnLog = onLog
    }
  } else {
    frogOnLog = null
  }

  if (rowType === 'road') {
    const hitCar = frogObstacles.find(obs =>
      obs.row === frogRow && obs.type === 'car' &&
      frogAabb(ox + 6, ow - 12, obs.x + 4, obs.w - 8)
    )
    if (hitCar) frogDie()
  }
}

function frogAabb(ax, aw, bx, bw) {
  return ax < bx + bw && ax + aw > bx
}

function frogCheckShellPickup() {
  const ox = frogX - FROG_OSKAR_W / 2
  frogShells.forEach(sh => {
    if (sh.collected) return
    if (sh.log.row !== frogRow) return
    const sx = sh.log.x + sh.offsetX
    if (frogAabb(ox, FROG_OSKAR_W, sx, 28)) {
      sh.collected = true
      sh.el.classList.add('frog-shell-pop')
      setGameTimeout(() => sh.el.remove(), 400, frogTimers)
      showToast('🐚 +1 Muschel!', 1200)
      vibe(VIBRATE.SMALL)
    }
  })
}

// ── Movement ──────────────────────────────────────────────────────
function frogMove(dir) {
  if (!frogRunning || frogDead) return

  const newRow = frogRow + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0)
  const newX   = frogX  + (dir === 'left' ? -FROG_COL_STEP : dir === 'right' ? FROG_COL_STEP : 0)

  // Bounds check
  if (newRow < 0 || newRow > 8) return
  if (newX < 0 || newX > FROG_W) return
  if (newRow < frogRow && frogRow === 8) frogResetTimer()

  frogRow = newRow
  frogX   = newX
  frogOnLog = null

  vibe(VIBRATE.SMALL)
  frogRenderOskar()

  // Immediate water check – don't wait for the next RAF frame
  if (FROG_ROWS[newRow].type === 'water') {
    const ox = frogX - FROG_OSKAR_W / 2
    const onLog = frogObstacles.find(obs =>
      obs.row === newRow && obs.type === 'log' && frogAabb(ox, FROG_OSKAR_W, obs.x, obs.w)
    )
    if (!onLog) {
      frogDie()
      return
    }
    frogOnLog = onLog
  }

  // Reached goal zone
  if (frogRow === 0) {
    frogArriveGoal()
  }
}

// ── Goal Arrival ──────────────────────────────────────────────────
function frogArriveGoal() {
  frogDead = true
  cancelAnimationFrame(frogRafId)
  clearInterval(frogTimerTick)

  // Snap to nearest goal slot
  let nearest = 0, minDist = Infinity
  FROG_GOALS_X.forEach((gx, i) => {
    const d = Math.abs(frogX - gx)
    if (d < minDist && !frogGoalsFilled.includes(i)) {
      minDist = d; nearest = i
    }
  })

  // If all slots already taken, use any nearest
  if (frogGoalsFilled.length >= FROG_GOALS_X.length) {
    frogGoalsFilled.forEach((_, i) => {
      const d = Math.abs(frogX - FROG_GOALS_X[i])
      if (d < minDist) { minDist = d; nearest = i }
    })
  }

  frogGoalsFilled.push(nearest)
  frogX = FROG_GOALS_X[nearest]
  frogRenderOskar()

  // Animate goal slot
  const slot = document.querySelector(`[data-slot="${nearest}"]`)
  if (slot) {
    slot.classList.add('frog-goal-filled')
    slot.textContent = '🏠'
  }

  vibe(VIBRATE.LARGE)
  frogUpdateHUD()

  showToast(`🏠 Ziel ${frogGoalsFilled.length}/5!`, 1600)

  if (frogGoalsFilled.length >= 5) {
    setGameTimeout(frogWin, 800, frogTimers)
  } else {
    setGameTimeout(() => frogRespawn(), 1200, frogTimers)
  }
}

// ── Death ─────────────────────────────────────────────────────────
function frogDie() {
  if (frogDead) return
  frogDead   = true
  frogOnLog  = null
  frogLives -= 1

  // Always cancel the loop on death – prevents double-RAF on respawn
  cancelAnimationFrame(frogRafId)
  clearInterval(frogTimerTick)

  vibe(VIBRATE.LARGE)
  frogUpdateHUD()

  // Water splash animation
  if (FROG_ROWS[frogRow] && FROG_ROWS[frogRow].type === 'water') {
    frogShowSplash()
  }

  const oskar = document.getElementById('frogOskar')
  if (oskar) oskar.classList.add('frog-dead-anim')

  if (frogLives <= 0) {
    setGameTimeout(frogGameOver, 900, frogTimers)
  } else {
    setGameTimeout(() => {
      if (oskar) oskar.classList.remove('frog-dead-anim')
      frogRespawn()
    }, 900, frogTimers)
  }
}

function frogShowSplash() {
  const field = document.getElementById('frogField')
  if (!field) return
  const el = document.createElement('div')
  el.className = 'frog-splash'
  el.textContent = '💦'
  el.style.left = (frogX - 22) + 'px'
  el.style.top  = (FROG_ROW_Y[frogRow] + FROG_ROWS[frogRow].h / 2 - 22) + 'px'
  field.appendChild(el)
  setGameTimeout(() => el.remove(), 750, frogTimers)
}

function frogRespawn() {
  frogRow    = 8
  frogX      = FROG_W / 2
  frogOnLog  = null
  frogDead   = false
  frogResetTimer()
  frogRenderOskar()
  frogStartTimer()
  frogRafId = requestAnimationFrame(frogLoop)
}

// ── Timer ─────────────────────────────────────────────────────────
function frogResetTimer() {
  frogTimer = FROG_TIMER_MAX
  frogUpdateHUD()
}

function frogStartTimer() {
  clearInterval(frogTimerTick)
  frogTimerTick = setInterval(() => {
    if (!frogRunning || frogDead) return
    frogTimer--
    frogUpdateHUD()
    if (frogTimer <= 0) {
      clearInterval(frogTimerTick)
      frogDie()
    }
  }, 1000)
}

// ── Render ────────────────────────────────────────────────────────
function frogRenderOskar() {
  const el = document.getElementById('frogOskar')
  if (!el) return
  const rowY  = FROG_ROW_Y[frogRow]
  const rowH  = FROG_ROWS[frogRow].h
  const posY  = rowY + (rowH - FROG_OSKAR_H) / 2
  const posX  = frogX - FROG_OSKAR_W / 2
  el.style.left = posX + 'px'
  el.style.top  = posY + 'px'
}

// ── HUD ────────────────────────────────────────────────────────────
function frogUpdateHUD() {
  const lv = document.getElementById('frogLivesEl')
  if (lv) lv.innerHTML = Array.from({ length: FROG_LIVES }, (_, i) =>
    `<span style="opacity:${i < frogLives ? 1 : 0.2}">❤️</span>`).join('')

  const sc = document.getElementById('frogScoreEl')
  if (sc) sc.textContent = `${frogGoalsFilled.length}/5 🏠`

  const ti = document.getElementById('frogTimerEl')
  if (ti) {
    ti.textContent = frogTimer
    ti.classList.toggle('frog-timer-warn', frogTimer <= 10)
  }
}

// ── Win / GameOver ─────────────────────────────────────────────────
function frogWin() {
  cancelAnimationFrame(frogRafId)
  clearInterval(frogTimerTick)

  const data = loadPlayerData()
  data.statistics.froggerLevelWins = (data.statistics.froggerLevelWins || 0) + 1
  data.statistics.level8Completed = (data.statistics.level8Completed || 0) + 1
  data.bones = (data.bones || 0) + 1
  savePlayerData(data)
  updateHighscore(8, frogGoalsFilled.length)
  vibe(VIBRATE.LARGE)

  const stars = frogLives === 3 ? 3 : frogLives === 2 ? 2 : 1
  showLevelComplete({
    title:  '🐕 Alle Ziele erreicht!',
    text:   'Oskar hat die Promenade überquert!\n+1 Knochen 🦴',
    button: '🌴 Weiter',
    stars,
    next: () => { frogStop(); showScreen('intro') }
  })
}

function frogGameOver() {
  vibe([80, 60, 80])
  showLevelComplete({
    title:  '😵 Zu gefährlich!',
    text:   `${frogGoalsFilled.length} von 5 Zielen erreicht\nNochmal versuchen?`,
    button: '🔄 Nochmal',
    stars:  0,
    next:   () => startFroggerLevel()
  })
}

// ── Input Setup (called on startFroggerLevel) ─────────────────────
function frogSetupInput() {
  // D-pad buttons in #level8
  document.querySelectorAll('#frogDpad .frog-dpad-btn').forEach(btn => {
    btn.addEventListener('click', () => frogMove(btn.dataset.fdir))
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault()
      frogMove(btn.dataset.fdir)
    }, { passive: false })
  })
}

// ── Cleanup ────────────────────────────────────────────────────────
function frogStop() {
  frogRunning = false
  cancelAnimationFrame(frogRafId)
  clearInterval(frogTimerTick)
  clearGameTimeouts(frogTimers)
  frogRafId    = null
  frogTimerTick = null
  frogObstacles.forEach(o => { if (o.el) o.el = null })
  frogObstacles = []
  frogShells    = []
  frogOnLog     = null
}

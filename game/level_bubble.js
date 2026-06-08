/* ══════════════════════════════════════
   LEVEL 2 – BUBBLE POP
   Blasen platzen: Krabben, Muscheln, Schätze
   Finger weg von Kothaufen!
══════════════════════════════════════ */

// ── Konfiguration ───────────────────────────────────────────────
const BP_ROUNDS = [
  { target: 8,  maxScreen: 1, spawnMs: 2000, floatMs: 5200,
    weights: { crab: 42, shell: 32, gem: 8, star: 10, poop: 8  } },
  { target: 10, maxScreen: 2, spawnMs: 1400, floatMs: 3800,
    weights: { crab: 38, shell: 28, gem: 9, star: 8,  poop: 17 } },
  { target: 12, maxScreen: 3, spawnMs: 900,  floatMs: 2900,
    weights: { crab: 33, shell: 22, gem: 9, star: 8,  poop: 28 } },
]

const BP_ITEMS = {
  crab:  { emoji: '🦀', pts: 2, good: true  },
  shell: { emoji: '🐚', pts: 1, good: true  },
  gem:   { emoji: '💎', pts: 3, good: true  },
  star:  { emoji: '⭐', pts: 5, good: true  },
  poop:  { emoji: '💩', pts: 0, good: false },
}

const BP_MIN_SIZE = 80
const BP_MAX_SIZE = 116
const BP_LIVES    = 3

// ── State ───────────────────────────────────────────────────────
let bpRunning   = false
let bpRound     = 0
let bpScore     = 0
let bpLives     = BP_LIVES
let bpPops      = 0       // good pops this round
let bpTotalPops = 0       // across all rounds
let bpCombo     = 0
let bpBubbles   = []      // active bubble entries
let bpSpawnTmr  = null
let bpUid       = 0
let bpTimers    = new Set()

// ── Entry Point ─────────────────────────────────────────────────
function startBubbleLevel() {
  bpStopGame()
  showScreen('level2bubble')
  bpRound     = 0
  bpScore     = 0
  bpLives     = BP_LIVES
  bpTotalPops = 0
  bpCombo     = 0

  document.getElementById('bpStartScreen').classList.remove('hidden')
  document.getElementById('bpCountdown').classList.add('hidden')
  document.getElementById('bpGameArea').classList.add('hidden')
}

// ── Countdown ───────────────────────────────────────────────────
function bpBeginCountdown() {
  const data = loadPlayerData()
  data.statistics.bubbleGamesPlayed = (data.statistics.bubbleGamesPlayed || 0) + 1
  savePlayerData(data)

  document.getElementById('bpStartScreen').classList.add('hidden')
  const cdEl  = document.getElementById('bpCountdown')
  const numEl = document.getElementById('bpCountdownNum')
  cdEl.classList.remove('hidden')

  const steps = ['3', '2', '1', 'LOS!']
  let i = 0

  function tick() {
    numEl.textContent = steps[i]
    numEl.classList.remove('bp-cd-anim')
    void numEl.offsetWidth
    numEl.classList.add('bp-cd-anim')
    i++
    if (i < steps.length) {
      setGameTimeout(tick, 900, bpTimers)
    } else {
      setGameTimeout(() => {
        cdEl.classList.add('hidden')
        bpStartRound()
      }, 600, bpTimers)
    }
  }
  tick()
}

// ── Round Management ─────────────────────────────────────────────
function bpStartRound() {
  const cfg = BP_ROUNDS[bpRound]
  bpPops   = 0
  bpCombo  = 0
  bpBubbles = []
  bpUid    = 0
  bpRunning = true

  const gameArea = document.getElementById('bpGameArea')
  gameArea.classList.remove('hidden')
  document.getElementById('bpCountdown').classList.add('hidden')
  document.getElementById('bpField').innerHTML = ''

  bpUpdateHUD()
  bpShowRoundBanner(`Runde ${bpRound + 1} – Los!`)

  setGameTimeout(() => {
    if (bpRunning) bpScheduleSpawn()
  }, 1400, bpTimers)
}

function bpShowRoundBanner(text) {
  const el = document.getElementById('bpRoundBanner')
  el.textContent = text
  el.classList.remove('hidden', 'bp-banner-out')
  void el.offsetWidth
  el.classList.add('bp-banner-in')
  setGameTimeout(() => {
    el.classList.remove('bp-banner-in')
    el.classList.add('bp-banner-out')
    setGameTimeout(() => el.classList.add('hidden'), 450, bpTimers)
  }, 1100, bpTimers)
}

// ── Bubble Spawn ─────────────────────────────────────────────────
function bpScheduleSpawn() {
  if (!bpRunning) return
  const cfg    = BP_ROUNDS[bpRound]
  const active = bpBubbles.filter(b => !b.done).length

  if (active < cfg.maxScreen) bpSpawnBubble()

  bpSpawnTmr = setTimeout(bpScheduleSpawn, cfg.spawnMs)
}

function bpSpawnBubble() {
  const cfg  = BP_ROUNDS[bpRound]
  const type = bpWeightedRandom(cfg.weights)
  const item = BP_ITEMS[type]
  const size = BP_MIN_SIZE + Math.floor(Math.random() * (BP_MAX_SIZE - BP_MIN_SIZE + 1))
  const left = 6 + Math.random() * (88 - (size / 3.9))  // keep bubble inside field
  const id   = bpUid++

  // Slight speed variation per bubble
  const floatMs = cfg.floatMs * (0.88 + Math.random() * 0.25)
  const wobble  = (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 28)

  const el = document.createElement('div')
  el.className  = `bp-bubble bp-bubble-${type}`
  el.dataset.bpId = id
  el.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${left}%;
    --float-ms: ${floatMs}ms;
    --wx: ${wobble}px;
    font-size: ${Math.round(size * 0.38)}px;
  `
  el.innerHTML = `
    <div class="bp-bubble-glass"></div>
    <div class="bp-bubble-shine"></div>
    <div class="bp-bubble-emoji">${item.emoji}</div>
    <div class="bp-bubble-highlight"></div>
  `

  const entry = { id, el, type, good: item.good, pts: item.pts, done: false }
  bpBubbles.push(entry)

  const field = document.getElementById('bpField')
  field.appendChild(el)

  // Escaped (reached top)
  el.addEventListener('animationend', () => {
    if (!entry.done) {
      entry.done = true
      el.remove()
      bpBubbles = bpBubbles.filter(b => b.id !== id)
      if (item.good) bpCombo = 0  // missed good = combo reset, no life penalty
    }
  })

  // Tap handler
  const doTap = (e) => {
    e.stopPropagation()
    if (e.cancelable) e.preventDefault()
    bpPopBubble(entry)
  }
  el.addEventListener('touchstart', doTap, { passive: false })
  el.addEventListener('click', doTap)
}

function bpWeightedRandom(weights) {
  const keys  = Object.keys(weights)
  const total = keys.reduce((s, k) => s + weights[k], 0)
  let r = Math.random() * total
  for (const k of keys) {
    r -= weights[k]
    if (r <= 0) return k
  }
  return keys[0]
}

// ── Pop Logic ────────────────────────────────────────────────────
function bpPopBubble(entry) {
  if (!bpRunning || entry.done) return
  entry.done = true
  const { el, good, pts, type } = entry
  bpBubbles = bpBubbles.filter(b => b.id !== entry.id)

  // Override animation with pop burst
  el.style.setProperty('--float-ms', '0ms')
  el.classList.add('bp-pop-anim')

  if (good) {
    bpCombo++
    bpPops++
    bpTotalPops++

    const multi = bpCombo >= 5 ? 3 : bpCombo >= 3 ? 2 : 1
    const earned = pts * multi
    bpScore += earned

    vibe(VIBRATE.MEDIUM)
    bpSpawnFx(el, `+${earned}${multi > 1 ? ' 🔥' : ''}`, '#60a5fa')
    bpSpawnParticles(el, '#93c5fd')

    if      (bpCombo === 3) bpShowCombo('🔥 KOMBO ×2!')
    else if (bpCombo === 5) bpShowCombo('⚡ KOMBO ×3!')
    else if (bpCombo >= 7) bpShowCombo('🌟 WAHNSINN!')

    // Check round target
    if (bpPops >= BP_ROUNDS[bpRound].target) {
      bpRunning = false
      clearTimeout(bpSpawnTmr)
      bpSpawnTmr = null
      setGameTimeout(bpRoundComplete, 700, bpTimers)
    }
  } else {
    // Poop – lose a life
    bpCombo  = 0
    bpLives -= 1
    vibe(VIBRATE.LARGE)
    bpSpawnFx(el, '💥 -❤️', '#f87171')
    bpSpawnParticles(el, '#fca5a5')
    bpShakeScreen()

    if (bpLives <= 0) {
      bpRunning = false
      clearTimeout(bpSpawnTmr)
      bpSpawnTmr = null
      setGameTimeout(bpGameOver, 600, bpTimers)
    }
  }

  bpUpdateHUD()
  setGameTimeout(() => el.remove(), 320, bpTimers)

  const data = loadPlayerData()
  bpCheckAchievements(data)
  savePlayerData(data)
}

// ── Round Complete / Win / GameOver ──────────────────────────────
function bpRoundComplete() {
  // Pop remaining bubbles
  bpBubbles.forEach(b => {
    if (!b.done) {
      b.done = true
      b.el.classList.add('bp-pop-anim')
      setGameTimeout(() => b.el.remove(), 300, bpTimers)
    }
  })
  bpBubbles = []

  bpRound++

  if (bpRound >= BP_ROUNDS.length) {
    setGameTimeout(bpWin, 500, bpTimers)
  } else {
    setGameTimeout(() => {
      bpShowRoundBanner(`Runde ${bpRound + 1} – Los!`)
      setGameTimeout(() => bpStartRound(), 1600, bpTimers)
    }, 300, bpTimers)
  }
}

function bpWin() {
  const data = loadPlayerData()
  data.statistics.bubblePopsTotal = (data.statistics.bubblePopsTotal || 0) + bpTotalPops
  data.statistics.bubbleLevelWins = (data.statistics.bubbleLevelWins || 0) + 1
  data.statistics.level2Completed = (data.statistics.level2Completed || 0) + 1
  if (bpScore > (data.statistics.bestBubbleScore || 0)) data.statistics.bestBubbleScore = bpScore
  data.bones = (data.bones || 0) + 1
  bpCheckAchievements(data)
  savePlayerData(data)
  updateHighscore(2, bpScore)
  vibe(VIBRATE.LARGE)

  const stars = bpLives === 3 ? 3 : bpLives === 2 ? 2 : 1
  showLevelComplete({
    title:  '🫧 Mega! Alle Blasen geplatzt!',
    text:   `${bpTotalPops} Blasen · ${bpScore} Punkte\n+1 Knochen 🦴`,
    button: '🌴 Weiter',
    stars,
    next: () => { bpStopGame(); showScreen('intro') }
  })
}

function bpGameOver() {
  vibe([80, 60, 80])
  showLevelComplete({
    title:  '💩 Zu viele Kothaufen!',
    text:   `Punkte: ${bpScore}\nNochmal versuchen?`,
    button: '🔄 Nochmal',
    stars:  0,
    next:   () => startBubbleLevel()
  })
}

// ── Visual Effects ───────────────────────────────────────────────
function bpSpawnFx(refEl, text, color) {
  const field = document.getElementById('bpField')
  if (!field) return
  const rect  = refEl.getBoundingClientRect()
  const fRect = field.getBoundingClientRect()

  const fx = document.createElement('div')
  fx.className = 'bp-fx'
  fx.textContent = text
  fx.style.color = color
  fx.style.left  = (rect.left - fRect.left + rect.width  / 2) + 'px'
  fx.style.top   = (rect.top  - fRect.top  + rect.height / 2) + 'px'
  field.appendChild(fx)
  setGameTimeout(() => fx.remove(), 900, bpTimers)
}

function bpSpawnParticles(refEl, color) {
  const field = document.getElementById('bpField')
  if (!field) return
  const rect  = refEl.getBoundingClientRect()
  const fRect = field.getBoundingClientRect()
  const cx = rect.left - fRect.left + rect.width  / 2
  const cy = rect.top  - fRect.top  + rect.height / 2

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const dist  = 40 + Math.random() * 30
    const p = document.createElement('div')
    p.className = 'bp-particle'
    p.style.left  = cx + 'px'
    p.style.top   = cy + 'px'
    p.style.setProperty('--vx', (Math.cos(angle) * dist) + 'px')
    p.style.setProperty('--vy', (Math.sin(angle) * dist) + 'px')
    p.style.setProperty('--pc', color)
    field.appendChild(p)
    setGameTimeout(() => p.remove(), 550, bpTimers)
  }
}

function bpShowCombo(text) {
  const el = document.getElementById('bpComboFlash')
  el.textContent = text
  el.classList.remove('hidden', 'bp-combo-out')
  void el.offsetWidth
  el.classList.add('bp-combo-in')
  setGameTimeout(() => {
    el.classList.remove('bp-combo-in')
    el.classList.add('bp-combo-out')
    setGameTimeout(() => el.classList.add('hidden'), 400, bpTimers)
  }, 1300, bpTimers)
}

function bpShakeScreen() {
  const s = document.getElementById('level2bubble')
  s.classList.add('bp-shake')
  setGameTimeout(() => s.classList.remove('bp-shake'), 500, bpTimers)
}

// ── HUD ──────────────────────────────────────────────────────────
function bpUpdateHUD() {
  const sc = document.getElementById('bpScoreEl')
  if (sc) sc.textContent = bpScore

  const pr = document.getElementById('bpProgressEl')
  if (pr) {
    const cfg = BP_ROUNDS[Math.min(bpRound, BP_ROUNDS.length - 1)]
    pr.textContent = `R${bpRound + 1}/3 · ${bpPops}/${cfg.target}`
  }

  const lv = document.getElementById('bpLivesEl')
  if (lv) {
    lv.innerHTML = Array.from({ length: BP_LIVES }, (_, i) =>
      `<span style="opacity:${i < bpLives ? 1 : 0.2};filter:${i < bpLives ? 'none' : 'grayscale(1)'}">❤️</span>`
    ).join('')
  }
}

// ── Achievements ─────────────────────────────────────────────────
function bpCheckAchievements(data) {
  const total = (data.statistics.bubblePopsTotal || 0) + bpTotalPops
  const milestones = [
    { id: 'bubble_first', min: 1,   toast: '🫧 Erste Blase geplatzt!' },
    { id: 'bubble_10',    min: 10,  toast: '🏆 10 Blasen insgesamt!'  },
    { id: 'bubble_50',    min: 50,  toast: '🏆 50 Blasen insgesamt!'  },
    { id: 'bubble_100',   min: 100, toast: '🏆 100 Blasen insgesamt!' },
  ]
  milestones.forEach(m => {
    if (total >= m.min && !data.achievements.includes(m.id)) {
      data.achievements.push(m.id)
      setTimeout(() => showToast(m.toast, 2800), 1200)
    }
  })
}

// ── Cleanup ──────────────────────────────────────────────────────
function bpStopGame() {
  bpRunning = false
  clearTimeout(bpSpawnTmr)
  bpSpawnTmr = null
  clearGameTimeouts(bpTimers)
  bpBubbles  = []
  const field = document.getElementById('bpField')
  if (field) field.innerHTML = ''
}

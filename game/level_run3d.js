/* ══════════════════════════════════════
   LEVEL 11 – LECKERLI-LAUF (Pseudo-3D)
   Oskar rennt in den Sonnenuntergang:
   Leckerlis kommen von vorne und werden
   größer, je näher sie kommen. Links/
   rechts tippen zum Ausweichen.
   Reines DOM/CSS-Pseudo-3D, keine Engine.
══════════════════════════════════════ */

// ── Konfiguration ───────────────────────────────────────────────
const R3_GOAL          = 15      // so viele Leckerlis sammeln
const R3_LIVES         = 3
const R3_TRAVEL_START  = 3000    // ms vom Horizont bis zu Oskar
const R3_TRAVEL_MIN    = 2300
const R3_SPAWN_START   = 1400    // ms zwischen zwei Objekten
const R3_SPAWN_MIN     = 1000
const R3_HIT_P         = 0.92    // ab hier zählt die Kollision
const R3_INVULN_MS     = 1300    // Schonzeit nach einem Treffer

const R3_TYPES = [
  { type: 'bone', emoji: '🦴', good: true,  pts: 1, weight: 34 },
  { type: 'meat', emoji: '🍖', good: true,  pts: 1, weight: 20 },
  { type: 'star', emoji: '⭐', good: true,  pts: 2, weight: 12 },
  { type: 'poop', emoji: '💩', good: false, pts: 0, weight: 34 },
]

// Deko, die mitläuft (Muschel-Streifen am Wegrand + Palmen)
const R3_DECO = [
  { kind: 'stripe', lane: -0.55, phase: 0.00 },
  { kind: 'stripe', lane: -0.55, phase: 0.33 },
  { kind: 'stripe', lane: -0.55, phase: 0.66 },
  { kind: 'stripe', lane:  0.55, phase: 0.16 },
  { kind: 'stripe', lane:  0.55, phase: 0.49 },
  { kind: 'stripe', lane:  0.55, phase: 0.82 },
  { kind: 'palm',   lane: -2.2,  phase: 0.10 },
  { kind: 'palm',   lane:  2.2,  phase: 0.45 },
  { kind: 'palm',   lane: -2.2,  phase: 0.60 },
  { kind: 'palm',   lane:  2.2,  phase: 0.90 },
]

// ── State ───────────────────────────────────────────────────────
let r3Running     = false
let r3Lane        = 0          // -1, 0, 1
let r3Lives       = R3_LIVES
let r3Collected   = 0
let r3Items       = []         // { lane, born, travel, def, el, resolved }
let r3DecoEls     = []
let r3TravelMs    = R3_TRAVEL_START
let r3SpawnMs     = R3_SPAWN_START
let r3NextSpawn   = 0
let r3StartT      = 0
let r3LastNow     = 0
let r3InvulnUntil = 0
let r3SpawnCount  = 0
let r3LastWasPoop = false
let r3RafId       = null
let r3W = 390, r3H = 700
let r3HintShown   = false
let r3Timers      = new Set()

// ── Entry Point ─────────────────────────────────────────────────
function startRun3dLevel(){
  r3Stop()
  showScreen('level11')
  document.getElementById('r3StartScreen').classList.remove('hidden')
  document.getElementById('r3GameArea').classList.add('hidden')
}

function r3Begin(){
  r3Stop()
  r3Running     = true
  r3Lane        = 0
  r3Lives       = R3_LIVES
  r3Collected   = 0
  r3TravelMs    = R3_TRAVEL_START
  r3SpawnMs     = R3_SPAWN_START
  r3SpawnCount  = 0
  r3LastWasPoop = false
  r3InvulnUntil = 0
  r3HintShown   = true

  document.getElementById('r3StartScreen').classList.add('hidden')
  document.getElementById('r3GameArea').classList.remove('hidden')
  document.querySelectorAll('#level11 .r3-hint').forEach(h => h.style.opacity = '1')

  const data = loadPlayerData()
  data.statistics.run3dGamesPlayed = (data.statistics.run3dGamesPlayed || 0) + 1
  savePlayerData(data)

  r3Measure()
  r3BuildDeco()
  r3RenderOskar(true)
  r3UpdateHUD()

  const now = performance.now()
  r3StartT    = now
  r3LastNow   = now
  r3NextSpawn = now + 900
  r3RafId     = requestAnimationFrame(r3Loop)
}

// ── Geometrie / Projektion ──────────────────────────────────────
function r3Measure(){
  const area = document.getElementById('r3GameArea')
  if(area){
    r3W = area.offsetWidth  || window.innerWidth
    r3H = area.offsetHeight || window.innerHeight
  }
}

function r3HorizonY(){ return r3H * 0.42 }
function r3PlayerY(){  return r3H * 0.84 }
function r3LaneOffset(){ return Math.min(r3W * 0.27, 130) }

// p (0=Horizont … 1=bei Oskar) → Bildschirm-Position + Größe
function r3Project(p, lane){
  const e = Math.pow(p, 2.2)
  return {
    x: r3W / 2 + lane * r3LaneOffset() * e,
    y: r3HorizonY() + e * (r3PlayerY() - r3HorizonY()),
    s: 0.14 + e * 0.92,
  }
}

// ── Deko (Streifen + Palmen) ────────────────────────────────────
function r3BuildDeco(){
  const world = document.getElementById('r3World')
  world.innerHTML = ''
  r3DecoEls = []

  R3_DECO.forEach(d => {
    const el = document.createElement('div')
    el.className = d.kind === 'palm' ? 'r3-palm' : 'r3-stripe'
    if(d.kind === 'palm') el.textContent = '🌴'
    world.appendChild(el)
    r3DecoEls.push({ ...d, el })
  })
}

// ── Game Loop ───────────────────────────────────────────────────
function r3Loop(now){
  if(!r3Running) return

  // Tab war im Hintergrund → Zeitsprung ausgleichen statt alles
  // auf einmal vorbeirauschen zu lassen
  const delta = now - r3LastNow
  if(delta > 400){
    r3Items.forEach(it => it.born += delta)
    r3NextSpawn += delta
    r3StartT    += delta
  }
  r3LastNow = now

  // Spawnen
  if(now >= r3NextSpawn){
    r3SpawnItem(now)
    r3NextSpawn = now + r3SpawnMs
  }

  // Items bewegen
  const remove = []
  r3Items.forEach(it => {
    const p = (now - it.born) / it.travel

    if(p >= 1.08){ remove.push(it); return }

    const pos = r3Project(Math.min(p, 1.08), it.lane)
    it.el.style.transform =
      `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -100%) scale(${pos.s})`
    it.el.style.zIndex = 10 + Math.floor(p * 80)

    // Kollision, sobald das Objekt bei Oskar ankommt
    if(!it.resolved && p >= R3_HIT_P){
      it.resolved = true
      if(it.lane === r3Lane){
        if(it.def.good) r3Collect(it)
        else            r3Hit(it)
      }
    }
  })
  remove.forEach(it => {
    it.el.remove()
    r3Items = r3Items.filter(x => x !== it)
  })

  // Deko mitlaufen lassen (gleiche Projektion, endlos)
  r3DecoEls.forEach(d => {
    const p   = (((now - r3StartT) / r3TravelMs) + d.phase) % 1
    const pos = r3Project(p, d.lane)
    d.el.style.transform =
      `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -100%) scale(${pos.s})`
    d.el.style.opacity = p < 0.06 ? p / 0.06 : 1
  })

  r3RafId = requestAnimationFrame(r3Loop)
}

// ── Spawning ────────────────────────────────────────────────────
function r3SpawnItem(now){
  r3SpawnCount++

  // Faire Auswahl: erst warmlaufen, nie zwei 💩 hintereinander
  let pool = R3_TYPES
  if(r3SpawnCount <= 3 || r3LastWasPoop) pool = R3_TYPES.filter(t => t.good)

  const total = pool.reduce((s, t) => s + t.weight, 0)
  let roll = Math.random() * total
  let def  = pool[0]
  for(const t of pool){
    roll -= t.weight
    if(roll <= 0){ def = t; break }
  }
  r3LastWasPoop = !def.good

  const lane = [-1, 0, 1][Math.floor(Math.random() * 3)]

  const el = document.createElement('div')
  el.className   = 'r3-item'
  el.textContent = def.emoji
  document.getElementById('r3World').appendChild(el)

  r3Items.push({ lane, born: now, travel: r3TravelMs, def, el, resolved: false })
}

// ── Sammeln / Treffer ───────────────────────────────────────────
function r3Collect(it){
  r3Collected += it.def.pts
  vibe(VIBRATE.SMALL)

  it.el.classList.add('r3-item-collect')
  setGameTimeout(() => it.el.remove(), 450, r3Timers)

  r3FloatText(it.def.pts > 1 ? `+${it.def.pts} ⭐` : '+1', it.lane)
  r3PulseOskar()

  // Sanft schneller werden
  r3TravelMs = Math.max(R3_TRAVEL_MIN, r3TravelMs - 45)
  r3SpawnMs  = Math.max(R3_SPAWN_MIN,  r3SpawnMs  - 30)

  r3UpdateHUD()

  if(r3Collected >= R3_GOAL){
    r3Running = false
    cancelAnimationFrame(r3RafId)
    setGameTimeout(r3Win, 500, r3Timers)
  }
}

function r3Hit(it){
  const now = performance.now()
  if(now < r3InvulnUntil) return    // Schonzeit – kein Doppel-Treffer

  r3InvulnUntil = now + R3_INVULN_MS
  r3Lives--
  vibe(VIBRATE.LARGE)

  it.el.classList.add('r3-item-splat')
  setGameTimeout(() => it.el.remove(), 500, r3Timers)

  // Roter Bildschirm-Blitz + Oskar blinkt
  const flash = document.getElementById('r3Flash')
  if(flash){
    flash.classList.remove('r3-flash-on')
    void flash.offsetWidth
    flash.classList.add('r3-flash-on')
  }
  const wrap = document.getElementById('r3OskarWrap')
  if(wrap){
    wrap.classList.remove('r3-oskar-blink')
    void wrap.offsetWidth
    wrap.classList.add('r3-oskar-blink')
  }

  r3UpdateHUD()

  if(r3Lives <= 0){
    r3Running = false
    cancelAnimationFrame(r3RafId)
    setGameTimeout(r3GameOver, 700, r3Timers)
  }
}

function r3FloatText(text, lane){
  const world = document.getElementById('r3World')
  if(!world) return
  const el = document.createElement('div')
  el.className   = 'r3-float'
  el.textContent = text
  el.style.left  = (r3W / 2 + lane * r3LaneOffset()) + 'px'
  el.style.top   = (r3PlayerY() - 110) + 'px'
  world.appendChild(el)
  setGameTimeout(() => el.remove(), 800, r3Timers)
}

function r3PulseOskar(){
  const img = document.getElementById('r3Oskar')
  if(!img) return
  img.classList.remove('r3-oskar-happy')
  void img.offsetWidth
  img.classList.add('r3-oskar-happy')
}

// ── Steuerung ───────────────────────────────────────────────────
function r3Steer(dir){
  if(!r3Running) return
  const newLane = Math.max(-1, Math.min(1, r3Lane + dir))
  if(newLane === r3Lane) return
  r3Lane = newLane
  vibe(VIBRATE.SMALL)
  r3RenderOskar()

  if(r3HintShown){
    r3HintShown = false
    document.querySelectorAll('#level11 .r3-hint').forEach(h => h.style.opacity = '0')
  }
}

function r3RenderOskar(instant){
  const wrap = document.getElementById('r3OskarWrap')
  if(!wrap) return
  const x    = r3Lane * r3LaneOffset()
  const lean = r3Lane * 6
  if(instant) wrap.style.transition = 'none'
  wrap.style.transform = `translateX(calc(-50% + ${x}px)) rotate(${lean}deg)`
  if(instant){
    void wrap.offsetWidth
    wrap.style.transition = ''
  }
}

// Tippen links/rechts + Wischen (einmalig aus main.js gebunden)
function r3BindInput(){
  const area = document.getElementById('r3GameArea')
  if(!area) return

  let startX = 0

  area.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX
  }, { passive: true })

  area.addEventListener('touchend', (e) => {
    if(!r3Running) return
    e.preventDefault()
    const endX = e.changedTouches[0].clientX
    const dx   = endX - startX
    if(Math.abs(dx) > 30){
      r3Steer(dx > 0 ? 1 : -1)            // Wischen
    } else {
      r3Steer(endX < r3W / 2 ? -1 : 1)    // Tippen: linke/rechte Hälfte
    }
  }, { passive: false })

  // Desktop: Klick links/rechts
  area.addEventListener('click', (e) => {
    if(!r3Running) return
    r3Steer(e.clientX < window.innerWidth / 2 ? -1 : 1)
  })

  window.addEventListener('resize', () => {
    if(r3Running) r3Measure()
  })
}

// ── HUD ─────────────────────────────────────────────────────────
function r3UpdateHUD(){
  const score = document.getElementById('r3Score')
  if(score){
    const hearts = Array.from({ length: R3_LIVES }, (_, i) =>
      `<span style="opacity:${i < r3Lives ? 1 : 0.2}">❤️</span>`).join('')
    score.innerHTML = `🦴 ${Math.min(r3Collected, R3_GOAL)}/${R3_GOAL} &nbsp; ${hearts}`
  }
}

// ── Win / GameOver ──────────────────────────────────────────────
function r3Win(){
  const score = r3Collected * 10 + r3Lives * 20
  awardLevelWin(11, score)

  const data = loadPlayerData()
  data.statistics.run3dLevelWins = (data.statistics.run3dLevelWins || 0) + 1
  savePlayerData(data)

  vibe(VIBRATE.LARGE)
  showLevelComplete({
    title:  '🌅 Was für ein Lauf!',
    text:   `${R3_GOAL} Leckerlis gesammelt –\nOskar ist satt und glücklich! +1 Knochen 🦴`,
    button: '🌴 Weiter',
    stars:  Math.max(1, r3Lives),
    next:   () => { r3Stop(); showScreen('intro') }
  })
}

function r3GameOver(){
  showLevelComplete({
    title:  '💩 Igitt!',
    text:   `Oskar ist zu oft reingetreten!\n${r3Collected} Leckerlis gesammelt.\nNochmal laufen?`,
    button: '🔄 Nochmal',
    stars:  0,
    next:   () => startRun3dLevel()
  })
}

// ── Cleanup ─────────────────────────────────────────────────────
function r3Stop(){
  r3Running = false
  if(r3RafId){ cancelAnimationFrame(r3RafId); r3RafId = null }
  clearGameTimeouts(r3Timers)
  r3Items.forEach(it => it.el.remove())
  r3Items   = []
  r3DecoEls = []
  const world = document.getElementById('r3World')
  if(world) world.innerHTML = ''
}

/* ══════════════════════════════════════
   LEVEL 9 – KOKOS-KATAPULT
   Wurfspiel aus der Ego-Perspektive:
   Kokosnuss nach unten/zur Seite ziehen
   und loslassen – sie fliegt in einer
   Wurfparabel auf eine Burg aus Fässern.
   Getroffene Fässer fliegen raus, Fässer
   ohne Halt stürzen nach (einfache
   Stütz-Logik, keine Physik-Engine).
   Pseudo-3D wie Level 8: Position + Größe
   werden aus der Tiefe (z) projiziert.
══════════════════════════════════════ */

// ── Konfiguration ───────────────────────────────────────────────
const CP_GRAVITY   = 400     // Welt-Einheiten pro s² nach unten
const CP_Z_SPEED   = 0.78    // Tiefe pro Sekunde (z: 0 = Abwurf, 1 = Burg)
const CP_DEPTH     = 1.1     // Perspektiv-Faktor: scale(z) = 1/(1 + z*CP_DEPTH)
const CP_VY_MIN    = 150     // Steigrate bei minimalem Zug …
const CP_VY_MAX    = 480     // … und bei vollem Zug
const CP_AIM_SENS  = 1.15    // horizontale Zug-Pixel → seitliches Tempo
const CP_VX_MAX    = 180
const CP_PULL_FULL = 0.30    // Zugweg für volle Kraft (Anteil der Bildhöhe)
const CP_PULL_MIN  = 24      // px – darunter gilt das Loslassen als Abbruch
const CP_LAUNCH_H  = 30      // Abwurfhöhe der Kokosnuss (Welt-Einheiten)
const CP_FASS_W    = 54      // Fass-Maße in Welt-Einheiten
const CP_FASS_H    = 56
const CP_SUPPORT_X = 34      // max. seitlicher Versatz, der ein Fass noch trägt
const CP_COCO_SIZE = 58      // Kokosnuss-Größe in Welt-Einheiten
const CP_BONUS_PER_COCO = 25 // Extra-Punkte pro übriger Kokosnuss bei Komplett-Abriss

// Die 3 Stufen: Fass-Positionen in Welt-Einheiten relativ zur
// Wegmitte, row 0 = Boden. plane = Tiefen-Ebene des Fasses;
// Stufe 3 hat eine Mauer vorn (plane 1) und einen Turm dahinter
// (plane 1.15) – die Lücke in der Mauer ist der Weg zum Turm.
// starPct: Prozent zerstörter Fässer für 1/2/3 Sterne. Stufe 3
// hat eigene Schwellen, weil mit 2 Kokosnüssen nie alle 14
// Fässer fallen können.
const CP_STAGES = [
  {
    name: 'Pyramide', icon: '⛱️', coconuts: 3, hitRadius: 64, starPct: [50, 75, 100],
    barrels: [
      { x: -56, row: 0 }, { x: 0, row: 0 }, { x: 56, row: 0 },
      { x: -28, row: 1 }, { x: 28, row: 1 },
      { x: 0, row: 2 },
    ],
  },
  {
    name: 'Mauer', icon: '🧱', coconuts: 3, hitRadius: 50, starPct: [50, 75, 100],
    barrels: [
      { x: -112, row: 0 }, { x: -56, row: 0 }, { x: 0, row: 0 }, { x: 56, row: 0 }, { x: 112, row: 0 },
      { x: -112, row: 1 }, { x: -56, row: 1 }, { x: 0, row: 1 }, { x: 56, row: 1 }, { x: 112, row: 1 },
    ],
  },
  {
    name: 'Burg', icon: '🏰', coconuts: 2, hitRadius: 40, starPct: [35, 50, 60],
    barrels: [
      // Mauer vorn – mit Lücke in der Mitte
      { x: -118, row: 0 }, { x: -64, row: 0 }, { x: 64, row: 0 }, { x: 118, row: 0 },
      { x: -91, row: 1 }, { x: 91, row: 1 },
      // Burg dahinter: durch die Lücke oder im hohen Bogen treffen!
      // (±68 steht bewusst zu weit weg, um den Turm zu stützen)
      { x: -68, row: 0, plane: 1.15 }, { x: 68, row: 0, plane: 1.15 },
      { x: -30, row: 0, plane: 1.15 }, { x: 30, row: 0, plane: 1.15 },
      { x: -30, row: 1, plane: 1.15 }, { x: 30, row: 1, plane: 1.15 },
      { x: 0, row: 2, plane: 1.15 },
      { x: 0, row: 3, plane: 1.15 },
    ],
  },
]

// ── State ───────────────────────────────────────────────────────
let cpRunning    = false
let cpStage      = 1
let cpBarrels    = []      // { x, row, plane, el, alive, drops }
let cpPlanes     = []      // sortierte Tiefen-Ebenen der Stufe
let cpThrowsLeft = 0
let cpDestroyed  = 0
let cpAiming     = false   // Kokosnuss liegt bereit und darf gezogen werden
let cpDragId     = null
let cpDragStartP = null    // { x, y } Bildschirm-Startpunkt des Zugs
let cpAim        = null    // { vx, vy, wx, wy, armed } aktueller Zug
let cpFlight     = null    // { wx, wy, z, vx, vy, rot } fliegende Kokosnuss
let cpRafId      = null
let cpLastNow    = 0
let cpDots       = []
let cpHintShown  = false
let cpTimers     = new Set()
let cpW = 390, cpH = 700

// ── Entry Point ─────────────────────────────────────────────────
function startCatapultLevel(){
  cpStop()
  showScreen('level9')
  document.getElementById('cpStartScreen').classList.remove('hidden')
  document.getElementById('cpGameArea').classList.add('hidden')
  cpRenderStageButtons()
}

// Stufen-Auswahl auf der Startkarte: freigeschaltete Stufen aus
// dem Spielstand, gesperrte mit Schloss (Stufe 2 nach Stufe 1 usw.)
function cpRenderStageButtons(){
  const wrap = document.getElementById('cpStageBtns')
  if(!wrap) return
  const unlocked = loadPlayerData().catapultStageUnlocked || 1
  wrap.innerHTML = ''

  CP_STAGES.forEach((st, i) => {
    const n = i + 1
    const locked = n > unlocked
    const btn = document.createElement('button')
    btn.className = 'cp-stage-btn' + (locked ? ' cp-stage-locked' : '')
    btn.disabled = locked
    btn.innerHTML = `
      <span class="cp-stage-ico">${locked ? '🔒' : st.icon}</span>
      <span class="cp-stage-name">Stufe ${n}</span>
      <span class="cp-stage-sub">${st.barrels.length} Fässer · ${st.coconuts} 🥥</span>
    `
    if(!locked) btn.addEventListener('click', () => {
      vibe(VIBRATE.SMALL)
      cpBegin(n)
    })
    wrap.appendChild(btn)
  })
}

function cpBegin(stage){
  cpStop()
  cpRunning    = true
  cpStage      = stage
  cpThrowsLeft = CP_STAGES[stage - 1].coconuts
  cpDestroyed  = 0
  cpAiming     = false
  cpDragId     = null
  cpFlight     = null
  cpHintShown  = true

  document.getElementById('cpStartScreen').classList.add('hidden')
  document.getElementById('cpGameArea').classList.remove('hidden')
  const hint = document.getElementById('cpDragHint')
  if(hint) hint.style.opacity = '1'

  const data = loadPlayerData()
  data.statistics.catapultGamesPlayed = (data.statistics.catapultGamesPlayed || 0) + 1
  savePlayerData(data)

  cpMeasure()
  cpBuildFortress()
  cpBuildDots()
  cpResetCoconut()
  cpUpdateHUD()
}

// ── Geometrie / Projektion ──────────────────────────────────────
function cpMeasure(){
  const area = document.getElementById('cpGameArea')
  if(area){
    cpW = area.offsetWidth  || window.innerWidth
    cpH = area.offsetHeight || window.innerHeight
  }
}

function cpHorizonY(){ return cpH * 0.44 }
function cpLaunchY(){  return cpH * 0.80 }

// Tiefe z → Skalierung; Boden-Linie wandert Richtung Horizont
function cpPersp(z){ return 1 / (1 + z * CP_DEPTH) }
function cpBaseY(z){ return cpHorizonY() + (cpLaunchY() - cpHorizonY()) * cpPersp(z) }

// Welt-Koordinaten (x seitlich, y Höhe, z Tiefe) → Bildschirm
function cpProject(wx, wy, z){
  const p = cpPersp(z)
  return { x: cpW / 2 + wx * p, y: cpBaseY(z) - wy * p, s: p }
}

// ── Burg aufbauen ───────────────────────────────────────────────
function cpBuildFortress(){
  const world = document.getElementById('cpWorld')
  world.innerHTML = ''
  cpBarrels = []

  const layout = CP_STAGES[cpStage - 1].barrels
  cpPlanes = [...new Set(layout.map(b => b.plane || 1))].sort((a, b) => a - b)

  layout.forEach(def => {
    const plane = def.plane || 1
    const el = document.createElement('div')
    el.className = 'cp-fass'
    el.innerHTML = '<div class="cp-fass-img"></div>'
    // hintere Ebenen kleiner zeichnen und hinter die vorderen legen
    el.style.zIndex = String(Math.round(40 - plane * 10))
    world.appendChild(el)

    const b = { x: def.x, row: def.row, plane, el, alive: true }
    cpSizeBarrel(b)
    cpRenderBarrelPos(b, true)
    cpBarrels.push(b)
  })
}

function cpSizeBarrel(b){
  const p = cpPersp(b.plane)
  b.el.style.width  = (CP_FASS_W * p) + 'px'
  b.el.style.height = (CP_FASS_H * p) + 'px'
}

// Fass-Unterkante steht bei row * CP_FASS_H über dem Burg-Boden
function cpRenderBarrelPos(b, instant){
  const p  = cpPersp(b.plane)
  const sx = cpW / 2 + b.x * p
  const sy = cpBaseY(b.plane) - b.row * CP_FASS_H * p
  if(instant) b.el.style.transition = 'none'
  b.el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`
  if(instant){
    void b.el.offsetWidth
    b.el.style.transition = ''
  }
}

function cpAliveCount(){
  return cpBarrels.filter(b => b.alive).length
}

// ── Kokosnuss (Ruhelage + Ziehen) ───────────────────────────────
function cpResetCoconut(){
  const coco = document.getElementById('cpCoconut')
  if(!coco) return
  cpFlight = null
  cpAim    = null
  cpAiming = true
  coco.style.display = ''
  coco.classList.remove('cp-coconut-snap')
  cpRenderCoconut(0, CP_LAUNCH_H, 0, 1, 0)
}

// Kokosnuss an Welt-Position rendern (Größe/Lage projiziert)
function cpRenderCoconut(wx, wy, z, extraScale, rot){
  const coco = document.getElementById('cpCoconut')
  if(!coco) return
  const pos = cpProject(wx, wy, z)
  coco.style.zIndex = z < 1 ? '60' : '28'
  coco.style.transform =
    `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) ` +
    `scale(${pos.s * (extraScale || 1)}) rotate(${rot || 0}deg)`
}

function cpHideHint(){
  if(!cpHintShown) return
  cpHintShown = false
  const hint = document.getElementById('cpDragHint')
  if(hint) hint.style.opacity = '0'
}

// ── Zieh-Eingabe ────────────────────────────────────────────────
function cpDragBegin(x, y){
  cpDragStartP = { x, y }
  cpAim = null
  cpHideHint()
}

function cpDragMove(x, y){
  if(!cpDragStartP || !cpAiming) return
  const dx = x - cpDragStartP.x
  const dy = y - cpDragStartP.y

  const fullPull = cpH * CP_PULL_FULL
  const pull  = Math.max(0, Math.min(dy, fullPull))
  const power = pull / fullPull

  // Schleuder-Logik: nach unten ziehen = Kraft, zur Seite ziehen =
  // Abwurf in die Gegenrichtung (wie beim Zurückspannen)
  const offX = Math.max(-80, Math.min(80, dx * 0.55))
  const offY = Math.max(-20, Math.min(110, dy * 0.55))

  cpAim = {
    vx: Math.max(-CP_VX_MAX, Math.min(CP_VX_MAX, -dx * CP_AIM_SENS)),
    vy: CP_VY_MIN + (CP_VY_MAX - CP_VY_MIN) * power,
    wx: offX,
    wy: Math.max(6, CP_LAUNCH_H - offY * 0.4),
    armed: dy > CP_PULL_MIN,
  }

  // Kokosnuss folgt dem Finger (Gummiband-Gefühl)
  const coco = document.getElementById('cpCoconut')
  if(coco){
    const rest = cpProject(0, CP_LAUNCH_H, 0)
    coco.style.transform =
      `translate3d(${rest.x + offX}px, ${rest.y + offY}px, 0) translate(-50%, -50%) ` +
      `scale(${1 + power * 0.18})`
  }

  if(cpAim.armed) cpShowPreview()
  else            cpHidePreview()
}

function cpDragEnd(){
  cpDragStartP = null
  cpHidePreview()
  if(!cpAiming) return

  if(cpAim && cpAim.armed){
    cpLaunch()
  } else {
    // zu kurz gezogen → Kokosnuss schnappt zurück, kein Wurf verbraucht
    cpAim = null
    const coco = document.getElementById('cpCoconut')
    if(coco){
      coco.classList.add('cp-coconut-snap')
      cpRenderCoconut(0, CP_LAUNCH_H, 0, 1, 0)
      setGameTimeout(() => coco.classList.remove('cp-coconut-snap'), 300, cpTimers)
    }
  }
}

// Eingabe: native Touch-Events für den Finger, Pointer-Events nur
// für Maus/Stift – gleiches Muster wie Level 8 (setPointerCapture
// ist für Touch auf iOS/WebKit unzuverlässig).
// (einmalig aus main.js gebunden)
function cpBindInput(){
  const area = document.getElementById('cpGameArea')
  if(!area) return

  const mayStart = (target, clientY) => {
    if(!cpRunning || !cpAiming) return false
    if(target.closest('.hud') || target.closest('.back-btn')) return false
    // großzügige Daumen-Zone: untere Bildschirmhälfte
    const rect = area.getBoundingClientRect()
    return clientY > rect.top + rect.height * 0.45
  }

  // ── Touch (iOS/Android) ───────────────────────────────────────
  area.addEventListener('touchstart', (e) => {
    const t = e.touches[0]
    if(!t || !mayStart(e.target, t.clientY)) return
    e.preventDefault()
    cpDragId = 'touch'
    cpDragBegin(t.clientX, t.clientY)
  }, { passive: false })

  area.addEventListener('touchmove', (e) => {
    if(cpDragId !== 'touch') return
    const t = e.touches[0]
    if(!t) return
    e.preventDefault()
    cpDragMove(t.clientX, t.clientY)
  }, { passive: false })

  const endTouch = () => {
    if(cpDragId !== 'touch') return
    cpDragId = null
    cpDragEnd()
  }
  area.addEventListener('touchend', endTouch)
  area.addEventListener('touchcancel', endTouch)

  // ── Maus / Stift (Desktop) ────────────────────────────────────
  area.addEventListener('pointerdown', (e) => {
    if(e.pointerType === 'touch' || !mayStart(e.target, e.clientY)) return
    cpDragId = e.pointerId
    if(area.setPointerCapture) area.setPointerCapture(e.pointerId)
    cpDragBegin(e.clientX, e.clientY)
  })

  area.addEventListener('pointermove', (e) => {
    if(e.pointerType === 'touch' || e.pointerId !== cpDragId) return
    cpDragMove(e.clientX, e.clientY)
  })

  const endPointer = (e) => {
    if(e.pointerType === 'touch' || e.pointerId !== cpDragId) return
    cpDragId = null
    cpDragEnd()
  }
  area.addEventListener('pointerup', endPointer)
  area.addEventListener('pointercancel', endPointer)

  window.addEventListener('resize', () => {
    if(cpRunning) cpRelayout()
  })
}

// Nach Rotation/Resize alles neu projizieren
function cpRelayout(){
  cpMeasure()
  cpBarrels.forEach(b => {
    if(!b.alive) return
    cpSizeBarrel(b)
    cpRenderBarrelPos(b, true)
  })
  if(cpAiming) cpResetCoconut()
}

// ── Flugbahn-Vorschau ───────────────────────────────────────────
function cpBuildDots(){
  const world = document.getElementById('cpWorld')
  cpDots = []
  for(let i = 0; i < 12; i++){
    const d = document.createElement('div')
    d.className = 'cp-dot'
    d.style.display = 'none'
    world.appendChild(d)
    cpDots.push(d)
  }
}

function cpShowPreview(){
  if(!cpAim) return
  const maxZ = cpPlanes[cpPlanes.length - 1]
  const sim = { wx: cpAim.wx, wy: cpAim.wy, z: 0, vx: cpAim.vx, vy: cpAim.vy }
  const dt = 0.085

  let i = 0
  for(; i < cpDots.length; i++){
    sim.z  += CP_Z_SPEED * dt
    sim.vy -= CP_GRAVITY * dt
    sim.wy += sim.vy * dt
    sim.wx += sim.vx * dt
    if(sim.z > maxZ || sim.wy < 0) break

    const pos = cpProject(sim.wx, sim.wy, sim.z)
    const d = cpDots[i]
    d.style.display = ''
    d.style.opacity = String(0.9 - i * 0.055)
    d.style.transform =
      `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${pos.s})`
  }
  for(; i < cpDots.length; i++) cpDots[i].style.display = 'none'
}

function cpHidePreview(){
  cpDots.forEach(d => d.style.display = 'none')
}

// ── Abwurf & Flug ───────────────────────────────────────────────
function cpLaunch(){
  if(!cpAim) return
  cpAiming     = false
  cpThrowsLeft--
  cpFlight = { wx: cpAim.wx, wy: cpAim.wy, z: 0, vx: cpAim.vx, vy: cpAim.vy, rot: 0 }
  cpAim = null

  vibe(VIBRATE.SMALL)
  cpUpdateHUD()

  cpLastNow = performance.now()
  cpRafId   = requestAnimationFrame(cpLoop)
}

function cpLoop(now){
  if(!cpRunning || !cpFlight) return

  const dt = Math.min((now - cpLastNow) / 1000, 0.05)
  cpLastNow = now

  const f = cpFlight
  const prevZ = f.z
  f.z   += CP_Z_SPEED * dt
  f.vy  -= CP_GRAVITY * dt
  f.wy  += f.vy * dt
  f.wx  += f.vx * dt
  f.rot += 420 * dt

  // Ebene(n) der Burg durchflogen? → Treffer prüfen
  for(const planeZ of cpPlanes){
    if(prevZ < planeZ && f.z >= planeZ){
      const t  = (planeZ - prevZ) / (f.z - prevZ)
      const ix = f.wx - f.vx * dt * (1 - t)
      const iy = f.wy - f.vy * dt * (1 - t)
      if(cpPlaneHit(planeZ, ix, iy)) return
    }
  }

  // im Sand gelandet (zu wenig Kraft)
  if(f.vy < 0 && f.wy <= 0){
    cpMissEffect('💨', f.wx, 0, f.z)
    cpEndFlight()
    return
  }

  // hinter der Burg verschwunden (zu viel Kraft / vorbei)
  if(f.z > cpPlanes[cpPlanes.length - 1] + 0.4){
    cpEndFlight()
    return
  }

  cpRenderCoconut(f.wx, f.wy, f.z, 1, f.rot)
  cpRafId = requestAnimationFrame(cpLoop)
}

// Treffer-Prüfung auf einer Tiefen-Ebene. true = Kokosnuss verbraucht.
function cpPlaneHit(planeZ, ix, iy){
  const radius = CP_STAGES[cpStage - 1].hitRadius
  const hits = cpBarrels.filter(b => {
    if(!b.alive || b.plane !== planeZ) return false
    const bx = b.x
    const by = b.row * CP_FASS_H + CP_FASS_H / 2
    return Math.hypot(ix - bx, iy - by) <= radius
  })
  if(!hits.length) return false   // durch die Lücke / drüber – weiterfliegen

  vibe(VIBRATE.MEDIUM)
  hits.forEach(b => cpDestroyBarrel(b, 'break'))
  cpMissEffect('💥', ix, iy, planeZ)

  const coco = document.getElementById('cpCoconut')
  if(coco) coco.style.display = 'none'
  cpFlight = null
  if(cpRafId){ cancelAnimationFrame(cpRafId); cpRafId = null }
  cpUpdateHUD()

  // kurz warten, dann prüfen, welche Fässer den Halt verlieren
  setGameTimeout(cpSettle, 240, cpTimers)
  return true
}

function cpEndFlight(){
  const coco = document.getElementById('cpCoconut')
  if(coco) coco.style.display = 'none'
  cpFlight = null
  if(cpRafId){ cancelAnimationFrame(cpRafId); cpRafId = null }
  setGameTimeout(cpResolveThrow, 500, cpTimers)
}

// kleiner Effekt (💥/💨) an einer Welt-Position
function cpMissEffect(emoji, wx, wy, z){
  const world = document.getElementById('cpWorld')
  if(!world) return
  const pos = cpProject(wx, wy, z)
  const el = document.createElement('div')
  el.className   = 'cp-boom'
  el.textContent = emoji
  el.style.transform =
    `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${pos.s})`
  world.appendChild(el)
  setGameTimeout(() => el.remove(), 600, cpTimers)
}

// ── Einsturz-Logik ──────────────────────────────────────────────
// Ein Fass hat Halt, wenn es am Boden steht oder in der Reihe
// darunter ein Fass (fast) direkt unter ihm steht. Fässer ohne
// Halt kippen um und zählen als zerstört – Durchlauf für
// Durchlauf, damit hohe Türme sichtbar Reihe für Reihe einstürzen.
function cpSettle(){
  if(!cpRunning) return

  const falling = cpBarrels.filter(b => {
    if(!b.alive || b.row === 0) return false
    return !cpBarrels.some(o =>
      o.alive && o !== b && o.plane === b.plane &&
      o.row === b.row - 1 && Math.abs(o.x - b.x) <= CP_SUPPORT_X
    )
  })

  if(!falling.length){
    cpResolveThrow()
    return
  }

  falling.forEach(b => cpDestroyBarrel(b, 'roll'))
  cpUpdateHUD()

  setGameTimeout(cpSettle, 180, cpTimers)
}

function cpDestroyBarrel(b, mode){
  b.alive = false
  cpDestroyed++
  const img = b.el.querySelector('.cp-fass-img')
  if(img){
    img.style.setProperty('--cp-fly-x', (b.x >= 0 ? 1 : -1) * (60 + Math.random() * 50) + 'px')
    img.classList.add(mode === 'roll' ? 'cp-fass-roll' : 'cp-fass-break')
  }
  setGameTimeout(() => b.el.remove(), 800, cpTimers)
}

// ── Wurf abschließen / Stufen-Ende ──────────────────────────────
function cpResolveThrow(){
  if(!cpRunning) return
  cpUpdateHUD()

  if(cpAliveCount() === 0){
    setGameTimeout(() => cpStageEnd(), 650, cpTimers)
  } else if(cpThrowsLeft <= 0){
    setGameTimeout(() => cpStageEnd(), 700, cpTimers)
  } else {
    setGameTimeout(cpResetCoconut, 350, cpTimers)
  }
}

function cpScore(){
  const total = CP_STAGES[cpStage - 1].barrels.length
  const pct   = Math.round((cpDestroyed / total) * 100)
  const bonus = cpDestroyed === total ? cpThrowsLeft * CP_BONUS_PER_COCO : 0
  return { total, pct, score: pct + bonus }
}

function cpStars(pct){
  const th = CP_STAGES[cpStage - 1].starPct
  if(pct >= th[2]) return 3
  if(pct >= th[1]) return 2
  if(pct >= th[0]) return 1
  return 0
}

function cpStageEnd(){
  cpRunning = false
  const { total, pct, score } = cpScore()
  const stars = cpStars(pct)
  const stage = cpStage

  if(stars >= 1){
    // Stufe geschafft: nächste Stufe freischalten, Sieg speichern
    const data = loadPlayerData()
    if(stage < CP_STAGES.length){
      data.catapultStageUnlocked = Math.max(data.catapultStageUnlocked || 1, stage + 1)
    } else {
      data.statistics.catapultLevelWins = (data.statistics.catapultLevelWins || 0) + 1
    }
    savePlayerData(data)
    awardLevelWin(9, score)
    vibe(VIBRATE.LARGE)

    if(stage < CP_STAGES.length){
      showLevelComplete({
        title:  '🥥 Volltreffer!',
        text:   `${cpDestroyed} von ${total} Fässern umgeworfen –\n${score} Punkte! +1 Knochen 🦴`,
        button: '🏰 Nächste Stufe',
        stars,
        next:   () => cpBegin(stage + 1)
      })
    } else {
      showLevelComplete({
        title:  '👑 Burg erobert!',
        text:   `${cpDestroyed} von ${total} Fässern umgeworfen –\n${score} Punkte! +1 Knochen 🦴`,
        button: '🌴 Weiter',
        stars,
        next:   () => { cpStop(); showScreen('intro') }
      })
    }
  } else {
    showLevelComplete({
      title:  '💦 Knapp daneben!',
      text:   `Nur ${cpDestroyed} von ${total} Fässern getroffen.\nZieh weiter nach unten für mehr Kraft!`,
      button: '🔄 Nochmal',
      stars:  0,
      next:   () => cpBegin(stage)
    })
  }
}

// ── HUD ─────────────────────────────────────────────────────────
function cpUpdateHUD(){
  const info = document.getElementById('cpStageInfo')
  if(info) info.textContent = `Stufe ${cpStage} · ${CP_STAGES[cpStage - 1].name}`

  const score = document.getElementById('cpScoreEl')
  if(score){
    const { pct } = cpScore()
    const cocos = cpThrowsLeft > 0 ? '🥥'.repeat(cpThrowsLeft) : '–'
    score.textContent = `${cocos} · 🎯 ${pct} %`
  }
}

// ── Cleanup ─────────────────────────────────────────────────────
function cpStop(){
  cpRunning = false
  cpAiming  = false
  cpDragId  = null
  cpFlight  = null
  cpAim     = null
  if(cpRafId){ cancelAnimationFrame(cpRafId); cpRafId = null }
  clearGameTimeouts(cpTimers)
  cpBarrels = []
  cpDots    = []
  const world = document.getElementById('cpWorld')
  if(world) world.innerHTML = ''
  const coco = document.getElementById('cpCoconut')
  if(coco) coco.style.display = 'none'
}

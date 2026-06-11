/* ══════════════════════════════════════
   LEVEL 10 – BUDDEL-SPASS
   Im Sand sind Knochen vergraben!
   2× tippen = graben. Oskars Nase
   verrät, ob ein Knochen in der Nähe ist.
══════════════════════════════════════ */

// ── Konfiguration ───────────────────────────────────────────────
const DG_COLS    = 4
const DG_ROWS    = 4
const DG_BONES   = 6
const DG_CRABS   = 2
const DG_FILLERS = ["🐚", "⭐", "🌿", "🐚", "🪸", "⭐", "🌿", "🐚"]

// Sterne-Wertung: so wenige Löcher graben wie möglich
const DG_STARS_3 = 10   // ≤ 10 Grabungen → ⭐⭐⭐
const DG_STARS_2 = 13   // ≤ 13 Grabungen → ⭐⭐

// ── State ───────────────────────────────────────────────────────
let dgRunning    = false
let dgCells      = []     // [{ type, el, state: 'covered'|'cracked'|'revealed' }]
let dgBonesFound = 0
let dgDigs       = 0
let dgOskarTimer = null
let dgTimers     = new Set()

// ── Entry Point ─────────────────────────────────────────────────
function startDigLevel(){
  dgStopGame()
  showScreen("level10")
  document.getElementById("dgStartScreen").classList.remove("hidden")
  document.getElementById("dgGameArea").classList.add("hidden")
}

function dgBeginGame(){
  dgStopGame()
  dgRunning    = true
  dgBonesFound = 0
  dgDigs       = 0

  document.getElementById("dgStartScreen").classList.add("hidden")
  document.getElementById("dgGameArea").classList.remove("hidden")

  const data = loadPlayerData()
  data.statistics.digGamesPlayed = (data.statistics.digGamesPlayed || 0) + 1
  savePlayerData(data)

  dgBuildGrid()
  dgUpdateHUD()
  dgSetOskar(ASSETS.OSKAR_DEFAULT)
  dgSay("Hier irgendwo sind Knochen! 🤔")
}

// ── Spielfeld bauen ─────────────────────────────────────────────
function dgBuildGrid(){
  // Inhalte mischen: Knochen, Krabben, Strandfunde
  const contents = []
  for(let i = 0; i < DG_BONES; i++) contents.push({ type: "bone" })
  for(let i = 0; i < DG_CRABS; i++) contents.push({ type: "crab" })
  const fillerCount = DG_COLS * DG_ROWS - DG_BONES - DG_CRABS
  for(let i = 0; i < fillerCount; i++) contents.push({ type: "filler", emoji: DG_FILLERS[i % DG_FILLERS.length] })

  // Fisher-Yates Shuffle
  for(let i = contents.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[contents[i], contents[j]] = [contents[j], contents[i]]
  }

  const grid = document.getElementById("dgGrid")
  grid.innerHTML = ""
  dgCells = []

  contents.forEach((content, idx) => {
    const cell = document.createElement("button")
    cell.className = "dg-cell"
    cell.innerHTML = `<span class="dg-mound">⛰️</span>`
    cell.setAttribute("aria-label", "Sandhügel")

    const entry = { ...content, el: cell, state: "covered" }
    dgCells.push(entry)

    cell.addEventListener("click", () => dgDigCell(idx))
    cell.addEventListener("touchstart", (e) => {
      e.preventDefault()
      dgDigCell(idx)
    }, { passive: false })

    grid.appendChild(cell)
  })
}

// ── Graben ──────────────────────────────────────────────────────
function dgDigCell(idx){
  if(!dgRunning) return
  const cell = dgCells[idx]
  if(!cell || cell.state === "revealed") return

  dgSandBurst(cell.el)
  vibe(VIBRATE.SMALL)

  if(cell.state === "covered"){
    // Erster Tap: Hügel bekommt Risse
    cell.state = "cracked"
    cell.el.classList.add("dg-cracked")
    cell.el.querySelector(".dg-mound").textContent = "🕳️"
    dgWiggleOskar()
    return
  }

  // Zweiter Tap: aufdecken!
  cell.state = "revealed"
  dgDigs++
  cell.el.classList.add("dg-revealed")
  dgUpdateHUD()

  if(cell.type === "bone"){
    dgRevealBone(cell)
  } else if(cell.type === "crab"){
    dgRevealCrab(cell)
  } else {
    dgRevealFiller(cell, idx)
  }

  dgRefreshHints()
}

function dgRevealBone(cell){
  cell.el.innerHTML = `<span class="dg-find dg-find-bone">🦴</span>`
  dgBonesFound++
  dgUpdateHUD()
  vibe(VIBRATE.MEDIUM)
  dgSay("WUFF! Ein Knochen! 🦴🎉")
  dgSetOskar(ASSETS.OSKAR_TONGUE_LEFT, 900)

  if(dgBonesFound >= DG_BONES){
    dgRunning = false
    setGameTimeout(dgWin, 700, dgTimers)
  }
}

function dgRevealCrab(cell){
  cell.el.innerHTML = `<img src="${ASSETS.KREBS}" class="dg-find dg-find-crab" alt="Krabbe">`
  vibe(VIBRATE.LARGE)
  dgSay("Iiieh! Eine Krabbe! 🦀😱")
  dgWiggleOskar()
}

function dgRevealFiller(cell, idx){
  cell.el.innerHTML = `<span class="dg-find">${cell.emoji}</span>`

  // Schnüffel-Hinweis: liegt neben diesem Loch noch ein Knochen?
  if(dgHasBoneNeighbor(idx)){
    dgSay("Schnüffel… hier riecht's nach Knochen! 👃")
  } else {
    dgSay("Hmm, hier riecht es nach gar nichts. 😴")
  }
}

// ── Schnüffel-Hinweise ──────────────────────────────────────────
function dgHasBoneNeighbor(idx){
  const col = idx % DG_COLS
  const row = Math.floor(idx / DG_COLS)

  for(let dr = -1; dr <= 1; dr++){
    for(let dc = -1; dc <= 1; dc++){
      if(dr === 0 && dc === 0) continue
      const r = row + dr, c = col + dc
      if(r < 0 || r >= DG_ROWS || c < 0 || c >= DG_COLS) continue
      const n = dgCells[r * DG_COLS + c]
      if(n.type === "bone" && n.state !== "revealed") return true
    }
  }
  return false
}

function dgRefreshHints(){
  // 👃-Marker auf allen aufgedeckten Fund-Feldern aktuell halten,
  // damit die Hinweise auch nach gefundenen Knochen stimmen
  dgCells.forEach((cell, idx) => {
    if(cell.state !== "revealed" || cell.type !== "filler") return
    const hasHint = dgHasBoneNeighbor(idx)
    let badge = cell.el.querySelector(".dg-nose")
    if(hasHint && !badge){
      badge = document.createElement("span")
      badge.className   = "dg-nose"
      badge.textContent = "👃"
      cell.el.appendChild(badge)
    } else if(!hasHint && badge){
      badge.remove()
    }
  })
}

// ── Effekte ─────────────────────────────────────────────────────
function dgSandBurst(cellEl){
  for(let i = 0; i < 5; i++){
    const p = document.createElement("span")
    p.className   = "dg-sand"
    p.textContent = "•"
    p.style.setProperty("--dx", (Math.random() * 60 - 30) + "px")
    p.style.setProperty("--dy", (-20 - Math.random() * 40) + "px")
    p.style.left = (35 + Math.random() * 30) + "%"
    cellEl.appendChild(p)
    setGameTimeout(() => p.remove(), 600, dgTimers)
  }
}

function dgSay(text){
  const bubble = document.getElementById("dgBubble")
  if(!bubble) return
  bubble.textContent = text
  bubble.classList.remove("dg-bubble-pop")
  void bubble.offsetWidth
  bubble.classList.add("dg-bubble-pop")
}

function dgSetOskar(src, revertMs){
  const oskar = document.getElementById("dgOskar")
  if(!oskar) return
  oskar.src = src
  if(dgOskarTimer){ clearTimeout(dgOskarTimer); dgOskarTimer = null }
  if(revertMs){
    dgOskarTimer = setTimeout(() => {
      if(oskar) oskar.src = ASSETS.OSKAR_DEFAULT
    }, revertMs)
  }
}

function dgWiggleOskar(){
  const oskar = document.getElementById("dgOskar")
  if(!oskar) return
  oskar.classList.remove("dg-oskar-wiggle")
  void oskar.offsetWidth
  oskar.classList.add("dg-oskar-wiggle")
}

// ── HUD ─────────────────────────────────────────────────────────
function dgUpdateHUD(){
  const counter = document.getElementById("dgCounter")
  if(counter) counter.textContent = `🦴 ${dgBonesFound} / ${DG_BONES}`

  const digs = document.getElementById("dgDigs")
  if(digs) digs.textContent = `🕳️ ${dgDigs} Löcher gebuddelt`
}

// ── Win ─────────────────────────────────────────────────────────
function dgWin(){
  const score = Math.max(10, 200 - dgDigs * 10)
  awardLevelWin(10, score)

  const data = loadPlayerData()
  data.statistics.digLevelWins = (data.statistics.digLevelWins || 0) + 1
  savePlayerData(data)

  const stars = dgDigs <= DG_STARS_3 ? 3 : dgDigs <= DG_STARS_2 ? 2 : 1
  vibe(VIBRATE.LARGE)
  showLevelComplete({
    title:  "🦴 Alle Knochen gefunden!",
    text:   `Du hast nur ${dgDigs} Löcher gebraucht!\nOskar buddelt vor Freude! +1 Knochen 🦴`,
    button: "🌴 Weiter",
    stars,
    next:   () => { dgStopGame(); showScreen("intro") }
  })
}

// ── Cleanup ─────────────────────────────────────────────────────
function dgStopGame(){
  dgRunning = false
  clearGameTimeouts(dgTimers)
  if(dgOskarTimer){ clearTimeout(dgOskarTimer); dgOskarTimer = null }
  dgCells = []
}

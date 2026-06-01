/* ══════════════════════════════════════
   LEVEL 7 - FINDE DEN BUCHSTABEN
══════════════════════════════════════ */

const L7_ROUNDS_CFG = [
  { rows:3, cols:4, targets:2, pool:"ABCDEFHIK" },
  { rows:3, cols:4, targets:3, pool:"ABCDEFHIKLM" },
  { rows:4, cols:4, targets:2, pool:"ABCDEFHIKLMNOP" },
  { rows:4, cols:4, targets:3, pool:"ABCDFGHIKLMNOPQR" },
  { rows:4, cols:5, targets:3, pool:"BCDEFGHIKLMNOPQRST" },
]

let l7Round       = 0
let l7Target      = ""
let l7Grid        = []
let l7TotalTarget = 0
let l7FoundCount  = 0
let l7Busy        = false
let l7StartTime   = 0

function startLevel7(){
  l7Round     = 0
  l7StartTime = Date.now()
  incrementGameCount('level7')
  showScreen("level7")
  l7StartRound()
}

function l7StartRound(){
  const cfg = L7_ROUNDS_CFG[l7Round]
  l7FoundCount  = 0
  l7TotalTarget = cfg.targets
  l7Busy        = false

  const letters = cfg.pool.split("")
  l7Target = letters[Math.floor(Math.random() * letters.length)]

  const total = cfg.rows * cfg.cols
  const cells = []

  for(let i = 0; i < cfg.targets; i++) cells.push(l7Target)
  while(cells.length < total){
    const d = letters[Math.floor(Math.random() * letters.length)]
    if(d !== l7Target) cells.push(d)
  }

  for(let i = cells.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }

  l7Grid = cells.map(letter => ({ letter, found: false, wrong: false }))

  document.getElementById("l7Sub").textContent =
    `Runde ${l7Round + 1} von ${L7_ROUNDS_CFG.length}`
  document.getElementById("l7Prompt").textContent =
    `Finde den Buchstaben  ${l7Target}`
  document.getElementById("l7Progress").textContent =
    `0 von ${cfg.targets} gefunden`

  renderL7Grid(cfg.cols)
  document.getElementById("l7Feedback").textContent = ""
}

function renderL7Grid(cols){
  const grid = document.getElementById("l7Grid")
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
  grid.innerHTML = ""

  l7Grid.forEach((cell, i) => {
    const el = document.createElement("div")
    el.className = "l7-cell"
    if(cell.found) el.classList.add("l7-found")
    if(cell.wrong) el.classList.add("l7-wrong")
    el.textContent = cell.letter

    if(!cell.found){
      el.addEventListener("click", () => onL7CellClick(i))
    }
    grid.appendChild(el)
  })
}

function onL7CellClick(i){
  if(l7Busy) return
  const cell = l7Grid[i]
  if(cell.found) return

  vibe(VIBRATE.SMALL)
  const cfg = L7_ROUNDS_CFG[l7Round]

  if(cell.letter === l7Target){
    cell.found = true
    l7FoundCount++
    vibe(VIBRATE.MEDIUM)

    document.getElementById("l7Progress").textContent =
      `${l7FoundCount} von ${cfg.targets} gefunden`
    document.getElementById("l7Feedback").textContent = "⭐ Toll gemacht!"
    document.getElementById("l7Feedback").className = "l7-feedback l7-fb-correct"

    renderL7Grid(cfg.cols)

    if(l7FoundCount >= cfg.targets){
      l7Busy = true
      setTimeout(() => {
        l7Round++
        if(l7Round >= L7_ROUNDS_CFG.length){
          l7Win()
        } else {
          document.getElementById("l7Feedback").textContent = ""
          l7StartRound()
        }
      }, 1000)
    }

  } else {
    cell.wrong = true
    renderL7Grid(cfg.cols)
    document.getElementById("l7Feedback").textContent = "❌ Versuch es noch einmal!"
    document.getElementById("l7Feedback").className = "l7-feedback l7-fb-wrong"

    setTimeout(() => {
      cell.wrong = false
      renderL7Grid(cfg.cols)
      document.getElementById("l7Feedback").textContent = ""
    }, 700)
  }
}

function l7Win(){
  const elapsed = Date.now() - l7StartTime
  setTimeout(() => {
    onLevel7Win(L7_ROUNDS_CFG.length, elapsed)
    showLevelComplete({
      title: "🔍 Geschafft!",
      text:  "Oskar hat den Buchstaben gefunden! Du bist ein Spürhund! 🐶",
      button:"🔄 Nochmal spielen",
      next:  () => { vibe(VIBRATE.MEDIUM); startLevel7() }
    })
  }, DELAYS.LEVEL_COMPLETE)
}

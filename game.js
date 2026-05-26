/* ══════════════════════════════════════
   CONSTANTS & CONFIG
══════════════════════════════════════ */

// 🔧 DEBUG: Starte direkt bei Level 3 zum Testen!
// Ersetze "startLevel3" mit "startLevel1" um normal zu spielen
const DEBUG_START_LEVEL = "startLevel1"

// Asset paths
const ASSETS = {
  OSKAR_DEFAULT: "assets/OskarCartoon.png",
  OSKAR_TONGUE_LEFT: "assets/OskarZungelinks.png",
  OSKAR_TONGUE_RIGHT: "assets/OskarZungerechts.png",
  OSKAR_SWIMSUIT: "assets/OskarBadehose.png",
  OSKAR_JUMP: "assets/Oskar_springt.png",
  OSKAR_CHAIR: "assets/OskarLiegestuhl.png",
  POOP: "assets/Kothaufen.png"
}

// Level 1 - Snacks
const LEVEL1_SNACK_GOAL = 5
const LEVEL1_SNACK_CLICK_DELAY = 250

// Level 2 - Maze
const MAZE_SIZE = 15

// Level 3 - Runner (ANGEPASST - Mobile freundlicher)
const L3_GROUND = 0
const L3_JUMP_VEL = -18
const L3_GRAVITY = 1.0
const L3_WIN_DIST = 150              // ← War 200, jetzt kürzer
const L3_SPEED_START = 3.5
const L3_SPEED_MAX = 7.5             // ← War 9, jetzt sanfter
const L3_SPEED_INCREASE = 0.008      // ← War 0.012, jetzt langsamere Steigerung
const L3_SPEED_FRAME_RATE = 0.05
const L3_COLLISION_MARGIN = 18
const L3_OBSTACLE_SPACING = 400      // ← Mehr Abstand zwischen Hindernissen

// Level 4 - Match3
const EMOJIS = ["🐶","🦴","🌴","🥏","🍖","☀️","🌊"]
const BOARD_COLS = 7
const BOARD_ROWS = 7
const MATCH_WIN_SCORE = 300
const MATCH_POP_DELAY = 280
const MATCH_POINT_PER_MATCH = 10

// Vibration patterns
const VIBRATE = {
  SMALL: 30,
  MEDIUM: 40,
  LARGE: [80, 50, 80]
}

// Timing delays
const DELAYS = {
  LEVEL_COMPLETE: 400,
  POPUP: 200,
  LEVEL3_RETRY: 300
}

/* ══════════════════════════════════════
   PRELOAD ASSETS
══════════════════════════════════════ */

const preloadImages = [
  ASSETS.OSKAR_DEFAULT,
  ASSETS.OSKAR_TONGUE_LEFT,
  ASSETS.OSKAR_TONGUE_RIGHT,
  ASSETS.OSKAR_SWIMSUIT,
  ASSETS.OSKAR_JUMP,
  ASSETS.OSKAR_CHAIR,
  ASSETS.POOP
]

preloadImages.forEach(src => {
  const img = new Image()
  img.src = src
})




/* ══════════════════════════════════════
   LEVEL 4 - MATCH 3
══════════════════════════════════════ */

let matchBoard   = []
let matchScore   = 0
let matchSel     = null   // { row, col }
let matchBusy    = false

function startLevel4(){

  matchScore = 0
  matchSel   = null
  matchBusy  = false

  document.getElementById("matchScore").textContent = "Punkte: 0"

  showScreen("level4")
  initMatchBoard()
  renderMatchBoard()

}

function initMatchBoard(){

  matchBoard = []

  for(let r = 0; r < BOARD_ROWS; r++){
    matchBoard[r] = []
    for(let c = 0; c < BOARD_COLS; c++){
      matchBoard[r][c] = randomEmoji(r, c)
    }
  }

}

function randomEmoji(row, col){

  // Avoid creating an instant match during board setup
  let emoji
  do {
    emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  } while(
    (col >= 2 && matchBoard[row][col-1] === emoji && matchBoard[row][col-2] === emoji) ||
    (row >= 2 && matchBoard[row-1]?.[col] === emoji && matchBoard[row-2]?.[col] === emoji)
  )
  return emoji

}

function renderMatchBoard(){

  const board = document.getElementById("matchBoard")
  board.innerHTML = ""

  for(let r = 0; r < BOARD_ROWS; r++){
    for(let c = 0; c < BOARD_COLS; c++){

      const cell = document.createElement("div")
      cell.className = "match-cell"
      cell.textContent = matchBoard[r][c]
      cell.dataset.row = r
      cell.dataset.col = c

      if(matchSel && matchSel.row === r && matchSel.col === c){
        cell.classList.add("selected")
      }

      cell.addEventListener("click", () => onMatchCellClick(r, c))
      board.appendChild(cell)

    }
  }

}

function onMatchCellClick(row, col){

  if(matchBusy) return

  if(!matchSel){
    matchSel = { row, col }
    renderMatchBoard()
    return
  }

  const dr = Math.abs(matchSel.row - row)
  const dc = Math.abs(matchSel.col - col)

  // Must be adjacent
  if(dr + dc !== 1){
    matchSel = { row, col }
    renderMatchBoard()
    return
  }

  // Swap
  swapCells(matchSel.row, matchSel.col, row, col)
  const matches = findMatches()

  if(matches.length === 0){
    // Swap back — invalid move
    swapCells(matchSel.row, matchSel.col, row, col)
    matchSel = null
    renderMatchBoard()
    return
  }

  matchSel  = null
  matchBusy = true
  renderMatchBoard()

  setTimeout(() => processMatches(), DELAYS.POPUP)

}

function swapCells(r1, c1, r2, c2){
  const tmp        = matchBoard[r1][c1]
  matchBoard[r1][c1] = matchBoard[r2][c2]
  matchBoard[r2][c2] = tmp
}

function findMatches(){

  const matched = new Set()

  // Horizontal
  for(let r = 0; r < BOARD_ROWS; r++){
    for(let c = 0; c < BOARD_COLS - 2; c++){
      const e = matchBoard[r][c]
      if(e === matchBoard[r][c+1] && e === matchBoard[r][c+2]){
        matched.add(`${r},${c}`)
        matched.add(`${r},${c+1}`)
        matched.add(`${r},${c+2}`)
      }
    }
  }

  // Vertical
  for(let r = 0; r < BOARD_ROWS - 2; r++){
    for(let c = 0; c < BOARD_COLS; c++){
      const e = matchBoard[r][c]
      if(e === matchBoard[r+1][c] && e === matchBoard[r+2][c]){
        matched.add(`${r},${c}`)
        matched.add(`${r+1},${c}`)
        matched.add(`${r+2},${c}`)
      }
    }
  }

  return [...matched].map(k => {
    const [r, c] = k.split(",").map(Number)
    return { r, c }
  })

}

function processMatches(){

  const matches = findMatches()

  if(matches.length === 0){
    matchBusy = false
    renderMatchBoard()
    checkWin()
    return
  }

  vibe([VIBRATE.SMALL, 20, VIBRATE.SMALL])

  // Pop animation
  matches.forEach(({ r, c }) => {
    const idx  = r * BOARD_COLS + c
    const cell = document.getElementById("matchBoard").children[idx]
    if(cell) cell.classList.add("pop")
  })

  matchScore += matches.length * MATCH_POINT_PER_MATCH
  document.getElementById("matchScore").textContent = `Punkte: ${matchScore}`

  setTimeout(() => {

    // Remove matched cells (set null)
    matches.forEach(({ r, c }) => {
      matchBoard[r][c] = null
    })

    // Drop down
    for(let c = 0; c < BOARD_COLS; c++){
      let emptyRow = BOARD_ROWS - 1
      for(let r = BOARD_ROWS - 1; r >= 0; r--){
        if(matchBoard[r][c] !== null){
          matchBoard[emptyRow][c] = matchBoard[r][c]
          if(emptyRow !== r) matchBoard[r][c] = null
          emptyRow--
        }
      }
      // Fill top with new emojis
      for(let r = emptyRow; r >= 0; r--){
        matchBoard[r][c] = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
      }
    }

    renderMatchBoard()
    setTimeout(() => processMatches(), MATCH_POP_DELAY)

  }, MATCH_POP_DELAY)

}

function checkWin(){

  if(matchScore >= MATCH_WIN_SCORE){
    setTimeout(() => {
      showLevelComplete({
        title: "🏆 Oskar gewinnt!",
        text:  "Du hast alle Levels geschafft! Guter Hund! 🐶🎉",
        button:"🔄 Nochmal spielen",
        next:  () => {
          vibe(VIBRATE.MEDIUM)
          showScreen("intro")
        }
      })
    }, DELAYS.LEVEL_COMPLETE)
  }

}

/* ══════════════════════════════════════
   EVENT LISTENERS (zentral)
══════════════════════════════════════ */

// INTRO - oder DEBUG_START_LEVEL zum direkt testen
document.getElementById("startBtn").addEventListener("click", () => {
  vibe(VIBRATE.MEDIUM)
  if(DEBUG_START_LEVEL === "startLevel3") startLevel3()
  else if(DEBUG_START_LEVEL === "startLevel2") startLevel2()
  else if(DEBUG_START_LEVEL === "startLevel4") startLevel4()
  else startLevel1()
})

// LEVEL 1 - Click Dog
document.getElementById("clickDog").addEventListener("click", handleClickDog)

// LEVEL 2 - D-Pad buttons
document.querySelectorAll(".dpad-btn").forEach(btn => {
  btn.addEventListener("click", handleDpadClick)
})

// LEVEL 2 & 3 - Keyboard
document.addEventListener("keydown", handleKeyDown)

// LEVEL 3 - Jump
document.getElementById("level3").addEventListener("click", () => {
  if(document.getElementById("level3").classList.contains("active")){
    l3Jump()
  }
})

// 🎮 Auto-Start entfernt - Spiel startet über den Button

/* ══════════════════════════════════════
   LEVEL 3 - CANDY MATCH
══════════════════════════════════════ */

let matchBoard      = []
let matchNextEmojis = []
let matchScore      = 0
let matchBusy       = false
let matchWon        = false
let dragStart       = null // { row, col, x, y }
let matchTimers     = new Set()

function startLevel3Match(){
  matchStopGame()
  GameManager.setActive("level3")

  matchScore = 0
  matchBusy  = false
  matchWon   = false
  dragStart  = null

  document.getElementById("matchScore").textContent = "Punkte: 0"

  showScreen("level3")
  initMatchBoard()
  matchEnsureSolvable()
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
  matchNextEmojis = []
  for(let c = 0; c < BOARD_COLS; c++){
    matchNextEmojis[c] = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  }
}

function randomEmoji(row, col){
  let emoji
  do {
    emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
  } while(
    (col >= 2 && matchBoard[row][col-1] === emoji && matchBoard[row][col-2] === emoji) ||
    (row >= 2 && matchBoard[row-1]?.[col] === emoji && matchBoard[row-2]?.[col] === emoji)
  )
  return emoji
}

// ── Sackgassen-Erkennung ─────────────────────────
// Reine Funktionen (kein DOM), damit sie sowohl im Spiel als auch
// isoliert in Tests laufen können (siehe tests/candy-match.test.js).

function cloneBoard(board){
  return board.map(row => row.slice())
}

function findMatchesOn(board){
  const rows = board.length
  const cols = board[0] ? board[0].length : 0
  const matched = new Set()

  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols - 2; c++){
      const e = board[r][c]
      if(e != null && e === board[r][c+1] && e === board[r][c+2]){
        matched.add(`${r},${c}`)
        matched.add(`${r},${c+1}`)
        matched.add(`${r},${c+2}`)
      }
    }
  }

  for(let r = 0; r < rows - 2; r++){
    for(let c = 0; c < cols; c++){
      const e = board[r][c]
      if(e != null && e === board[r+1][c] && e === board[r+2][c]){
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

// Testet, ob mindestens ein einzelner Nachbar-Tausch (rechts oder unten)
// irgendwo auf dem Feld zu einer Reihe von 3 führt.
function boardHasValidMove(board){
  const rows = board.length
  const cols = board[0] ? board[0].length : 0
  const test = cloneBoard(board)

  const trySwap = (r1, c1, r2, c2) => {
    const tmp = test[r1][c1]
    test[r1][c1] = test[r2][c2]
    test[r2][c2] = tmp
  }

  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      if(c + 1 < cols){
        trySwap(r, c, r, c + 1)
        const found = findMatchesOn(test).length > 0
        trySwap(r, c, r, c + 1)
        if(found) return true
      }
      if(r + 1 < rows){
        trySwap(r, c, r + 1, c)
        const found = findMatchesOn(test).length > 0
        trySwap(r, c, r + 1, c)
        if(found) return true
      }
    }
  }
  return false
}

// Beim Start und nach jedem Nachrücken geprüft: gibt es keinen gültigen
// Zug mehr, mischt Oskar freundlich neu – ohne dass Punkte verloren gehen.
function matchEnsureSolvable(){
  let attempts = 0
  while(!boardHasValidMove(matchBoard) && attempts < 30){
    initMatchBoard()
    attempts++
  }
  if(attempts > 0 && typeof showToast === "function"){
    showToast("🔀 Oskar mischt neu!", 1400)
  }
}

function renderMatchBoard(){
  const board = document.getElementById("matchBoard")
  board.innerHTML = ""

  // ── Preview row ──────────────────────
  for(let c = 0; c < BOARD_COLS; c++){
    const cell = document.createElement("div")
    cell.className = "match-cell match-preview"
    cell.textContent = matchNextEmojis[c]
    board.appendChild(cell)
  }

  // ── Game board ───────────────────────
  for(let r = 0; r < BOARD_ROWS; r++){
    for(let c = 0; c < BOARD_COLS; c++){
      const cell = document.createElement("div")
      cell.className = "match-cell"
      cell.textContent = matchBoard[r][c]
      cell.dataset.row = r
      cell.dataset.col = c

      // Touch (iOS / Android)
      cell.addEventListener("touchstart", e => {
        e.preventDefault()
        if(matchBusy) return
        const t = e.changedTouches[0]
        dragStart = { row: r, col: c, x: t.clientX, y: t.clientY }
      }, { passive: false })

      // Mouse (desktop)
      cell.addEventListener("mousedown", e => {
        if(matchBusy) return
        dragStart = { row: r, col: c, x: e.clientX, y: e.clientY }
      })

      board.appendChild(cell)
    }
  }
}

// ── Touch / Mouse Input ───────────────
// Document-level drag-end listeners so a swipe always completes
// regardless of where the finger/cursor ends up, bound once here
// instead of re-bound on every renderMatchBoard() call.

function matchSetupInput(){
  document.addEventListener("touchend", e => {
    if(!dragStart || matchBusy){ dragStart = null; return }
    e.preventDefault()
    const t = e.changedTouches[0]
    processSwipe(t.clientX, t.clientY)
  }, { passive: false })

  document.addEventListener("mouseup", e => {
    if(!dragStart || matchBusy){ dragStart = null; return }
    processSwipe(e.clientX, e.clientY)
  })

  document.addEventListener("touchcancel", () => { dragStart = null })
}

/* ── Swap logic ────────────────────── */

function processSwipe(clientX, clientY){
  const dx = clientX - dragStart.x
  const dy = clientY - dragStart.y
  const threshold = 18

  let targetRow = dragStart.row
  let targetCol = dragStart.col

  if(Math.abs(dx) >= Math.abs(dy)){
    if(dx >  threshold) targetCol++
    else if(dx < -threshold) targetCol--
    else { dragStart = null; return }
  } else {
    if(dy >  threshold) targetRow++
    else if(dy < -threshold) targetRow--
    else { dragStart = null; return }
  }

  const from = { ...dragStart }
  dragStart = null

  if(targetRow < 0 || targetRow >= BOARD_ROWS ||
     targetCol < 0 || targetCol >= BOARD_COLS) return

  swapCells(from.row, from.col, targetRow, targetCol)
  const matches = findMatches()

  if(matches.length === 0){
    swapCells(from.row, from.col, targetRow, targetCol)
    renderMatchBoard()
    return
  }

  matchBusy = true
  renderMatchBoard()
  setGameTimeout(() => processMatches(), DELAYS.POPUP, matchTimers)
}

/* ── Board logic ───────────────────── */

function swapCells(r1, c1, r2, c2){
  const tmp          = matchBoard[r1][c1]
  matchBoard[r1][c1] = matchBoard[r2][c2]
  matchBoard[r2][c2] = tmp
}

function findMatches(){
  return findMatchesOn(matchBoard)
}

function processMatches(){
  const matches = findMatches()

  if(matches.length === 0){
    matchBusy = false
    matchEnsureSolvable()
    renderMatchBoard()
    checkWin()
    return
  }

  vibe([VIBRATE.SMALL, 20, VIBRATE.SMALL])

  matches.forEach(({ r, c }) => {
    const idx  = (r + 1) * BOARD_COLS + c   // +1 for preview row
    const cell = document.getElementById("matchBoard").children[idx]
    if(cell) cell.classList.add("pop")
  })

  matchScore += matches.length * MATCH_POINT_PER_MATCH
  document.getElementById("matchScore").textContent = `Punkte: ${matchScore}`

  setGameTimeout(() => {
    matches.forEach(({ r, c }) => { matchBoard[r][c] = null })

    for(let c = 0; c < BOARD_COLS; c++){
      let emptyRow = BOARD_ROWS - 1
      for(let r = BOARD_ROWS - 1; r >= 0; r--){
        if(matchBoard[r][c] !== null){
          matchBoard[emptyRow][c] = matchBoard[r][c]
          if(emptyRow !== r) matchBoard[r][c] = null
          emptyRow--
        }
      }
      let usedPreview = false
      for(let r = emptyRow; r >= 0; r--){
        if(!usedPreview){
          matchBoard[r][c] = matchNextEmojis[c]
          matchNextEmojis[c] = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
          usedPreview = true
        } else {
          matchBoard[r][c] = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
        }
      }
    }

    renderMatchBoard()
    setGameTimeout(() => processMatches(), MATCH_POP_DELAY, matchTimers)
  }, MATCH_POP_DELAY, matchTimers)
}

function checkWin(){
  if(matchScore >= MATCH_WIN_SCORE && !matchWon){
    matchWon = true
    matchBusy = true
    awardLevelWin(3, matchScore)
    setGameTimeout(() => {
      showLevelComplete({
        title: "🏆 Oskar gewinnt!",
        text:  "Du hast Candy Match geschafft! +1 Knochen 🦴",
        button:"🏠 Menü",
        next:  () => showScreen("intro")
      })
    }, DELAYS.LEVEL_COMPLETE, matchTimers)
  }
}

function matchStopGame(){
  matchBusy = false
  matchWon = false
  dragStart = null
  clearGameTimeouts(matchTimers)
  GameManager.clearActive("level3")
}

GameManager.register("level3", { stop: matchStopGame })

// Node-Testhaken (im Browser wirkungslos, da `module` dort nicht existiert).
if(typeof module !== "undefined" && module.exports){
  module.exports = { findMatchesOn, boardHasValidMove, cloneBoard }
}

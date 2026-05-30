/* ══════════════════════════════════════
   LEVEL 4 - MATCH 3
══════════════════════════════════════ */

let matchBoard      = []
let matchNextEmojis = []
let matchScore      = 0
let matchBusy       = false
let dragStart       = null // { row, col, x, y }

function startLevel4(){
  matchScore = 0
  matchBusy  = false
  dragStart  = null

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

  // End-events on document so drag always completes regardless of finger position
  board._touchEnd = e => {
    e.preventDefault()
    if(!dragStart || matchBusy){ dragStart = null; return }
    const t = e.changedTouches[0]
    processSwipe(t.clientX, t.clientY)
  }
  board._mouseUp = e => {
    if(!dragStart || matchBusy){ dragStart = null; return }
    processSwipe(e.clientX, e.clientY)
  }
  board._touchCancel = () => { dragStart = null }

  // Remove any old listeners before adding new ones
  document.removeEventListener("touchend",    board._prevTouchEnd   || (() => {}))
  document.removeEventListener("mouseup",     board._prevMouseUp    || (() => {}))
  document.removeEventListener("touchcancel", board._prevTouchCancel|| (() => {}))

  document.addEventListener("touchend",    board._touchEnd,    { passive: false })
  document.addEventListener("mouseup",     board._mouseUp)
  document.addEventListener("touchcancel", board._touchCancel)

  board._prevTouchEnd    = board._touchEnd
  board._prevMouseUp     = board._mouseUp
  board._prevTouchCancel = board._touchCancel
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
  setTimeout(() => processMatches(), DELAYS.POPUP)
}

/* ── Board logic ───────────────────── */

function swapCells(r1, c1, r2, c2){
  const tmp          = matchBoard[r1][c1]
  matchBoard[r1][c1] = matchBoard[r2][c2]
  matchBoard[r2][c2] = tmp
}

function findMatches(){
  const matched = new Set()

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

  matches.forEach(({ r, c }) => {
    const idx  = (r + 1) * BOARD_COLS + c   // +1 for preview row
    const cell = document.getElementById("matchBoard").children[idx]
    if(cell) cell.classList.add("pop")
  })

  matchScore += matches.length * MATCH_POINT_PER_MATCH
  document.getElementById("matchScore").textContent = `Punkte: ${matchScore}`

  setTimeout(() => {
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
        next:  () => { vibe(VIBRATE.MEDIUM); showScreen("intro") }
      })
    }, DELAYS.LEVEL_COMPLETE)
  }
}

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


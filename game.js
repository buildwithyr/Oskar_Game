/* ══════════════════════════════════════
   PRELOAD ASSETS
══════════════════════════════════════ */

const preloadImages = [
  "assets/OskarCartoon.png",
  "assets/OskarZungelinks.png",
  "assets/OskarZungerechts.png",
  "assets/OskarBadehose.png",
  "assets/Oskar springt.png",
  "assets/OskarLiegestuhl.png",
  "assets/Kothaufen.png"
]

preloadImages.forEach(src => {
  const img = new Image()
  img.src = src
})

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */

function vibe(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern)
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"))
  document.getElementById(id).classList.add("active")
}

/* ══════════════════════════════════════
   LEVEL COMPLETE POPUP
══════════════════════════════════════ */

function showLevelComplete({ title, text, button, next, stars = 3 }){

  // Remove old popup if exists
  const old = document.getElementById("levelCompletePopup")
  if(old) old.remove()

  const popup = document.createElement("div")
  popup.className = "popup"
  popup.id = "levelCompletePopup"

  const starsHtml = Array.from({ length: 3 }, (_, i) =>
    `<span class="star" style="animation-delay:${i * 0.15}s">${i < stars ? "⭐" : "☆"}</span>`
  ).join("")

  popup.innerHTML = `
    <div class="popup-box">
      <h1>${title}</h1>
      <div class="stars-wrap">${starsHtml}</div>
      <p style="margin-bottom:24px;font-size:16px;opacity:0.8">${text}</p>
      <button class="popup-btn" id="popupNextBtn">${button}</button>
    </div>
  `

  document.body.appendChild(popup)

  document.getElementById("popupNextBtn").addEventListener("click", () => {
    vibe(40)
    popup.remove()
    next()
  })

}

/* ══════════════════════════════════════
   INTRO
══════════════════════════════════════ */

document.getElementById("startBtn").addEventListener("click", () => {
  vibe(40)
  startLevel1()
})

/* ══════════════════════════════════════
   LEVEL 1
══════════════════════════════════════ */

let snacks = 0
let tongueLeft = true

function startLevel1(){
  snacks = 0
  updateSnackUI()
  showScreen("level1")
}

function updateSnackUI(){

  document.getElementById("snackCounter").textContent =
    `Snacks: ${snacks} / 5`

  const snackBar = document.getElementById("snackBar")
  snackBar.innerHTML = ""

  for(let i = 0; i < 5; i++){
    const dot = document.createElement("div")
    dot.className = "snack-dot"
    if(i < snacks){
      dot.classList.add("filled")
      dot.innerHTML = "🍖"
    }
    snackBar.appendChild(dot)
  }

}


document.getElementById("clickDog").addEventListener("click", () => {

  if (snacks >= 5) return

  snacks++
  vibe(30)
  updateSnackUI()

  const dog = document.getElementById("clickDog")

  dog.src = "assets/OskarZungerechts.png"

  setTimeout(() => {
    dog.src = "assets/OskarCartoon.png"
  }, 250)

  if (snacks >= 5) {

    setTimeout(() => {

      showLevelComplete({
        title: "🍖 Oskar ist satt!",
        text: "Zeit fuer das Strand Labyrinth 😄",
        button: "🌴 Weiter",
        next: startLevel2
      })

    }, 400)

  }

})



/* ══════════════════════════════════════
   LEVEL 2
══════════════════════════════════════ */


let mazeData = []

const MAZE_SIZE = 15

function generateMaze(){

  mazeData = Array.from({ length: MAZE_SIZE }, () =>
    Array(MAZE_SIZE).fill(1)
  )

  function carve(x, y){

    const dirs = [
      [0, -2],
      [2, 0],
      [0, 2],
      [-2, 0]
    ]

    dirs.sort(() => Math.random() - 0.5)

    for(const [dx, dy] of dirs){

      const nx = x + dx
      const ny = y + dy

      if(
        nx > 0 &&
        nx < MAZE_SIZE - 1 &&
        ny > 0 &&
        ny < MAZE_SIZE - 1 &&
        mazeData[ny][nx] === 1
      ){

        mazeData[ny][nx] = 0
        mazeData[y + dy / 2][x + dx / 2] = 0

        carve(nx, ny)

      }

    }

  }

  mazeData[1][1] = 0

  carve(1, 1)

  let goalX = MAZE_SIZE - 2
  let goalY = MAZE_SIZE - 2

  while(mazeData[goalY][goalX] !== 0){

    goalX--

    if(goalX <= 1){
      goalX = MAZE_SIZE - 2
      goalY--
    }

    if(goalY <= 1){
      break
    }

  }

  mazeData[goalY][goalX] = 3

}


function movePlayer(dx, dy){

  const nx = playerX + dx
  const ny = playerY + dy

  if(!mazeData[ny] || mazeData[ny][nx] === undefined) return
  if(mazeData[ny][nx] === 1) return

  playerX = nx
  playerY = ny
  vibe(20)
  drawMaze()

  if(mazeData[playerY][playerX] === 3){
    setTimeout(() => {
      showLevelComplete({
        title: "🌴 Strand gefunden!",
        text:  "Oskar rennt jetzt am Strand 😄",
        button:"🥏 Weiter",
        next:  startLevel3
      })
    }, 300)
  }

}

// D-Pad touch events
document.querySelectorAll(".dpad-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const dir = btn.dataset.dir
    if(dir === "up")    movePlayer(0, -1)
    if(dir === "down")  movePlayer(0,  1)
    if(dir === "left")  movePlayer(-1, 0)
    if(dir === "right") movePlayer(1,  0)
  })
})

// Keyboard events (Level 2 + Level 3)
document.addEventListener("keydown", e => {

  const l2 = document.getElementById("level2").classList.contains("active")
  const l3 = document.getElementById("level3").classList.contains("active")

  if(l2){
    if(e.key === "ArrowUp")    { e.preventDefault(); movePlayer(0, -1) }
    if(e.key === "ArrowDown")  { e.preventDefault(); movePlayer(0,  1) }
    if(e.key === "ArrowLeft")  { e.preventDefault(); movePlayer(-1, 0) }
    if(e.key === "ArrowRight") { e.preventDefault(); movePlayer(1,  0) }
  }

  if(l3){
    if(e.key === " " || e.key === "ArrowUp"){ e.preventDefault(); l3Jump() }
  }

})

/* ══════════════════════════════════════
   LEVEL 3 — RUNNER
══════════════════════════════════════ */

let l3Running    = false
let l3Frame      = null
let l3Distance   = 0
let l3Speed      = 3.5
let l3ObstacleX  = 0
let l3IsJumping  = false
let l3JumpY      = 0
let l3JumpVel    = 0
let l3WorldX     = 0
let l3HintShown  = true

const L3_GROUND    = 0       // bottom offset from sand
const L3_JUMP_VEL  = -18
const L3_GRAVITY   = 1.0
const L3_WIN_DIST  = 500

function startLevel3(){

  l3Distance  = 0
  l3Speed     = 3.5
  l3ObstacleX = window.innerWidth + 200
  l3IsJumping = false
  l3JumpY     = 0
  l3JumpVel   = 0
  l3WorldX    = 0
  l3HintShown = true
  l3Running   = true

  const runner   = document.getElementById("runner")
  const obstacle = document.getElementById("obstacle")
  const toast    = document.getElementById("eventToast")
  const hint     = document.getElementById("jumpHint")
  const distTxt  = document.getElementById("distanceText")
  const speedBar = document.getElementById("speedBar")

  // Obstacle = Kothaufen
  obstacle.innerHTML = `<img src="assets/Kothaufen.png">`
  obstacle.style.left = l3ObstacleX + "px"

  runner.src = "assets/OskarBadehose.png"
  runner.style.transform = "translateY(0px)"

  toast.style.opacity = "0"
  hint.style.opacity  = "1"
  distTxt.textContent = "Meter: 0"
  speedBar.style.width = "0%"

  showScreen("level3")

  // Tap / click to jump
  const l3screen = document.getElementById("level3")
  l3screen.addEventListener("click", l3JumpHandler)

  if(l3Frame) cancelAnimationFrame(l3Frame)
  l3Loop()

}

function l3JumpHandler(){
  l3Jump()
}

function l3Jump(){
  if(l3IsJumping) return
  l3IsJumping = true
  l3JumpVel   = L3_JUMP_VEL
  vibe(30)

  const runner = document.getElementById("runner")
  runner.src = "assets/Oskar springt.png"

  // Hide hint after first jump
  if(l3HintShown){
    document.getElementById("jumpHint").style.opacity = "0"
    l3HintShown = false
  }
}

function l3Loop(){

  if(!l3Running) return

  const runner   = document.getElementById("runner")
  const obstacle = document.getElementById("obstacle")
  const distTxt  = document.getElementById("distanceText")
  const speedBar = document.getElementById("speedBar")

  // Distance & speed
  l3Distance += l3Speed * 0.05
  l3Speed = Math.min(3.5 + l3Distance * 0.012, 9)

  distTxt.textContent = `Meter: ${Math.floor(l3Distance)}`
  speedBar.style.width = Math.min((l3Speed - 3.5) / 5.5 * 100, 100) + "%"

  // World scroll (clouds, palms)
  l3WorldX -= l3Speed * 0.6
  const worldWidth = document.getElementById("world").offsetWidth
  if(Math.abs(l3WorldX) >= worldWidth / 2){
    l3WorldX = 0
  }
  document.getElementById("world").style.transform = `translateX(${l3WorldX}px)`

  // Jump physics
  if(l3IsJumping){
    l3JumpY   += l3JumpVel
    l3JumpVel += L3_GRAVITY
    if(l3JumpY >= L3_GROUND){
      l3JumpY   = L3_GROUND
      l3JumpVel = 0
      l3IsJumping = false
      runner.src = "assets/OskarBadehose.png"
    }
  }

  runner.style.transform = `translateY(${l3JumpY}px)`

  // Obstacle movement
  l3ObstacleX -= l3Speed
  obstacle.style.left = l3ObstacleX + "px"

  // Reset obstacle when off screen
  if(l3ObstacleX < -80){
    l3ObstacleX = window.innerWidth + Math.random() * 300 + 200
    obstacle.style.left = l3ObstacleX + "px"
  }

  // Collision detection
  const runnerRect  = runner.getBoundingClientRect()
  const obstRect    = obstacle.getBoundingClientRect()
  const hitMargin   = 18

  const hit =
    runnerRect.right  - hitMargin > obstRect.left  + hitMargin &&
    runnerRect.left   + hitMargin < obstRect.right - hitMargin &&
    runnerRect.bottom - hitMargin > obstRect.top   + hitMargin &&
    runnerRect.top    + hitMargin < obstRect.bottom - hitMargin

  if(hit){
    l3Running = false
    cancelAnimationFrame(l3Frame)
    vibe([80, 50, 80])
    l3GameOver()
    return
  }

  // Win condition
  if(l3Distance >= L3_WIN_DIST){
    l3Running = false
    cancelAnimationFrame(l3Frame)
    setTimeout(() => {
      showLevelComplete({
        title: "🥏 Frisbee gefangen!",
        text:  "Oskar ist der beste Strandhund! 🐶",
        button:"🍭 Weiter",
        next:  startLevel4
      })
    }, 400)
    return
  }

  l3Frame = requestAnimationFrame(l3Loop)

}

function l3GameOver(){

  const overlay = document.createElement("div")
  overlay.className = "l3-gameover"
  overlay.innerHTML = `
    <div class="popup-box">
      <h1>💩 Erwischt!</h1>
      <div style="font-size:60px;margin:10px 0">😅</div>
      <p style="margin-bottom:20px;font-size:16px;opacity:0.8">Oskar ist in den Kothaufen gerannt!<br>${Math.floor(l3Distance)} Meter geschafft.</p>
      <button class="popup-btn" id="l3RetryBtn">🔄 Nochmal</button>
    </div>
  `
  document.body.appendChild(overlay)

  document.getElementById("l3RetryBtn").addEventListener("click", () => {
    vibe(40)
    overlay.remove()
    // Remove old click listener before restarting
    const l3screen = document.getElementById("level3")
    l3screen.removeEventListener("click", l3JumpHandler)
    startLevel3()
  })

}

/* ══════════════════════════════════════
   LEVEL 4 — MATCH 3
══════════════════════════════════════ */

const EMOJIS     = ["🐶","🦴","🌴","🥏","🍖","☀️","🌊"]
const BOARD_COLS = 7
const BOARD_ROWS = 7

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

  setTimeout(() => processMatches(), 200)

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

  vibe([30, 20, 30])

  // Pop animation
  matches.forEach(({ r, c }) => {
    const idx  = r * BOARD_COLS + c
    const cell = document.getElementById("matchBoard").children[idx]
    if(cell) cell.classList.add("pop")
  })

  matchScore += matches.length * 10
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
    setTimeout(() => processMatches(), 300)

  }, 280)

}

function checkWin(){

  if(matchScore >= 300){
    setTimeout(() => {
      showLevelComplete({
        title: "🏆 Oskar gewinnt!",
        text:  "Du hast alle Levels geschafft! Guter Hund! 🐶🎉",
        button:"🔄 Nochmal spielen",
        next:  () => {
          vibe(40)
          showScreen("intro")
        }
      })
    }, 400)
  }

}

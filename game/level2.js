/* ══════════════════════════════════════
   LEVEL 2 - MAZE
══════════════════════════════════════ */

let mazeData = []
let playerX = 1
let playerY = 1
let prevPlayerX = 1
let prevPlayerY = 1

let bonePositions  = new Set()
let bonesTotal     = 0
let bonesCollected = 0
let l2StartTime    = 0

function generateMaze(){
  mazeData = Array.from({ length: MAZE_SIZE }, () =>
    Array(MAZE_SIZE).fill(1)
  )
  function carve(x, y){
    const dirs = [[0,-2],[2,0],[0,2],[-2,0]]
    dirs.sort(() => Math.random() - 0.5)
    for(const [dx, dy] of dirs){
      const nx = x + dx
      const ny = y + dy
      if(nx > 0 && nx < MAZE_SIZE - 1 && ny > 0 && ny < MAZE_SIZE - 1 && mazeData[ny][nx] === 1){
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
    if(goalX <= 1){ goalX = MAZE_SIZE - 2; goalY-- }
    if(goalY <= 1) break
  }
  mazeData[goalY][goalX] = 3

  bonePositions = new Set()
  const floorCells = []
  for(let y = 0; y < MAZE_SIZE; y++){
    for(let x = 0; x < MAZE_SIZE; x++){
      if(mazeData[y][x] === 0 && !(x === 1 && y === 1)) floorCells.push({ x, y })
    }
  }
  floorCells.sort(() => Math.random() - 0.5)
  for(const cell of floorCells.slice(0, 4)){
    bonePositions.add(`${cell.x},${cell.y}`)
  }
  bonesTotal     = bonePositions.size
  bonesCollected = 0
}

function startLevel2(){
  generateMaze()
  playerX = 1
  playerY = 1
  prevPlayerX = 1
  prevPlayerY = 1
  l2StartTime = Date.now()
  incrementGameCount('level2')
  showScreen("level2")
  buildMaze()
  updateBoneCounter()
}

function updateBoneCounter(){
  const el = document.getElementById("boneCounter")
  if(el) el.textContent = `🦴 ${bonesCollected} / ${bonesTotal}`
}

function buildMaze(){
  const grid = document.getElementById("maze")
  grid.innerHTML = ""
  for(let y = 0; y < MAZE_SIZE; y++){
    for(let x = 0; x < MAZE_SIZE; x++){
      const cell = document.createElement("div")
      const val  = mazeData[y][x]
      if(x === playerX && y === playerY){
        cell.className = "cell floor player"
        cell.innerHTML = `<img src="${ASSETS.OSKAR_DEFAULT}" class="maze-oskar">`
      } else if(val === 3){
        cell.className = "cell floor"
        const locked = bonesCollected < bonesTotal
        cell.innerHTML = locked
          ? `<span class="maze-goal-lock">🔒</span>`
          : `<img src="${ASSETS.OSKAR_CHAIR}" class="maze-goal">`
      } else if(val === 1){
        cell.className = "cell wall"
      } else if(bonePositions.has(`${x},${y}`)){
        cell.className = "cell floor"
        cell.innerHTML = `<span class="maze-bone">🦴</span>`
      } else {
        cell.className = "cell floor"
      }
      grid.appendChild(cell)
    }
  }
}

function updateMazeCell(x, y){
  const grid = document.getElementById("maze")
  const idx  = y * MAZE_SIZE + x
  const cell = grid.children[idx]
  if(!cell) return
  const val = mazeData[y][x]
  if(x === playerX && y === playerY){
    cell.className = "cell floor player"
    cell.innerHTML = `<img src="${ASSETS.OSKAR_DEFAULT}" class="maze-oskar">`
  } else if(val === 3){
    cell.className = "cell floor"
    const locked = bonesCollected < bonesTotal
    cell.innerHTML = locked
      ? `<span class="maze-goal-lock">🔒</span>`
      : `<img src="${ASSETS.OSKAR_CHAIR}" class="maze-goal">`
  } else if(val === 1){
    cell.className = "cell wall"
  } else if(bonePositions.has(`${x},${y}`)){
    cell.className = "cell floor"
    cell.innerHTML = `<span class="maze-bone">🦴</span>`
  } else {
    cell.className = "cell floor"
    cell.innerHTML = ""
  }
}

function drawMaze(){
  updateMazeCell(prevPlayerX, prevPlayerY)
  updateMazeCell(playerX, playerY)
  prevPlayerX = playerX
  prevPlayerY = playerY
}

function movePlayer(dx, dy){
  const nx = playerX + dx
  const ny = playerY + dy
  if(!mazeData[ny] || mazeData[ny][nx] === undefined) return
  if(mazeData[ny][nx] === 1) return
  playerX = nx
  playerY = ny
  vibe(VIBRATE.SMALL)

  const key = `${playerX},${playerY}`
  if(bonePositions.has(key)){
    bonePositions.delete(key)
    bonesCollected++
    vibe(VIBRATE.MEDIUM)
    updateBoneCounter()
    if(bonesCollected >= bonesTotal){
      showToast("🦴 Super! Alle Leckerlis gefunden! Jetzt zum Ziel! 🎯")
      for(let y = 0; y < MAZE_SIZE; y++){
        for(let x = 0; x < MAZE_SIZE; x++){
          if(mazeData[y][x] === 3) updateMazeCell(x, y)
        }
      }
    }
  }

  drawMaze()

  if(mazeData[playerY][playerX] === 3 && bonesCollected >= bonesTotal){
    const elapsed = Date.now() - l2StartTime
    setTimeout(() => {
      onLevel2Win(elapsed)
      showLevelComplete({
        title: "🌴 Strand gefunden!",
        text:  "Oskar rennt jetzt am Strand 😄",
        button:"🥏 Weiter",
        next:  startLevel3
      })
    }, DELAYS.POPUP)
  }
}

function handleDpadClick(e){
  const dir = e.target.dataset.dir
  if(dir === "up")    movePlayer(0, -1)
  if(dir === "down")  movePlayer(0,  1)
  if(dir === "left")  movePlayer(-1, 0)
  if(dir === "right") movePlayer(1,  0)
}

function handleKeyDown(e){
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
}

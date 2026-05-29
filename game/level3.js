/* ══════════════════════════════════════
   LEVEL 3 - RUNNER
══════════════════════════════════════ */

let l3Running    = false
let l3Frame      = null
let l3Distance   = 0
let l3Speed      = L3_SPEED_START
let l3ObstacleX  = 0
let l3IsJumping  = false
let l3JumpY      = 0
let l3JumpVel    = 0
let l3WorldX     = 0
let l3HintShown  = true

// Cached DOM refs (set once in startLevel3)
let l3Els = null

function startLevel3(){

  l3Distance  = 0
  l3Speed     = L3_SPEED_START
  l3ObstacleX = window.innerWidth + 200
  l3IsJumping = false
  l3JumpY     = 0
  l3JumpVel   = 0
  l3WorldX    = 0
  l3HintShown = true
  l3Running   = true

  l3Els = {
    runner:   document.getElementById("runner"),
    obstacle: document.getElementById("obstacle"),
    toast:    document.getElementById("eventToast"),
    hint:     document.getElementById("jumpHint"),
    distTxt:  document.getElementById("distanceText"),
    speedBar: document.getElementById("speedBar"),
    world:    document.getElementById("world")
  }

  // Obstacle = Kothaufen
  l3Els.obstacle.innerHTML = `<img src="${ASSETS.POOP}">`
  l3Els.obstacle.style.left = l3ObstacleX + "px"

  l3Els.runner.src = ASSETS.OSKAR_SWIMSUIT
  l3Els.runner.style.transform = "translateY(0px)"

  l3Els.toast.style.opacity = "0"
  l3Els.hint.style.opacity  = "1"
  l3Els.distTxt.textContent = "Meter: 0"
  l3Els.speedBar.style.width = "0%"

  showScreen("level3")

  if(l3Frame) cancelAnimationFrame(l3Frame)
  l3Loop()

}

function l3Jump(){
  if(l3IsJumping) return
  l3IsJumping = true
  l3JumpVel   = L3_JUMP_VEL
  vibe(VIBRATE.SMALL)

  l3Els.runner.src = ASSETS.OSKAR_JUMP

  if(l3HintShown){
    l3Els.hint.style.opacity = "0"
    l3HintShown = false
  }
}

function l3Loop(){

  if(!l3Running) return

  const { runner, obstacle, distTxt, speedBar, world } = l3Els

  // Distance & speed
  l3Distance += l3Speed * L3_SPEED_FRAME_RATE
  l3Speed = Math.min(L3_SPEED_START + l3Distance * L3_SPEED_INCREASE, L3_SPEED_MAX)

  distTxt.textContent = `Meter: ${Math.floor(l3Distance)}`
  speedBar.style.width = Math.min((l3Speed - L3_SPEED_START) / (L3_SPEED_MAX - L3_SPEED_START) * 100, 100) + "%"

  // World scroll (clouds, palms)
  l3WorldX -= l3Speed * 0.6
  if(Math.abs(l3WorldX) >= world.offsetWidth / 2){
    l3WorldX = 0
  }
  world.style.transform = `translateX(${l3WorldX}px)`

  // Jump physics
  if(l3IsJumping){
    l3JumpY   += l3JumpVel
    l3JumpVel += L3_GRAVITY
    if(l3JumpY >= L3_GROUND){
      l3JumpY   = L3_GROUND
      l3JumpVel = 0
      l3IsJumping = false
      runner.src = ASSETS.OSKAR_SWIMSUIT
    }
  }

  runner.style.transform = `translateY(${l3JumpY}px)`

  // Obstacle movement
  l3ObstacleX -= l3Speed
  obstacle.style.left = l3ObstacleX + "px"

  if(l3ObstacleX < -80){
    l3ObstacleX = window.innerWidth + Math.random() * 200 + L3_OBSTACLE_SPACING
    obstacle.style.left = l3ObstacleX + "px"
  }

  // Collision detection
  const runnerRect  = runner.getBoundingClientRect()
  const obstRect    = obstacle.getBoundingClientRect()

  const hit =
    runnerRect.right  - L3_COLLISION_MARGIN > obstRect.left  + L3_COLLISION_MARGIN &&
    runnerRect.left   + L3_COLLISION_MARGIN < obstRect.right - L3_COLLISION_MARGIN &&
    runnerRect.bottom - L3_COLLISION_MARGIN > obstRect.top   + L3_COLLISION_MARGIN &&
    runnerRect.top    + L3_COLLISION_MARGIN < obstRect.bottom - L3_COLLISION_MARGIN

  if(hit){
    l3Running = false
    cancelAnimationFrame(l3Frame)
    vibe(VIBRATE.LARGE)
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
    }, DELAYS.LEVEL_COMPLETE)
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
    vibe(VIBRATE.MEDIUM)
    overlay.remove()
    startLevel3()
  })

}


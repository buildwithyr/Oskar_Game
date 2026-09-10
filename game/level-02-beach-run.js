/* ══════════════════════════════════════
   LEVEL 2 - BEACH RUN
   Zeitbasierte Bewegung (deltaTime), damit
   60Hz- und 120Hz-Geräte gleich schnell wirken.
   Vorbild: Level 8 (level_run3d.js).
══════════════════════════════════════ */

let l2Running    = false
let l2Frame      = null
let l2Distance   = 0
let l2Speed      = L2_SPEED_START
let l2ObstacleX  = 0
let l2IsJumping  = false
let l2JumpY      = 0
let l2JumpVel    = 0
let l2WorldX     = 0
let l2HintShown  = true
let l2Timers     = new Set()
let l2Overlay    = null
let l2LastNow    = 0

// Cached DOM refs (set once in startLevel2)
let l2Els = null

function startLevel2(){

  l2StopGame()
  GameManager.setActive("level2")

  l2Distance  = 0
  l2Speed     = L2_SPEED_START
  l2ObstacleX = window.innerWidth + 200
  l2IsJumping = false
  l2JumpY     = 0
  l2JumpVel   = 0
  l2WorldX    = 0
  l2HintShown = true
  l2Running   = true
  l2LastNow   = 0

  l2Els = {
    runner:   document.getElementById("runner"),
    obstacle: document.getElementById("obstacle"),
    toast:    document.getElementById("eventToast"),
    hint:     document.getElementById("jumpHint"),
    distTxt:  document.getElementById("distanceText"),
    speedBar: document.getElementById("speedBar"),
    world:    document.getElementById("world")
  }

  // Obstacle = Kothaufen
  l2Els.obstacle.innerHTML = `<img src="${ASSETS.POOP}">`
  l2Els.obstacle.style.left = l2ObstacleX + "px"

  l2Els.runner.src = ASSETS.OSKAR_SWIMSUIT
  l2Els.runner.style.transform = "translateY(0px)"

  l2Els.toast.style.opacity = "0"
  l2Els.hint.style.opacity  = "1"
  l2Els.distTxt.textContent = "Meter: 0"
  l2Els.speedBar.style.width = "0%"

  showScreen("level2")

  if(l2Frame) cancelAnimationFrame(l2Frame)
  l2Frame = requestAnimationFrame(l2Loop)

}

function l2Jump(){
  if(!l2Running || !l2Els || l2IsJumping) return
  l2IsJumping = true
  l2JumpVel   = L2_JUMP_VEL
  vibe(VIBRATE.SMALL)

  l2Els.runner.src = ASSETS.OSKAR_JUMP

  if(l2HintShown){
    l2Els.hint.style.opacity = "0"
    l2HintShown = false
  }
}

// dt = vergangene Zeit in "60Hz-Frame-Äquivalenten" (1.0 = ein Frame bei 60fps).
// Alle Bewegungs-Konstanten waren ursprünglich pro Frame bei ~60fps kalibriert;
// die Multiplikation mit dt macht sie bildratenunabhängig, ohne das Spielgefühl
// zu verändern. Nach einem Tab-/App-Wechsel wird dt gekappt, damit Oskar beim
// Zurückkehren nicht durch mehrere Sekunden Bewegung "teleportiert".
function l2Loop(now){

  if(!l2Running) return

  if(!l2LastNow) l2LastNow = now
  let dt = (now - l2LastNow) / (1000 / 60)
  l2LastNow = now
  dt = Math.min(Math.max(dt, 0), 3)

  const { runner, obstacle, distTxt, speedBar, world } = l2Els

  l2Distance += l2Speed * L2_SPEED_FRAME_RATE * dt
  l2Speed = Math.min(L2_SPEED_START + l2Distance * L2_SPEED_INCREASE, L2_SPEED_MAX)

  distTxt.textContent = `Meter: ${Math.floor(l2Distance)}`
  speedBar.style.width = Math.min((l2Speed - L2_SPEED_START) / (L2_SPEED_MAX - L2_SPEED_START) * 100, 100) + "%"

  l2WorldX -= l2Speed * 0.6 * dt
  if(Math.abs(l2WorldX) >= world.offsetWidth / 2){
    l2WorldX = 0
  }
  world.style.transform = `translateX(${l2WorldX}px)`

  if(l2IsJumping){
    l2JumpY   += l2JumpVel * dt
    l2JumpVel += L2_GRAVITY * dt
    if(l2JumpY >= L2_GROUND){
      l2JumpY   = L2_GROUND
      l2JumpVel = 0
      l2IsJumping = false
      runner.src = ASSETS.OSKAR_SWIMSUIT
    }
  }

  runner.style.transform = `translateY(${l2JumpY}px)`

  l2ObstacleX -= l2Speed * dt
  obstacle.style.left = l2ObstacleX + "px"

  if(l2ObstacleX < -80){
    l2ObstacleX = window.innerWidth + Math.random() * 200 + L2_OBSTACLE_SPACING
    obstacle.style.left = l2ObstacleX + "px"
  }

  const runnerRect  = runner.getBoundingClientRect()
  const obstRect    = obstacle.getBoundingClientRect()

  const hit =
    runnerRect.right  - L2_COLLISION_MARGIN > obstRect.left  + L2_COLLISION_MARGIN &&
    runnerRect.left   + L2_COLLISION_MARGIN < obstRect.right - L2_COLLISION_MARGIN &&
    runnerRect.bottom - L2_COLLISION_MARGIN > obstRect.top   + L2_COLLISION_MARGIN &&
    runnerRect.top    + L2_COLLISION_MARGIN < obstRect.bottom - L2_COLLISION_MARGIN

  if(hit){
    l2Running = false
    cancelAnimationFrame(l2Frame)
    vibe(VIBRATE.LARGE)
    l2GameOver()
    return
  }

  if(l2Distance >= L2_WIN_DIST){
    l2Running = false
    cancelAnimationFrame(l2Frame)
    awardLevelWin(2, Math.floor(l2Distance))
    setGameTimeout(() => {
      showLevelComplete({
        title: "🥏 Frisbee gefangen!",
        text:  "Oskar ist der beste Strandhund! +1 Knochen 🦴",
        button:"🏠 Menü",
        next:  () => showScreen("intro")
      })
    }, DELAYS.LEVEL_COMPLETE, l2Timers)
    return
  }

  l2Frame = requestAnimationFrame(l2Loop)

}

function l2GameOver(){

  updateHighscore(2, Math.floor(l2Distance))

  if(l2Overlay) l2Overlay.remove()

  const overlay = document.createElement("div")
  l2Overlay = overlay
  overlay.className = "l3-gameover"
  overlay.innerHTML = `
    <div class="popup-box">
      <h1>💩 Erwischt!</h1>
      <div style="font-size:60px;margin:10px 0">😅</div>
      <p style="margin-bottom:20px;font-size:16px;opacity:0.8">Oskar ist in den Kothaufen gerannt!<br>${Math.floor(l2Distance)} Meter geschafft.</p>
      <button class="popup-btn" id="l2RetryBtn">🔄 Nochmal</button>
    </div>
  `
  document.body.appendChild(overlay)

  document.getElementById("l2RetryBtn").addEventListener("click", () => {
    vibe(VIBRATE.MEDIUM)
    overlay.remove()
    l2Overlay = null
    startLevel2()
  })

}


function l2StopGame(){
  l2Running = false
  if(l2Frame){
    cancelAnimationFrame(l2Frame)
    l2Frame = null
  }
  l2LastNow = 0
  clearGameTimeouts(l2Timers)
  if(l2Overlay){
    l2Overlay.remove()
    l2Overlay = null
  }
  GameManager.clearActive("level2")
}

// App im Hintergrund: RAF anhalten, Fortschritt (Distanz/Tempo) bleibt.
function l2Pause(){
  if(l2Frame){ cancelAnimationFrame(l2Frame); l2Frame = null }
}

function l2Resume(){
  if(!l2Running) return
  l2LastNow = 0
  l2Frame = requestAnimationFrame(l2Loop)
}

GameManager.register("level2", { stop: l2StopGame, pause: l2Pause, resume: l2Resume })

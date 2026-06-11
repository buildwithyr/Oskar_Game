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
  ASSETS.POOP,
  ASSETS.KREBS,
  ASSETS.OSKAR_DANCE,
  ASSETS.OSKAR_DANCE_FLIP
]

preloadImages.forEach(src => {
  const img = new Image()
  img.src = src
})





/* ══════════════════════════════════════
   EVENT LISTENERS (zentral)
══════════════════════════════════════ */


// LEVEL SELECT
document.getElementById("levelBtn1").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel1()
})

document.getElementById("levelBtn2").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startBubbleLevel()
})

document.getElementById("levelBtn3").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel3()
})

document.getElementById("levelBtn4").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel4()
})

document.getElementById("levelBtn5").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel5()
})

document.getElementById("levelBtn6").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel6()
})

document.getElementById("levelBtn7").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel7()
})

document.getElementById("levelBtn8").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startFroggerLevel()
})

document.getElementById("levelBtn9").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startDanceLevel()
})

document.getElementById("levelBtn10").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startDigLevel()
})

document.getElementById("levelBtn11").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startRun3dLevel()
})


// LEVEL 1 - Catch game input
l1SetupInput()

// LEVEL 3 - Jump (tap on level3 screen)
// touchstart springt sofort (kein Warten auf click) – Home-Button bleibt ausgenommen
document.getElementById("level3").addEventListener("touchstart", (e) => {
  if(e.target.closest(".back-btn")) return
  if(document.getElementById("level3").classList.contains("active")){
    e.preventDefault()
    l3Jump()
  }
}, { passive: false })

document.getElementById("level3").addEventListener("click", () => {
  if(document.getElementById("level3").classList.contains("active")){
    l3Jump()
  }
})

// LEVEL 8 - Frogger D-Pad
document.querySelectorAll("#frogDpad .frog-dpad-btn").forEach(btn => {
  btn.addEventListener("click", () => frogMove(btn.dataset.fdir))
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault()
    frogMove(btn.dataset.fdir)
  }, { passive: false })
})

// LEVEL 8 - Wischen/Tippen direkt auf dem Spielfeld
frogBindFieldInput()

// LEVEL 11 - Tippen/Wischen zum Ausweichen
r3BindInput()

// LEVEL 9 - Tanz-Pads
document.querySelectorAll("#dcPads .dc-pad").forEach(btn => {
  btn.addEventListener("click", () => dcPadPress(Number(btn.dataset.pad)))
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault()
    dcPadPress(Number(btn.dataset.pad))
  }, { passive: false })
})

// Global keyboard: Level 3 space/up + Level 8 arrows
document.addEventListener("keydown", (e) => {
  const active = document.querySelector(".screen.active")?.id

  if (active === "level3") {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault()
      l3Jump()
    }
  }

  if (active === "level8") {
    const map = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right",
                  KeyW:"up",    KeyS:"down",       KeyA:"left",      KeyD:"right" }
    if (map[e.code]) {
      e.preventDefault()
      frogMove(map[e.code])
    }
  }

  if (active === "level9") {
    const padMap = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
                     Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }
    if (padMap[e.code] !== undefined) {
      e.preventDefault()
      dcPadPress(padMap[e.code])
    }
  }

  if (active === "level11") {
    if (e.code === "ArrowLeft"  || e.code === "KeyA") { e.preventDefault(); r3Steer(-1) }
    if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); r3Steer(1) }
  }
})

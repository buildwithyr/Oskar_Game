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
  ASSETS.KREBS
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


// LEVEL 1 - Catch game input
l1SetupInput()

// LEVEL 3 - Jump (tap on level3 screen)
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
})

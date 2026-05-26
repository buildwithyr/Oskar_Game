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

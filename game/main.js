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


// LEVEL SELECT
document.getElementById("levelBtn1").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel1()
})

document.getElementById("levelBtn2").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startLevel2()
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

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
   INIT — Load save data on startup
══════════════════════════════════════ */

loadPlayerData()

if (!playerData.name) {
  // First run: ask for name
  document.getElementById('intro').classList.remove('active')
  showNameScreen()
} else {
  updateMenuDisplay()
  checkAchievements()
}


/* ══════════════════════════════════════
   EVENT LISTENERS (zentral)
══════════════════════════════════════ */

// Name submit
document.getElementById('nameSubmitBtn').addEventListener('click', () => {
  vibe(VIBRATE.SMALL)
  submitPlayerName()
})
document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitPlayerName() }
})

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

// NAV: Stats & Achievements
document.getElementById('statsBtn').addEventListener('click', () => {
  vibe(VIBRATE.SMALL)
  renderStatsScreen()
  showScreen('screen-stats')
})

document.getElementById('achievementsBtn').addEventListener('click', () => {
  vibe(VIBRATE.SMALL)
  renderAchievementsScreen()
  showScreen('screen-achievements')
})


// LEVEL 1 - Catch game input
l1SetupInput()

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

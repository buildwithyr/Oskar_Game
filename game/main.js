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
  startCrabLevel()
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


/* ══════════════════════════════════════
   INTRO UI — XP display & progress bars
══════════════════════════════════════ */

function updateIntroUI() {
  const data  = loadPlayerData()
  const stats = data.statistics

  // XP: every level completion = 15 XP
  const xp = (
    (stats.level1Completed || 0) +
    (stats.crabLevelWins   || 0) +
    (stats.level3Completed || 0) +
    (stats.level4Completed || 0) +
    (stats.level5Completed || 0) +
    (stats.level6Completed || 0) +
    (stats.level7Completed || 0)
  ) * 15

  const xpEl = document.getElementById('introXpPill')
  if (xpEl) xpEl.textContent = `⭐ ${xp} XP`

  // Progress bars: 5 completions = 100%, each = 20%
  const bars = [
    ['progress1', stats.level1Completed],
    ['progress2', stats.crabLevelWins],
    ['progress3', stats.level3Completed],
    ['progress4', stats.level4Completed],
    ['progress5', stats.level5Completed],
    ['progress6', stats.level6Completed],
    ['progress7', stats.level7Completed],
  ]

  bars.forEach(([id, count]) => {
    const el = document.getElementById(id)
    if (!el) return
    // Delay lets the CSS transition fire after initial render
    setTimeout(() => {
      el.style.width = Math.min(100, (count || 0) * 20) + '%'
    }, 350)
  })
}

updateIntroUI()

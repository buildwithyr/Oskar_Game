/* ══════════════════════════════════════
   CONSTANTS & CONFIG
══════════════════════════════════════ */

// 🔧 DEBUG: Starte direkt bei Level 3 zum Testen!
// Ersetze "startLevel3" mit "startLevel1" um normal zu spielen
const DEBUG_START_LEVEL = "startLevel1"

// Asset paths
const ASSETS = {
  OSKAR_DEFAULT: "assets/OskarCartoon.png",
  OSKAR_TONGUE_LEFT: "assets/OskarZungelinks.png",
  OSKAR_TONGUE_RIGHT: "assets/OskarZungerechts.png",
  OSKAR_SWIMSUIT: "assets/OskarBadehose.png",
  OSKAR_JUMP: "assets/Oskar_springt.png",
  OSKAR_CHAIR: "assets/OskarLiegestuhl.png",
  POOP: "assets/Kothaufen.png"
}

// Level 1 - Snacks
const LEVEL1_SNACK_GOAL = 5
const LEVEL1_SNACK_CLICK_DELAY = 250

// Level 2 - Maze
const MAZE_SIZE = 15

// Level 3 - Runner (ANGEPASST - Mobile freundlicher)
const L3_GROUND = 0
const L3_JUMP_VEL = -18
const L3_GRAVITY = 1.0
const L3_WIN_DIST = 150              // ← War 200, jetzt kürzer
const L3_SPEED_START = 3.5
const L3_SPEED_MAX = 7.5             // ← War 9, jetzt sanfter
const L3_SPEED_INCREASE = 0.008      // ← War 0.012, jetzt langsamere Steigerung
const L3_SPEED_FRAME_RATE = 0.05
const L3_COLLISION_MARGIN = 18
const L3_OBSTACLE_SPACING = 400      // ← Mehr Abstand zwischen Hindernissen

// Level 4 - Match3
const EMOJIS = ["🐶","🦴","🌴","🥏","🍖","☀️","🌊"]
const BOARD_COLS = 7
const BOARD_ROWS = 7
const MATCH_WIN_SCORE = 300
const MATCH_POP_DELAY = 280
const MATCH_POINT_PER_MATCH = 10

// Vibration patterns
const VIBRATE = {
  SMALL: 30,
  MEDIUM: 40,
  LARGE: [80, 50, 80]
}

// Timing delays
const DELAYS = {
  LEVEL_COMPLETE: 400,
  POPUP: 200,
  LEVEL3_RETRY: 300
}

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

// 🎮 Auto-Start entfernt - Spiel startet über den Button

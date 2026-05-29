/* ══════════════════════════════════════
   CONSTANTS & CONFIG
══════════════════════════════════════ */

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


// 🎮 Auto-Start entfernt - Spiel startet über den Button

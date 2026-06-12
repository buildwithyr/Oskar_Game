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
  POOP: "assets/Kothaufen.png",
  KREBS: "assets/krebs.png",
  OSKAR_DANCE: "assets/Oskartanzend - Kopie.png",
  OSKAR_DANCE_FLIP: "assets/Oskartanzendgespiegelt.png"
}

// Level 1 - Snacks
const LEVEL1_SNACK_GOAL = 5
const LEVEL1_SNACK_CLICK_DELAY = 250

// Level 2 - Beach Run

const L3_GROUND = 0
const L3_JUMP_VEL = -18
const L3_GRAVITY = 1.0
const L3_WIN_DIST = 150
const L3_SPEED_START = 3.5
const L3_SPEED_MAX = 7.5
const L3_SPEED_INCREASE = 0.008
const L3_SPEED_FRAME_RATE = 0.05
const L3_COLLISION_MARGIN = 18
const L3_OBSTACLE_SPACING = 400

// Level 3 - Match3
const EMOJIS = ["🐶","🦴","🌴","🥏","🍖","☀️","🌊"]
const BOARD_COLS = 7
const BOARD_ROWS = 7
const MATCH_WIN_SCORE = 300
const MATCH_POP_DELAY = 280
const MATCH_POINT_PER_MATCH = 10

// Level 4 - Memory  (constants live in level5.js)
// Level 5 - Strandpromenade (constants live in level_frogger.js)
// Level 6 - Tanzparty (constants live in level_dance.js)
// Level 7 - Buddel-Spaß (constants live in level_dig.js)
// Level 8 - Leckerli-Lauf 3D (constants live in level_run3d.js)

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

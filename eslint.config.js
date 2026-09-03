import js from '@eslint/js';
import globals from 'globals';

// game/*.js sind Plain-Scripts ohne Modulsystem (per <script> in index.html
// geladen) - jede Datei greift auf Konstanten/Funktionen aus anderen
// Dateien als globale Bezeichner zu. ESLint lintet jede Datei isoliert und
// kennt diese Cross-Datei-Globals sonst nicht (no-undef-Fehlalarme).
const gameGlobals = [
  'ASSETS', 'BOARD_COLS', 'BOARD_ROWS', 'CURRENT_SAVE_VERSION', 'DC_GAP_MS',
  'DC_LIT_MS', 'DC_LIVES', 'DC_PRE_MS', 'DC_ROUNDS', 'DEFAULT_PLAYER_DATA',
  'DELAYS', 'DG_BONES', 'DG_COLS', 'DG_CRABS', 'DG_FILLERS',
  'DG_ROWS', 'DG_STARS_2', 'DG_STARS_3', 'EMOJIS', 'FROG_COL_STEP',
  'FROG_GOAL_COUNT', 'FROG_LIVES', 'FROG_OSKAR_H', 'FROG_OSKAR_W', 'FROG_ROWS',
  'FROG_ROW_Y', 'FROG_TIMER_MAX', 'FROG_W', 'L1_CATCH_MARGIN', 'L1_FALL_SPEED',
  'L1_GOAL', 'L1_OSKAR_WIDTH', 'L1_SPAWN_INTERVAL', 'L1_TREAT_SIZE', 'L3_COLLISION_MARGIN',
  'L3_GRAVITY', 'L3_GROUND', 'L3_JUMP_VEL', 'L3_OBSTACLE_SPACING', 'L3_SPEED_FRAME_RATE',
  'L3_SPEED_INCREASE', 'L3_SPEED_MAX', 'L3_SPEED_START', 'L3_WIN_DIST', 'L4_EMOJIS',
  'LEVEL1_SNACK_CLICK_DELAY', 'LEVEL1_SNACK_GOAL', 'MATCH_POINT_PER_MATCH', 'MATCH_POP_DELAY', 'MATCH_WIN_SCORE',
  'R3_DECO', 'R3_GOAL', 'R3_HIT_P', 'R3_INVULN_MS', 'R3_LIVES',
  'R3_SPAWN_MIN', 'R3_SPAWN_START', 'R3_TRAVEL_MIN', 'R3_TRAVEL_START', 'R3_TYPES',
  'SAVE_KEY', 'VIBRATE', 'awardLevelWin', 'checkWin', 'clearGameTimeouts',
  'dcAccepting', 'dcBeginGame', 'dcCelebrate', 'dcDanceFlip', 'dcDanceStep',
  'dcFlashPad', 'dcGameOver', 'dcInputIdx', 'dcLives', 'dcPadPress',
  'dcPlaySequence', 'dcRound', 'dcRoundComplete', 'dcRunning', 'dcSeq',
  'dcSetOskarIdle', 'dcSetStatus', 'dcShakeStage', 'dcStartRound', 'dcStopGame',
  'dcTimers', 'dcUpdateHUD', 'dcWin', 'dgBeginGame', 'dgBonesFound',
  'dgBuildGrid', 'dgCells', 'dgDigCell', 'dgDigs', 'dgHasBoneNeighbor',
  'dgOskarTimer', 'dgRefreshHints', 'dgRevealBone', 'dgRevealCrab', 'dgRevealFiller',
  'dgRunning', 'dgSandBurst', 'dgSay', 'dgSetOskar', 'dgStopGame',
  'dgTimers', 'dgUpdateHUD', 'dgWiggleOskar', 'dgWin', 'dragStart',
  'findMatches', 'frogAabb', 'frogArriveGoal', 'frogBindFieldInput', 'frogBuildField',
  'frogCheckCollisions', 'frogCheckShellPickup', 'frogDead', 'frogDie', 'frogFieldW',
  'frogGameOver', 'frogGoalsFilled', 'frogGoalsX', 'frogLives', 'frogLoop',
  'frogMakeObstacles', 'frogMove', 'frogObstacles', 'frogOnLog', 'frogRafId',
  'frogRenderOskar', 'frogResetTimer', 'frogRespawn', 'frogRow', 'frogRunning',
  'frogShells', 'frogShowSplash', 'frogSpawnShells', 'frogStartGame', 'frogStartTimer',
  'frogStop', 'frogTimer', 'frogTimerTick', 'frogTimers', 'frogUpdateHUD',
  'frogWin', 'frogX', 'incrementStat', 'initMatchBoard', 'initMemory',
  'l1Caught', 'l1FieldH', 'l1FieldW', 'l1Loop', 'l1OnCatch',
  'l1OskarX', 'l1PositionOskar', 'l1RafId', 'l1Running', 'l1SetupInput',
  'l1SpawnTimer', 'l1SpawnTreat', 'l1StopGame', 'l1Timers', 'l1TongueTimer',
  'l1Treats', 'l3Distance', 'l3Els', 'l3Frame', 'l3GameOver',
  'l3HintShown', 'l3IsJumping', 'l3Jump', 'l3JumpVel', 'l3JumpY',
  'l3Loop', 'l3ObstacleX', 'l3Overlay', 'l3Running', 'l3SetupInput',
  'l3Speed', 'l3StopGame', 'l3Timers', 'l3WorldX', 'l4StopGame',
  'loadPlayerData', 'matchBoard', 'matchBusy', 'matchNextEmojis', 'matchScore',
  'matchTimers', 'matchWon', 'memBusy', 'memCards', 'memFlipped',
  'memPairs', 'memTimers', 'memWin', 'migrateSaveData', 'onMemCardClick',
  'preloadImages', 'processMatches', 'processSwipe', 'r3ApplyLaneFromX', 'r3Begin',
  'r3BindInput', 'r3BuildDeco', 'r3Collect', 'r3Collected', 'r3DecoEls',
  'r3DragId', 'r3DragTo', 'r3FloatText', 'r3GameOver', 'r3HideHint',
  'r3HintShown', 'r3Hit', 'r3HorizonY', 'r3InvulnUntil', 'r3Items',
  'r3Lane', 'r3LaneOffset', 'r3LastNow', 'r3LastWasPoop', 'r3Lives',
  'r3Loop', 'r3Measure', 'r3NextSpawn', 'r3OskarX', 'r3PlayerY',
  'r3Project', 'r3PulseOskar', 'r3RafId', 'r3RenderOskar', 'r3Running',
  'r3SpawnCount', 'r3SpawnItem', 'r3SpawnMs', 'r3StartT', 'r3Steer',
  'r3Stop', 'r3Timers', 'r3TravelMs', 'r3UpdateHUD', 'r3W',
  'r3Win', 'randomEmoji', 'renderMatchBoard', 'renderMemory', 'savePlayerData',
  'setGameTimeout', 'showLevelComplete', 'showScreen', 'showToast', 'startDanceLevel',
  'startDigLevel', 'startFroggerLevel', 'startLevel1', 'startLevel3', 'startLevel3Match',
  'startLevel4Memory', 'startRun3dLevel', 'swapCells', 'updateBonesDisplay', 'updateHighscore',
  'vibe',
];

export default [
  {
    ignores: ['eslint.config.js'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...Object.fromEntries(gameGlobals.map((name) => [name, 'writable'])),
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      eqeqeq: 'error',
      'no-undef': 'error',
      'no-console': 'warn',
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },
  {
    files: ['tools/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
];

/* ══════════════════════════════════════
   LEVEL 6 – TANZPARTY (Simon Says)
   Oskar zeigt Tanzschritte –
   schau gut zu und tanz sie nach!
══════════════════════════════════════ */

// ── Konfiguration ───────────────────────────────────────────────
const DC_ROUNDS   = [2, 3, 3, 4, 5]   // Schrittfolge-Länge pro Runde
const DC_LIVES    = 3
const DC_LIT_MS   = 520               // wie lange ein Pad beim Vorzeigen leuchtet
const DC_GAP_MS   = 260               // Pause zwischen zwei Schritten
const DC_PRE_MS   = 900               // Pause bevor die Folge startet

// ── State ───────────────────────────────────────────────────────
let dcRunning   = false
let dcRound     = 0          // 0-basiert
let dcLives     = DC_LIVES
let dcSeq       = []         // aktuelle Schrittfolge (Pad-Indizes 0-3)
let dcInputIdx  = 0          // wie viele Schritte der Spieler schon richtig hat
let dcAccepting = false      // nimmt das Spiel gerade Eingaben an?
let dcDanceFlip = false      // Oskar-Tanzbild links/rechts
let dcTimers    = new Set()

// ── Entry Point ─────────────────────────────────────────────────
function startDanceLevel(){
  dcStopGame()
  showScreen("level6")
  document.getElementById("dcStartScreen").classList.remove("hidden")
  document.getElementById("dcGameArea").classList.add("hidden")
}

function dcBeginGame(){
  dcStopGame()
  dcRunning = true
  dcRound   = 0
  dcLives   = DC_LIVES

  document.getElementById("dcStartScreen").classList.add("hidden")
  document.getElementById("dcGameArea").classList.remove("hidden")

  const data = loadPlayerData()
  data.statistics.danceGamesPlayed = (data.statistics.danceGamesPlayed || 0) + 1
  savePlayerData(data)

  dcUpdateHUD()
  dcSetOskarIdle()
  dcStartRound()
}

// ── Runden-Ablauf ───────────────────────────────────────────────
function dcStartRound(){
  if(!dcRunning) return

  // Neue Folge bauen – ohne direkte Wiederholungen, das ist für
  // Kinder leichter zu merken
  const len = DC_ROUNDS[dcRound]
  dcSeq = []
  for(let i = 0; i < len; i++){
    let pad
    do { pad = Math.floor(Math.random() * 4) }
    while(pad === dcSeq[i - 1])
    dcSeq.push(pad)
  }

  dcUpdateHUD()
  dcSetStatus(`Runde ${dcRound + 1} – Schau gut zu! 👀`)
  dcPlaySequence()
}

function dcPlaySequence(){
  dcAccepting = false
  dcInputIdx  = 0
  document.getElementById("dcPads").classList.add("dc-watching")

  dcSeq.forEach((pad, i) => {
    setGameTimeout(() => {
      if(!dcRunning) return
      dcFlashPad(pad)
      dcDanceStep()
    }, DC_PRE_MS + i * (DC_LIT_MS + DC_GAP_MS), dcTimers)
  })

  // Nach der Folge: Spieler ist dran
  const total = DC_PRE_MS + dcSeq.length * (DC_LIT_MS + DC_GAP_MS)
  setGameTimeout(() => {
    if(!dcRunning) return
    document.getElementById("dcPads").classList.remove("dc-watching")
    dcSetStatus("Du bist dran! 💃")
    dcSetOskarIdle()
    dcAccepting = true
  }, total, dcTimers)
}

// ── Eingabe ─────────────────────────────────────────────────────
function dcPadPress(pad){
  if(!dcRunning || !dcAccepting) return

  dcFlashPad(pad)

  if(pad === dcSeq[dcInputIdx]){
    // Richtig!
    dcInputIdx++
    vibe(VIBRATE.SMALL)
    dcDanceStep()

    if(dcInputIdx >= dcSeq.length){
      dcAccepting = false
      dcRoundComplete()
    }
  } else {
    // Falscher Schritt – sanft: gleiche Folge nochmal zeigen
    dcAccepting = false
    dcLives--
    vibe(VIBRATE.LARGE)
    dcUpdateHUD()
    dcShakeStage()

    if(dcLives <= 0){
      setGameTimeout(dcGameOver, 900, dcTimers)
    } else {
      dcSetStatus("Hoppla! Schau nochmal! 🙈")
      setGameTimeout(() => {
        if(!dcRunning) return
        dcSetStatus("Schau gut zu! 👀")
        dcPlaySequence()
      }, 1300, dcTimers)
    }
  }
}

function dcRoundComplete(){
  vibe(VIBRATE.MEDIUM)
  dcSetStatus("Super getanzt! 🎉")
  dcCelebrate()

  if(dcRound >= DC_ROUNDS.length - 1){
    setGameTimeout(dcWin, 1100, dcTimers)
  } else {
    dcRound++
    setGameTimeout(() => {
      if(!dcRunning) return
      dcStartRound()
    }, 1400, dcTimers)
  }
}

// ── Win / GameOver ──────────────────────────────────────────────
function dcWin(){
  const score = 50 + dcLives * 20
  awardLevelWin(6, score)

  const data = loadPlayerData()
  data.statistics.danceLevelWins = (data.statistics.danceLevelWins || 0) + 1
  savePlayerData(data)

  vibe(VIBRATE.LARGE)
  showLevelComplete({
    title:  "🎵 Tanz-Profi!",
    text:   "Du hast alle Tanzschritte geschafft!\nOskar ist stolz auf dich! +1 Knochen 🦴",
    button: "🌴 Weiter",
    stars:  Math.max(1, dcLives),
    next:   () => { dcStopGame(); showScreen("intro") }
  })
}

function dcGameOver(){
  showLevelComplete({
    title:  "🙈 Verflixte Schritte!",
    text:   "Das war ganz schön knifflig!\nProbierst du es nochmal?",
    button: "🔄 Nochmal",
    stars:  0,
    next:   () => startDanceLevel()
  })
}

// ── Anzeige-Helfer ──────────────────────────────────────────────
function dcFlashPad(pad){
  const el = document.querySelector(`#dcPads .dc-pad[data-pad="${pad}"]`)
  if(!el) return
  el.classList.remove("dc-lit")
  void el.offsetWidth          // Animation neu starten
  el.classList.add("dc-lit")
  setGameTimeout(() => el.classList.remove("dc-lit"), DC_LIT_MS, dcTimers)
}

function dcDanceStep(){
  const oskar = document.getElementById("dcOskar")
  if(!oskar) return
  dcDanceFlip = !dcDanceFlip
  oskar.src = dcDanceFlip ? ASSETS.OSKAR_DANCE_FLIP : ASSETS.OSKAR_DANCE
  oskar.classList.remove("dc-oskar-bop")
  void oskar.offsetWidth
  oskar.classList.add("dc-oskar-bop")
}

function dcSetOskarIdle(){
  const oskar = document.getElementById("dcOskar")
  if(oskar) oskar.src = ASSETS.OSKAR_DANCE
}

function dcSetStatus(text){
  const el = document.getElementById("dcStatus")
  if(!el) return
  el.textContent = text
  el.classList.remove("dc-status-pop")
  void el.offsetWidth
  el.classList.add("dc-status-pop")
}

function dcShakeStage(){
  const stage = document.getElementById("dcStage")
  if(!stage) return
  stage.classList.remove("dc-stage-shake")
  void stage.offsetWidth
  stage.classList.add("dc-stage-shake")
}

function dcCelebrate(){
  // Konfetti-Emojis über der Bühne
  const stage = document.getElementById("dcStage")
  if(!stage) return
  const emojis = ["🎉", "⭐", "🎵", "✨", "🐾"]
  for(let i = 0; i < 8; i++){
    const el = document.createElement("span")
    el.className   = "dc-confetti"
    el.textContent = emojis[i % emojis.length]
    el.style.left  = (10 + Math.random() * 80) + "%"
    el.style.animationDelay = (Math.random() * 0.3) + "s"
    stage.appendChild(el)
    setGameTimeout(() => el.remove(), 1400, dcTimers)
  }
}

function dcUpdateHUD(){
  const round = document.getElementById("dcRoundEl")
  if(round) round.textContent = `Runde ${Math.min(dcRound + 1, DC_ROUNDS.length)}/${DC_ROUNDS.length}`

  const lives = document.getElementById("dcLivesEl")
  if(lives) lives.innerHTML = Array.from({ length: DC_LIVES }, (_, i) =>
    `<span style="opacity:${i < dcLives ? 1 : 0.2}">❤️</span>`).join("")
}

// ── Cleanup ─────────────────────────────────────────────────────
function dcStopGame(){
  dcRunning   = false
  dcAccepting = false
  clearGameTimeouts(dcTimers)
  const pads = document.getElementById("dcPads")
  if(pads) pads.classList.remove("dc-watching")
  document.querySelectorAll("#dcPads .dc-pad").forEach(p => p.classList.remove("dc-lit"))
  document.querySelectorAll(".dc-confetti").forEach(c => c.remove())
}

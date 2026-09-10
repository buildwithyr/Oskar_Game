/* ══════════════════════════════════════
   GAME MANAGER
   Kleine zentrale Koordination für alle Level:
   - Sicherheitsnetz: beim Verlassen eines Levels (Menü, anderes Level)
     wird IMMER dessen stop() aufgerufen, auch falls eine Stelle im
     Code das mal vergisst.
   - App im Hintergrund (Tab-Wechsel, Sperrbildschirm, App-Wechsel):
     pausiert das aktive Level und zeigt beim Zurückkehren eine große
     "Weiter"-Schaltfläche statt einfach im Hintergrund weiterzulaufen.
   Kein Overengineering: nur eine Registry + ein visibilitychange-Hook.
══════════════════════════════════════ */

const GameManager = (() => {

  const levels = {}       // screenId -> { stop, pause, resume }
  let activeId  = null
  let isPaused  = false
  let overlayEl = null

  function register(screenId, api){
    levels[screenId] = api || {}
  }

  function setActive(screenId){
    activeId = screenId
    isPaused = false
    hideResumeOverlay()
  }

  // Nur räumen, wenn genau dieses Level noch als aktiv gilt – verhindert,
  // dass ein verspäteter stop()-Aufruf eines bereits verlassenen Levels
  // das inzwischen neu gestartete Level fälschlich abräumt.
  function clearActive(screenId){
    if(activeId === screenId){
      activeId = null
      isPaused = false
      hideResumeOverlay()
    }
  }

  // Sicherheitsnetz: läuft bei jedem Screen-Wechsel. Verlässt man ein
  // Level-Screen (id startet nicht mit "level" oder wechselt zu einem
  // anderen Level), wird dessen stop() garantiert aufgerufen.
  function onScreenChange(newId){
    if(activeId && activeId !== newId){
      const api = levels[activeId]
      if(api && typeof api.stop === "function") api.stop()
      activeId = null
      isPaused = false
      hideResumeOverlay()
    }
  }

  function showResumeOverlay(){
    if(overlayEl) return
    const el = document.createElement("div")
    el.className = "gm-resume-overlay"
    el.innerHTML = `
      <div class="gm-resume-box">
        <div class="gm-resume-emoji">⏸️</div>
        <div class="gm-resume-text">Oskar wartet auf dich!</div>
        <button class="gm-resume-btn" id="gmResumeBtn">▶ Weiter</button>
      </div>
    `
    document.body.appendChild(el)
    overlayEl = el
    document.getElementById("gmResumeBtn").addEventListener("click", resumeActive)
  }

  function hideResumeOverlay(){
    if(overlayEl){
      overlayEl.remove()
      overlayEl = null
    }
  }

  function pauseActive(){
    if(!activeId || isPaused) return
    const api = levels[activeId]
    if(!api || typeof api.pause !== "function") return // Level braucht keine Pause
    api.pause()
    isPaused = true
    showResumeOverlay()
  }

  function resumeActive(){
    if(!activeId || !isPaused) return
    const api = levels[activeId]
    hideResumeOverlay()
    isPaused = false
    if(api && typeof api.resume === "function") api.resume()
  }

  document.addEventListener("visibilitychange", () => {
    if(document.hidden) pauseActive()
  })

  // iOS Safari feuert bei App-Wechsel zuverlässiger auf pagehide/blur
  window.addEventListener("pagehide", pauseActive)
  window.addEventListener("blur", pauseActive)

  return { register, setActive, clearActive, onScreenChange, pauseActive, resumeActive }

})()

// showScreen() ist der einzige Ort, an dem Level-Screens gewechselt werden
// (Home-Button, Level-Ende, Neustart) – daher hier einmal zentral einhängen.
const _showScreenForGameManager = window.showScreen
if(typeof _showScreenForGameManager === "function"){
  window.showScreen = function(id){
    GameManager.onScreenChange(id)
    _showScreenForGameManager(id)
  }
}

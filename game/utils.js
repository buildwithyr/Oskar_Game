
function vibe(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern)
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"))
  document.getElementById(id).classList.add("active")
}

function showLevelComplete({ title, text, button, next, stars = 3, retry, score, levelKey, xp = 15 }){

  const old = document.getElementById("levelCompletePopup")
  if(old) old.remove()

  // Check & save personal record
  let isNewRecord = false
  if (score !== undefined && levelKey) {
    const data = loadPlayerData()
    const prev = data.highscores[levelKey] || 0
    if (score > prev) {
      isNewRecord = true
      data.highscores[levelKey] = score
      savePlayerData(data)
    }
  }

  const starsHtml = Array.from({ length: 3 }, (_, i) =>
    `<span class="star" style="animation-delay:${i * 0.15}s">${i < stars ? "⭐" : "☆"}</span>`
  ).join("")

  const scoreHtml = score !== undefined ? `
    <div class="popup-score-row">
      <span class="popup-score-num">${score}</span>
      ${isNewRecord ? '<span class="popup-record-badge">🏆 Neuer Rekord!</span>' : ''}
    </div>` : ''

  const retryHtml = retry
    ? `<button class="popup-btn popup-btn-retry" id="popupRetryBtn">🔄 Nochmal</button>`
    : ''

  const popup = document.createElement("div")
  popup.className = "popup"
  popup.id = "levelCompletePopup"

  popup.innerHTML = `
    <div class="popup-box">
      <div class="popup-deco-row" aria-hidden="true">🎉 🏖️ 🐾 🌴 🎉</div>
      <h1 class="popup-title">${title}</h1>
      <div class="stars-wrap">${starsHtml}</div>
      ${scoreHtml}
      <p class="popup-text">${text}</p>
      <div class="popup-xp-badge">+${xp} XP ⭐</div>
      <div class="popup-btn-row">
        ${retryHtml}
        <button class="popup-btn popup-btn-next" id="popupNextBtn">${button}</button>
      </div>
    </div>
  `

  document.body.appendChild(popup)

  document.getElementById("popupNextBtn").addEventListener("click", () => {
    vibe(VIBRATE.MEDIUM)
    popup.remove()
    next()
  })

  if (retry) {
    document.getElementById("popupRetryBtn").addEventListener("click", () => {
      vibe(VIBRATE.MEDIUM)
      popup.remove()
      retry()
    })
  }

}

function showToast(msg, duration = 2200){
  const old = document.getElementById("gameToast")
  if(old) old.remove()
  const el = document.createElement("div")
  el.id        = "gameToast"
  el.className = "game-toast"
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), duration)
}

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */

function vibe(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern)
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"))
  document.getElementById(id).classList.add("active")
}

function showLevelComplete({ title, text, button, next, stars = 3 })




/* ══════════════════════════════════════
   LEVEL COMPLETE POPUP
══════════════════════════════════════ */



  // Remove old popup if exists
  const old = document.getElementById("levelCompletePopup")
  if(old) old.remove()

  const popup = document.createElement("div")
  popup.className = "popup"
  popup.id = "levelCompletePopup"

  const starsHtml = Array.from({ length: 3 }, (_, i) =>
    `<span class="star" style="animation-delay:${i * 0.15}s">${i < stars ? "⭐" : "☆"}</span>`
  ).join("")

  popup.innerHTML = `
    <div class="popup-box">
      <h1>${title}</h1>
      <div class="stars-wrap">${starsHtml}</div>
      <p style="margin-bottom:24px;font-size:16px;opacity:0.8">${text}</p>
      <button class="popup-btn" id="popupNextBtn">${button}</button>
    </div>
  `

  document.body.appendChild(popup)

  document.getElementById("popupNextBtn").addEventListener("click", () => {
    vibe(VIBRATE.MEDIUM)
    popup.remove()
    next()
  })

}


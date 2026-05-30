/* ══════════════════════════════════════
   LEVEL 5 - OSKAR MEMORY
══════════════════════════════════════ */

const L5_EMOJIS = ["🐶","🦴","⚽","🐱","🐾","🍖"]

let memCards   = []   // [{ emoji, flipped, matched }]
let memFlipped = []   // indices of currently face-up unmatched cards
let memPairs   = 0
let memBusy    = false

function startLevel5(){
  memCards   = []
  memFlipped = []
  memPairs   = 0
  memBusy    = false

  showScreen("level5")
  initMemory()
  renderMemory()
}

function initMemory(){
  const emojis = [...L5_EMOJIS, ...L5_EMOJIS]
  for(let i = emojis.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1))
    ;[emojis[i], emojis[j]] = [emojis[j], emojis[i]]
  }
  memCards = emojis.map(e => ({ emoji: e, flipped: false, matched: false }))
}

function renderMemory(){
  const grid = document.getElementById("memGrid")
  grid.innerHTML = ""

  memCards.forEach((card, i) => {
    const el = document.createElement("div")
    el.className = "mem-card"
    if(card.flipped || card.matched) el.classList.add("mem-flipped")
    if(card.matched)                  el.classList.add("mem-matched")

    el.innerHTML = `
      <div class="mem-inner">
        <div class="mem-front">🐾</div>
        <div class="mem-back">${card.emoji}</div>
      </div>`

    if(!card.matched){
      el.addEventListener("click", () => onMemCardClick(i))
    }
    grid.appendChild(el)
  })

  document.getElementById("memPairsText").textContent =
    `${memPairs} von 6 Paaren gefunden`
}

function onMemCardClick(i){
  if(memBusy) return
  const card = memCards[i]
  if(card.flipped || card.matched) return
  if(memFlipped.length >= 2) return

  vibe(VIBRATE.SMALL)
  card.flipped = true
  memFlipped.push(i)
  renderMemory()

  if(memFlipped.length === 2){
    memBusy = true
    const [a, b] = memFlipped

    if(memCards[a].emoji === memCards[b].emoji){
      setTimeout(() => {
        memCards[a].matched = true
        memCards[b].matched = true
        memFlipped = []
        memPairs++
        memBusy = false
        vibe(VIBRATE.MEDIUM)
        renderMemory()
        if(memPairs === L5_EMOJIS.length) memWin()
      }, 500)
    } else {
      setTimeout(() => {
        memCards[a].flipped = false
        memCards[b].flipped = false
        memFlipped = []
        memBusy = false
        renderMemory()
      }, 1000)
    }
  }
}

function memWin(){
  setTimeout(() => {
    showLevelComplete({
      title: "🎉 Fantastisch!",
      text:  "Du hast alle Paare gefunden! Oskar ist stolz auf dich! 🐶",
      button:"🔄 Nochmal spielen",
      next:  () => { vibe(VIBRATE.MEDIUM); startLevel5() }
    })
  }, DELAYS.LEVEL_COMPLETE)
}

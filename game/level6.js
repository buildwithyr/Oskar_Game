/* ══════════════════════════════════════
   LEVEL 6 - WELCHER BUCHSTABE FEHLT?
══════════════════════════════════════ */

const L6_POOL = [
  { display:"H _ N D",     answer:"U", wrong:["O","A"] },
  { display:"K A _ Z E",   answer:"T", wrong:["S","P"] },
  { display:"M A U _",     answer:"S", wrong:["T","R"] },
  { display:"B A _ L",     answer:"L", wrong:["R","T"] },
  { display:"S O N _ E",   answer:"N", wrong:["M","L"] },
  { display:"F I _ C H",   answer:"S", wrong:["T","P"] },
  { display:"B _ U M",     answer:"A", wrong:["O","E"] },
  { display:"H A _ E",     answer:"S", wrong:["N","T"] },
  { display:"V O _ E L",   answer:"G", wrong:["K","B"] },
  { display:"A P _ E L",   answer:"F", wrong:["P","K"] },
  { display:"B _ O T",     answer:"O", wrong:["U","A"] },
  { display:"S T E _ N",   answer:"I", wrong:["E","A"] },
  { display:"B L U M _",   answer:"E", wrong:["A","I"] },
  { display:"H A U _",     answer:"S", wrong:["T","R"] },
  { display:"Z _ G",       answer:"U", wrong:["O","A"] },
  { display:"P F E _ D",   answer:"R", wrong:["L","N"] },
  { display:"A _ F E",     answer:"F", wrong:["P","T"] },
  { display:"T I _ E R",   answer:"G", wrong:["K","B"] },
  { display:"E N _ E",     answer:"T", wrong:["D","K"] },
  { display:"W O _ F",     answer:"L", wrong:["R","N"] },
]

const L6_TOTAL = 8

let l6Questions = []
let l6Index     = 0
let l6Busy      = false

function startLevel6(){
  l6Index = 0
  l6Busy  = false

  // Pick L6_TOTAL random questions without repeats
  const shuffled = [...L6_POOL].sort(() => Math.random() - 0.5)
  l6Questions = shuffled.slice(0, L6_TOTAL)

  showScreen("level6")
  renderL6Question()
}

function renderL6Question(){
  const q = l6Questions[l6Index]

  document.getElementById("l6Progress").textContent =
    `Frage ${l6Index + 1} von ${L6_TOTAL}`
  document.getElementById("l6Word").textContent = q.display
  document.getElementById("l6Feedback").textContent = ""
  document.getElementById("l6Feedback").className = "l6-feedback"

  // Build shuffled options
  const options = [q.answer, ...q.wrong].sort(() => Math.random() - 0.5)
  const answersEl = document.getElementById("l6Answers")
  answersEl.innerHTML = ""

  options.forEach(opt => {
    const btn = document.createElement("button")
    btn.className = "l6-btn"
    btn.textContent = opt
    btn.addEventListener("click", () => onL6Answer(opt, q.answer))
    answersEl.appendChild(btn)
  })

  l6Busy = false
}

function onL6Answer(chosen, correct){
  if(l6Busy) return
  l6Busy = true

  vibe(VIBRATE.SMALL)
  const feedback = document.getElementById("l6Feedback")

  if(chosen === correct){
    feedback.textContent = "⭐ Super gemacht!"
    feedback.className   = "l6-feedback l6-correct"
    vibe(VIBRATE.MEDIUM)

    setTimeout(() => {
      l6Index++
      if(l6Index >= L6_TOTAL){
        l6Win()
      } else {
        renderL6Question()
      }
    }, 900)

  } else {
    feedback.textContent = "❌ Versuch es noch einmal!"
    feedback.className   = "l6-feedback l6-wrong"

    setTimeout(() => {
      feedback.textContent = ""
      feedback.className   = "l6-feedback"
      l6Busy = false
    }, 900)
  }
}

function l6Win(){
  setTimeout(() => {
    showLevelComplete({
      title: "🏆 Oskar ist stolz!",
      text:  "Alle Fragen richtig beantwortet! Du bist super! 🐶📚",
      button:"🔄 Nochmal spielen",
      next:  () => { vibe(VIBRATE.MEDIUM); startLevel6() }
    })
  }, DELAYS.LEVEL_COMPLETE)
}

/* ══════════════════════════════════════
   LEVEL 1 - SNACKS
══════════════════════════════════════ */

let snacks = 0
let tongueLeft = true

function startLevel1(){
  snacks = 0
  tongueLeft = true
  updateSnackUI()
  showScreen("level1")
}

function updateSnackUI(){

  document.getElementById("snackCounter").textContent =
    `Snacks: ${snacks} / ${LEVEL1_SNACK_GOAL}`

  const snackBar = document.getElementById("snackBar")
  snackBar.innerHTML = ""

  for(let i = 0; i < LEVEL1_SNACK_GOAL; i++){
    const dot = document.createElement("div")
    dot.className = "snack-dot"
    if(i < snacks){
      dot.classList.add("filled")
      dot.innerHTML = "🍖"
    }
    snackBar.appendChild(dot)
  }

}

function handleClickDog(){

  if (snacks >= LEVEL1_SNACK_GOAL) return

  snacks++
  vibe(VIBRATE.SMALL)
  updateSnackUI()

  const dog = document.getElementById("clickDog")

  dog.src = tongueLeft ? ASSETS.OSKAR_TONGUE_LEFT : ASSETS.OSKAR_TONGUE_RIGHT
  tongueLeft = !tongueLeft

  setTimeout(() => {
    dog.src = ASSETS.OSKAR_DEFAULT
  }, LEVEL1_SNACK_CLICK_DELAY)

  if (snacks >= LEVEL1_SNACK_GOAL) {

    setTimeout(() => {

      showLevelComplete({
        title: "🍖 Oskar ist satt!",
        text: "Zeit fuer das Strand Labyrinth 😄",
        button: "🌴 Weiter",
        next: startLevel2
      })

    }, DELAYS.LEVEL_COMPLETE)

  }

}

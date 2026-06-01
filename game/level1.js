/* ══════════════════════════════════════
   LEVEL 1 - LECKERLI FANGEN
══════════════════════════════════════ */

const L1_GOAL          = 10
const L1_SPAWN_INTERVAL = 1200
const L1_FALL_SPEED    = 3.5
const L1_OSKAR_WIDTH   = 90
const L1_TREAT_SIZE    = 44
const L1_CATCH_MARGIN  = 50

let l1Running      = false
let l1Caught       = 0
let l1Treats       = []
let l1OskarX       = 50
let l1FieldW       = 0
let l1FieldH       = 0
let l1RafId        = null
let l1SpawnTimer   = null
let l1TongueTimer  = null
let l1StartTime    = 0

function startLevel1(){
  l1Caught   = 0
  l1Treats   = []
  l1OskarX   = 50
  l1Running  = false
  l1StartTime = Date.now()

  incrementGameCount('level1')

  showScreen("level1")

  const field = document.getElementById("l1Field")
  field.innerHTML = ""

  const oskar = document.createElement("img")
  oskar.id        = "l1Oskar"
  oskar.src       = ASSETS.OSKAR_DEFAULT
  oskar.className = "l1-oskar"
  field.appendChild(oskar)

  document.getElementById("l1Counter").textContent = `🍖 0 / ${L1_GOAL}`

  setTimeout(() => {
    l1FieldW  = field.offsetWidth
    l1FieldH  = field.offsetHeight
    l1Running = true
    l1PositionOskar()
    l1Loop()
    l1SpawnTimer = setInterval(l1SpawnTreat, L1_SPAWN_INTERVAL)
    l1SpawnTreat()
  }, 50)
}

function l1StopGame(){
  l1Running = false
  if(l1RafId)     { cancelAnimationFrame(l1RafId); l1RafId = null }
  if(l1SpawnTimer){ clearInterval(l1SpawnTimer);   l1SpawnTimer = null }
  if(l1TongueTimer){ clearTimeout(l1TongueTimer);  l1TongueTimer = null }
}

function l1PositionOskar(){
  const oskar = document.getElementById("l1Oskar")
  if(!oskar) return
  const px = (l1OskarX / 100) * l1FieldW
  const clamped = Math.max(L1_OSKAR_WIDTH / 2, Math.min(l1FieldW - L1_OSKAR_WIDTH / 2, px))
  oskar.style.left = (clamped - L1_OSKAR_WIDTH / 2) + "px"
}

function l1SpawnTreat(){
  if(!l1Running) return
  const field = document.getElementById("l1Field")
  const el    = document.createElement("div")
  el.className  = "l1-treat"
  el.textContent = "🍖"
  const x = L1_TREAT_SIZE / 2 + Math.random() * (l1FieldW - L1_TREAT_SIZE)
  el.style.left = (x - L1_TREAT_SIZE / 2) + "px"
  el.style.top  = "-" + L1_TREAT_SIZE + "px"
  field.appendChild(el)
  l1Treats.push({ el, x, y: -L1_TREAT_SIZE })
}

function l1Loop(){
  if(!l1Running) return

  const field = document.getElementById("l1Field")
  l1FieldW = field.offsetWidth
  l1FieldH = field.offsetHeight

  const oskar    = document.getElementById("l1Oskar")
  const oskarPx  = oskar ? parseFloat(oskar.style.left) + L1_OSKAR_WIDTH / 2 : l1FieldW / 2
  const oskarY   = l1FieldH - 80

  const toRemove = []

  for(const treat of l1Treats){
    treat.y += L1_FALL_SPEED
    treat.el.style.top = treat.y + "px"

    const dx = Math.abs(treat.x - oskarPx)
    const dy = Math.abs((treat.y + L1_TREAT_SIZE / 2) - oskarY)
    if(dx < L1_OSKAR_WIDTH / 2 + L1_CATCH_MARGIN && dy < 40){
      toRemove.push(treat)
      l1OnCatch()
    } else if(treat.y > l1FieldH + 10){
      toRemove.push(treat)
    }
  }

  for(const t of toRemove){
    t.el.remove()
    l1Treats = l1Treats.filter(x => x !== t)
  }

  l1RafId = requestAnimationFrame(l1Loop)
}

function l1OnCatch(){
  l1Caught++
  vibe(VIBRATE.SMALL)
  document.getElementById("l1Counter").textContent = `🍖 ${l1Caught} / ${L1_GOAL}`

  const oskar = document.getElementById("l1Oskar")
  if(oskar){
    oskar.src = ASSETS.OSKAR_TONGUE_LEFT
    if(l1TongueTimer) clearTimeout(l1TongueTimer)
    l1TongueTimer = setTimeout(() => {
      if(oskar) oskar.src = ASSETS.OSKAR_DEFAULT
    }, 300)
  }

  if(l1Caught >= L1_GOAL){
    l1StopGame()
    const elapsed = Date.now() - l1StartTime
    setTimeout(() => {
      onLevel1Win(l1Caught, elapsed)
      showLevelComplete({
        title:  "🍖 Super! Oskar ist jetzt satt!",
        text:   "Jetzt ab ins Strand-Labyrinth 😄",
        button: "🌴 Weiter",
        next:   startLevel2
      })
    }, DELAYS.LEVEL_COMPLETE)
  }
}

// ── Touch / Mouse Input ───────────────

function l1SetupInput(){
  const field = document.getElementById("l1Field")
  if(!field) return

  field.addEventListener("touchmove", e => {
    e.preventDefault()
    const t = e.touches[0]
    const rect = field.getBoundingClientRect()
    l1OskarX = ((t.clientX - rect.left) / rect.width) * 100
    l1PositionOskar()
  }, { passive: false })

  field.addEventListener("mousemove", e => {
    const rect = field.getBoundingClientRect()
    l1OskarX = ((e.clientX - rect.left) / rect.width) * 100
    l1PositionOskar()
  })
}

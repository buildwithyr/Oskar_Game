/* ══════════════════════════════════════
   SAMMELALBUM
   Knochen bekommen einen Zweck: mit jedem
   verdienten Knochen (gesamt, nie abnehmend)
   schaltet sich ein neues Andenken frei.
   Kein Zufall, kein Frust – feste Reihenfolge,
   einmal freigeschaltet bleibt für immer sichtbar.
══════════════════════════════════════ */

const COLLECTION_ITEMS = [
  { id: "shell1",    emoji: "🐚", name: "Muschel",           need: 1  },
  { id: "sunhat",     emoji: "👒", name: "Sonnenhut",         need: 3  },
  { id: "postcard1",  emoji: "🏖️", name: "Postkarte Strand", need: 5  },
  { id: "sticker1",   emoji: "🐾", name: "Pfoten-Sticker",    need: 8  },
  { id: "frisbee",    emoji: "🥏", name: "Frisbee-Deko",      need: 12 },
  { id: "sunglasses", emoji: "🕶️", name: "Sonnenbrille",      need: 16 },
  { id: "postcard2",  emoji: "🌅", name: "Postkarte Sonnenuntergang", need: 20 },
  { id: "shellnecklace", emoji: "📿", name: "Muschelkette",   need: 25 },
  { id: "sticker2",   emoji: "⭐", name: "Star-Sticker",      need: 30 },
  { id: "trophy",     emoji: "🏆", name: "Oskar-Pokal",       need: 40 },
]

// Schaltet alle Gegenstände frei, deren Schwelle erreicht ist, und merkt
// sich das dauerhaft in data.collection (bleibt auch bei localStorage-
// Reload/Export-Import sichtbar). Bereits freigeschaltete Dinge werden nie
// wieder gesperrt, auch wenn Knochen später ausgegeben würden.
function collectionCheckUnlocks(){
  const data = loadPlayerData()
  const earned = (data.statistics && data.statistics.totalBonesEarned) || 0
  let changed = false

  COLLECTION_ITEMS.forEach(item => {
    if(earned >= item.need && !data.collection[item.id]){
      data.collection[item.id] = true
      changed = true
    }
  })

  if(changed) savePlayerData(data)
  return changed
}

function renderCollection(){
  const data = loadPlayerData()
  const grid = document.getElementById("collectionGrid")
  const progressEl = document.getElementById("collectionProgress")
  if(!grid) return

  grid.innerHTML = ""
  let unlockedCount = 0

  COLLECTION_ITEMS.forEach(item => {
    const unlocked = !!data.collection[item.id]
    if(unlocked) unlockedCount++

    const cell = document.createElement("div")
    cell.className = "collection-item" + (unlocked ? " collection-item-unlocked" : "")
    cell.innerHTML = unlocked
      ? `<div class="collection-item-emoji">${item.emoji}</div><div class="collection-item-name">${item.name}</div>`
      : `<div class="collection-item-emoji">🔒</div><div class="collection-item-name">${item.need} 🦴</div>`
    grid.appendChild(cell)
  })

  if(progressEl){
    progressEl.textContent = `${unlockedCount} von ${COLLECTION_ITEMS.length} gesammelt`
  }
}

function openCollection(){
  collectionCheckUnlocks()
  renderCollection()
  showScreen("collection")
}

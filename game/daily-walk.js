/* ══════════════════════════════════════
   TAGES-SPAZIERGANG
   Freiwillige kurze Tagesrunde: 3 Teilziele aus
   unterschiedlichen Leveln, einmal am Tag neu
   gemischt (aber für den ganzen Tag gleich –
   kein Nachladen mitten beim Spielen). Kein
   Druck, keine Strafe beim Verpassen: die
   Teilziele bleiben einfach bis morgen stehen.
══════════════════════════════════════ */

const DAILY_WALK_LEVEL_NAMES = {
  1: "Snack Hunt", 2: "Beach Run", 3: "Candy Match", 4: "Oskar Memory",
  5: "Strandpromenade", 6: "Tanzparty", 7: "Buddel-Spaß", 8: "Leckerli-Lauf",
}

function dailyWalkDateKey(){
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Kleiner deterministischer Zufallsgenerator (Datum als Seed) – gleicher Tag
// = gleiche 3 Level für alle, aber jeder Tag anders. Kein echter Zufall
// nötig, nur "wirkt abwechslungsreich, ist aber testbar/reproduzierbar".
function dailyWalkPickLevels(dateKey){
  let seed = 0
  for(let i = 0; i < dateKey.length; i++) seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0
  const levels = [1, 2, 3, 4, 5, 6, 7, 8]
  for(let i = levels.length - 1; i > 0; i--){
    seed = (seed * 1103515245 + 12345) >>> 0
    const j = seed % (i + 1)
    ;[levels[i], levels[j]] = [levels[j], levels[i]]
  }
  return levels.slice(0, 3).sort((a, b) => a - b)
}

// Sorgt dafür, dass data.dailyChallenges immer zum heutigen Datum passt.
// Läuft das Datum ab (neuer Tag), werden die 3 Ziele sauber neu gezogen –
// alte, nicht geschaffte Ziele verfallen ohne jede Strafe.
function dailyWalkEnsureToday(data){
  const key = dailyChallengesToday_dateKey()
  if(!data.dailyChallenges || data.dailyChallenges.date !== key){
    data.dailyChallenges = {
      date: key,
      levels: dailyWalkPickLevels(key),
      progress: {},
      claimed: false,
    }
  }
  return data.dailyChallenges
}

// (kleiner Alias, damit der Dateiname des Aufrufs unabhängig von der
// konkreten Datumsfunktion bleibt – erleichtert das Testen)
function dailyChallengesToday_dateKey(){
  return dailyWalkDateKey()
}

// Wird von awardLevelWin() nach JEDEM Levelsieg aufgerufen.
function dailyWalkOnLevelWin(level){
  const data = loadPlayerData()
  const dc = dailyWalkEnsureToday(data)

  if(dc.levels.includes(level) && !dc.progress[level]){
    dc.progress[level] = true
  }

  const allDone = dc.levels.every(l => dc.progress[l])
  if(allDone && !dc.claimed){
    dc.claimed = true
    data.bones = (data.bones || 0) + 2
    data.statistics.totalBonesEarned = (data.statistics.totalBonesEarned || 0) + 2
    if(typeof showToast === "function"){
      setTimeout(() => showToast("🚶 Tages-Spaziergang geschafft! +2 Knochen 🦴", 2600), 900)
    }
  }

  savePlayerData(data)
  renderDailyWalk()
}

function renderDailyWalk(){
  const el = document.getElementById("dailyWalkGoals")
  if(!el) return

  const data = loadPlayerData()
  const dc = dailyWalkEnsureToday(data)
  savePlayerData(data) // persistiert einen frisch gezogenen neuen Tag sofort

  el.innerHTML = dc.levels.map(l => `
    <span class="daily-walk-goal ${dc.progress[l] ? "daily-walk-goal-done" : ""}">
      ${dc.progress[l] ? "✅" : "⬜"} ${DAILY_WALK_LEVEL_NAMES[l] || ("Level " + l)}
    </span>
  `).join("")
}

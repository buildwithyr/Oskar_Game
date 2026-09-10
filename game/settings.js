/* ══════════════════════════════════════
   EINSTELLUNGEN
   Vibration, reduzierte Bewegung, große
   Schrift + Spielstand exportieren/importieren.
   Kein Ton-Schalter: das Spiel hat aktuell kein
   Audio-System – ein Schalter ohne Wirkung wäre
   nur verwirrend.
══════════════════════════════════════ */

function applySettingsToDOM(settings){
  document.body.classList.toggle("reduced-motion", !!settings.reducedMotion)
  document.body.classList.toggle("large-text", !!settings.largeText)
}

function openSettings(){
  const data = loadPlayerData()
  document.getElementById("setVibration").checked     = data.settings.vibration
  document.getElementById("setReducedMotion").checked = data.settings.reducedMotion
  document.getElementById("setLargeText").checked     = data.settings.largeText
  showScreen("settings")
}

function updateSetting(key, value){
  const data = loadPlayerData()
  data.settings[key] = value
  savePlayerData(data)
  applySettingsToDOM(data.settings)
}

function exportSaveFile(){
  const str  = exportPlayerDataString()
  const blob = new Blob([str], { type: "application/json" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  const date = new Date().toISOString().slice(0, 10)
  a.href     = url
  a.download = `oskar-spielstand-${date}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  showToast("💾 Spielstand gesichert!")
}

function importSaveFile(file){
  const reader = new FileReader()
  reader.onload = () => {
    const result = importPlayerDataString(String(reader.result))
    if(result.ok){
      applySettingsToDOM(result.data.settings)
      updateBonesDisplay()
      openSettings()
      showToast("✅ Spielstand geladen!")
    } else {
      showToast("😕 " + result.error)
    }
  }
  reader.onerror = () => showToast("😕 Datei konnte nicht gelesen werden.")
  reader.readAsText(file)
}

function settingsSetupInput(){
  document.getElementById("setVibration").addEventListener("change", e => {
    updateSetting("vibration", e.target.checked)
  })
  document.getElementById("setReducedMotion").addEventListener("change", e => {
    updateSetting("reducedMotion", e.target.checked)
  })
  document.getElementById("setLargeText").addEventListener("change", e => {
    updateSetting("largeText", e.target.checked)
  })
  document.getElementById("exportSaveBtn").addEventListener("click", exportSaveFile)

  const fileInput = document.getElementById("importSaveInput")
  document.getElementById("importSaveBtn").addEventListener("click", () => fileInput.click())
  fileInput.addEventListener("change", () => {
    if(fileInput.files && fileInput.files[0]) importSaveFile(fileInput.files[0])
    fileInput.value = ""
  })
}

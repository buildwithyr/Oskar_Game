# Skill: add-level

Ein neues Mini-Game-Level zu Oskar Beach Stories hinzufügen. Dieser Skill beschreibt alle Dateien, die dabei angefasst werden müssen, und das wiederkehrende Code-Muster.

---

## Welche Dateien sind betroffen?

| Datei | Was tun |
|---|---|
| `game/level_X.js` | Neue Level-Datei anlegen |
| `game/config.js` | Neue Konstanten eintragen |
| `game/storage.js` | `createDefaultPlayerData()` und Migration erweitern → siehe Skill `save-migration` |
| `game/main.js` | Event-Listener für den Level-Button verdrahten |
| `index.html` | Screen-`<div>` und `<script>`-Tag einfügen (**nach** `game/game-manager.js`, vor `main.js`) |
| `service-worker.js` | Neue Datei in `CORE_URLS` (Kern-Dateien wie JS) bzw. `OPTIONAL_URLS` (Bilder) aufnehmen, `CACHE_VERSION` hochzählen → siehe Skill `pwa-cache` |

**Wichtig – eindeutiges Präfix wählen:** Jede Level-Datei braucht ein
Funktions-/Variablen-Präfix, das in **keiner anderen** `game/*.js`-Datei
verwendet wird, und das zur **echten** Levelnummer im Menü passt (nicht
irgendeine interne Nummerierung). Genau eine solche Kollision
(`l3StopGame()` gleichzeitig in Beach Run [echtes Level 2!] und Candy
Match [Level 3] definiert) hat früher dafür gesorgt, dass die später
geladene Datei die Stop-Funktion der anderen überschrieben hat – Beach
Runs Loop lief nach dem Home-Button im Hintergrund weiter.
`tests/static-checks.test.js` prüft das automatisch (`npm test`).

---

## Standard-Muster für eine Level-Datei

```js
/* ══════════════════════════════════════
   LEVEL X – NAME
══════════════════════════════════════ */

// ── Konstanten ──────────────────────────────────────────────────
const XY_SOME_VALUE = 42

// ── State ───────────────────────────────────────────────────────
let xyRunning  = false
let xyRafId    = null
let xyTimers   = new Set()   // alle laufenden setTimeout-IDs

// ── Entry Point ─────────────────────────────────────────────────
function startXyLevel() {
  xyStop()
  GameManager.setActive('levelX')
  showScreen('levelX')

  // DOM aufbauen …

  setGameTimeout(() => {
    xyRunning = true
    xyLoop()
  }, 50, xyTimers)
}

// ── Game Loop ───────────────────────────────────────────────────
function xyLoop() {
  if (!xyRunning) return
  // Logik …
  xyRafId = requestAnimationFrame(xyLoop)
}

// ── Stop / Cleanup ──────────────────────────────────────────────
function xyStop() {
  xyRunning = false
  if (xyRafId) { cancelAnimationFrame(xyRafId); xyRafId = null }
  clearGameTimeouts(xyTimers)
  GameManager.clearActive('levelX')
}

// Nur nötig, wenn das Level einen echten requestAnimationFrame-Loop oder
// setInterval-Timer hat, der im Hintergrund (App/Tab-Wechsel) weiterlaufen
// könnte. Turn-basierte Level (Memory, Tanzparty, ...) brauchen das nicht.
function xyPause() {
  if (xyRafId) { cancelAnimationFrame(xyRafId); xyRafId = null }
}
function xyResume() {
  if (!xyRunning) return
  xyRafId = requestAnimationFrame(xyLoop)
}

// Am Dateiende registrieren, NACHDEM start/stop/pause/resume definiert sind:
GameManager.register('levelX', { stop: xyStop, pause: xyPause, resume: xyResume })

// ── Win ─────────────────────────────────────────────────────────
function xyWin() {
  xyStop()
  awardLevelWin(X)   // Knochen + Statistik
  showLevelComplete({
    title: '🎉 Gewonnen!',
    text: 'Kurze Beschreibung',
    button: 'Weiter',
    stars: 3,
    next: () => showScreen('home')
  })
}
```

### Wichtige Hilfs-Funktionen (aus `utils.js` / `storage.js`)

| Funktion | Zweck |
|---|---|
| `showScreen(id)` | Wechselt den aktiven Screen |
| `setGameTimeout(fn, ms, bag)` | `setTimeout` mit automatischem Tracking in der Timer-Bag |
| `clearGameTimeouts(bag)` | Alle offenen Timeouts der Bag canceln |
| `awardLevelWin(levelNumber)` | Knochen vergeben + Statistik hochzählen |
| `showLevelComplete({...})` | Standard-Popup am Level-Ende anzeigen |
| `showToast(msg)` | Kurze Meldung einblenden |
| `vibe(pattern)` | Vibration (`VIBRATE.SMALL / .MEDIUM / .LARGE`) |
| `updateHighscore(level, score)` | Highscore speichern, falls neuer Bestwert |

---

## In `main.js` verdrahten

```js
document.getElementById("levelBtnX").addEventListener("click", () => {
  vibe(VIBRATE.SMALL)
  startXyLevel()
})
```

Touch- und Keyboard-Handler für das neue Level ebenfalls hier eintragen (Muster der bestehenden Level kopieren).

---

## Checkliste

- [ ] Eindeutiges Funktions-/Variablen-Präfix gewählt, das zur echten Levelnummer passt und in keiner anderen `game/*.js`-Datei vorkommt
- [ ] `game/level_X.js` angelegt mit `start`, `stop`, `loop`, `win` (+ `pause`/`resume` bei echtem RAF-Loop/Timer)
- [ ] `GameManager.register('levelX', { stop, pause?, resume? })` am Dateiende
- [ ] Konstanten in `game/config.js` eingetragen
- [ ] `storage.js` erweitert (`createDefaultPlayerData()` + Migration + Version)
- [ ] Screen-`<div>` in `index.html` eingefügt
- [ ] `<script src="game/level_X.js">` in `index.html` nach `game-manager.js`, vor `main.js`
- [ ] Level-Button-Listener in `main.js` eingetragen
- [ ] `service-worker.js` aktualisiert (neue Datei in CORE_URLS/OPTIONAL_URLS + CACHE_VERSION bump)
- [ ] `npm test` läuft grün (deckt Namenskollisionen und fehlende start/stop automatisch ab)

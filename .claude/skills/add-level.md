# Skill: add-level

Ein neues Mini-Game-Level zu Oskar Beach Stories hinzufügen. Dieser Skill beschreibt alle Dateien, die dabei angefasst werden müssen, und das wiederkehrende Code-Muster.

---

## Welche Dateien sind betroffen?

| Datei | Was tun |
|---|---|
| `game/level_X.js` | Neue Level-Datei anlegen |
| `game/config.js` | Neue Konstanten eintragen |
| `game/storage.js` | `DEFAULT_PLAYER_DATA` und Migration erweitern → siehe Skill `save-migration` |
| `game/main.js` | Event-Listener für den Level-Button verdrahten |
| `index.html` | Screen-`<div>` und `<script>`-Tag einfügen |
| `service-worker.js` | Neue Datei in `PRECACHE_URLS` aufnehmen, `CACHE_VERSION` hochzählen → siehe Skill `pwa-cache` |

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
}

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

- [ ] `game/level_X.js` angelegt mit `start`, `stop`, `loop`, `win`
- [ ] Konstanten in `game/config.js` eingetragen
- [ ] `storage.js` erweitert (DEFAULT_PLAYER_DATA + Migration + Version)
- [ ] Screen-`<div>` in `index.html` eingefügt
- [ ] `<script src="game/level_X.js">` in `index.html` vor `main.js`
- [ ] Level-Button-Listener in `main.js` eingetragen
- [ ] `service-worker.js` aktualisiert (neue Datei + CACHE_VERSION bump)

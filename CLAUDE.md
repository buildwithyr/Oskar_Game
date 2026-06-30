# CLAUDE.md – Oskar Beach Stories

## 1. Projekt-Übersicht

**Name:** Oskar Beach Stories  
**Zweck:** Vanilla-JS PWA mit 8 Mini-Games rund um einen Jack-Russell-Terrier namens Oskar. Gedacht für Kinder/Fans, läuft vollständig im Browser, kein Backend.  
**Tech-Stack:** Vanilla JS (ES6+), HTML5, CSS3 – kein Framework, kein Build-Step, kein npm  
**PWA:** Service Worker, Offline-Fähigkeit, installierbar auf Android/iOS  
**Hosting:** Keine Live-URL im Repo gefunden – wird vermutlich statisch gehostet (Vercel/Netlify/GitHub Pages)  
**Sprache:** Deutsch (UI, Kommentare, alles)

---

## 2. Dateistruktur

```
/
├── index.html            # Single-Page-App, alle Level-Screens als HTML-Blöcke
├── style.css             # Gesamtes Styling, mobile-first, safe-area-aware
├── manifest.json         # PWA-Manifest (Theme, Icons, Orientierung)
├── service-worker.js     # Offline-Caching (cache-first Assets, network-first HTML)
│
├── assets/               # Sprites & Bilder (PNGs, alle handgezeichnet/generated)
│   ├── OskarCartoon.png  # Standard-Oskar
│   ├── Oskar*.png        # Varianten: Badehose, Liegestuhl, Zunge, Tanzend, Springt
│   ├── Kothaufen.png     # Hindernis-Sprite (Level 8)
│   ├── krebs.png         # Krabben-Illustration
│   └── ...               # NPCs, Instagram-Icon
│
├── icons/                # PWA-Icons (32/180/192/512px), generiert via generate-icons.js
│
├── game/                 # Core-Logik, alle Module isoliert per Level
│   ├── config.js         # Konstanten: Asset-Pfade, Level-Parameter
│   ├── main.js           # Screen-Switching, globale Event-Listener
│   ├── utils.js          # Vibration, Timeouts, Popups, Toast-Messages
│   ├── storage.js        # localStorage save system (aktuell v5, mit Migrations-Chain)
│   ├── pwa.js            # Service Worker Registration, Install-Prompt
│   ├── level1.js         # Snack Hunt (fallende Leckerlis fangen)
│   ├── level3.js         # Beach Run (Jump'n'Run, 150m)
│   ├── level4.js         # Candy Match (Match-3, 7×7)
│   ├── level5.js         # Oskar Memory (Karten-Memory, 6 Paare)
│   ├── level_frogger.js  # Strandpromenade (Frogger-Klon, 3 Lives, 60s)
│   ├── level_dance.js    # Tanzparty (Simon Says, 5 Runden)
│   ├── level_dig.js      # Buddel-Spaß (4×4 Grid, 6 Knochen finden)
│   └── level_run3d.js    # Leckerli-Lauf (Pseudo-3D Lane Runner, 15 Items)
│
├── generate-icons.js     # Node-Script zum Generieren der PWA-Icons
└── generate-crab.js      # Node-Script zum Generieren des Krabben-PNGs
```

---

## 3. Aktueller Stand

**Fertig & stabil:**
- Alle 8 Level spielbar und komplett
- PWA-Setup inkl. Offline, Icons, Install-Prompt
- localStorage-Speichersystem v5 mit funktionierender Migrations-Chain (v0→v5)
- Responsive CSS mit safe-area-Support für Notch-Geräte

**Zuletzt bearbeitet (Juni 2026):**
- iOS/Safari Touch-Fixes (Level 5–8 Touch wiederhergestellt nach `.hidden`-Regressionsbug)
- Level 8 Steuerung auf iOS Safari nochmal gefixt (native Touch-Events)
- Pseudo-3D Runner (Level 8) + Drag-Steuerung hinzugefügt
- Level-Grid auf Home-Screen vereinheitlicht

**In Arbeit / unklar:**
- Keine offenen TODOs/FIXMEs im Code – aber die iOS-Touch-Fixes waren mehrfach nötig, könnte also nochmal kommen
- `dailyChallenges` im Save-Schema existiert, scheint aber noch nicht implementiert zu sein (leeres Objekt, kein zugehöriger Level-Code gefunden)

---

## 4. Technische Konventionen

**Screen-System:** Alle Level-Screens sind als HTML im `index.html`. Sichtbarkeit läuft über CSS-Klasse `.active` (toggle via `main.js`).

**Game Loop:** `requestAnimationFrame` für Animationen, eigener `setGameTimeout`-Wrapper (`utils.js`) der alle Timer pro Level tracked und beim Cleanup killt.

**Input-Strategie:** Touch-first. `touchstart`/`touchmove` mit `{ passive: false }` um `preventDefault()` zu erlauben. Click + Keyboard (Pfeiltasten, Space, Numpad) als Fallback.

**Naming in Level-Files:** Level-lokale Variablen haben Level-Prefix, z.B. `l1Items` in `level1.js`, `frogger*` in `level_frogger.js`. Verhindert globale Konflikte.

**Kommentare:** Auf Deutsch, knapp, meist nur an nicht-offensichtlichen Stellen.

**Assets:** Keine SVGs, keine Canvas-Zeichnungen – alles PNGs + CSS-Transforms + Emoji. Bilder werden on page-load preloaded um Flicker zu vermeiden.

**Kein Build-Step:** Direkt `<script src="game/level1.js">` etc. in `index.html`. Keine Module, kein Bundler.

---

## 5. Bekannte Eigenheiten & Stolpersteine

- **iOS Touch Regression:** Schon zweimal passiert: CSS `.hidden` auf einem Container blockt Touch-Events auch für Kinder-Elemente. Wenn Level 5–8 auf iPhone nicht reagieren → erstmal schauen ob `.hidden` irgendwo falsch gesetzt ist.

- **Level-Nummerierung ist inkonsistent:** Die Dateinamen heißen `level1`, `level3`, `level4`, `level5` (keine `level2`!) + `level_frogger`, `level_dance`, `level_dig`, `level_run3d`. Das ist historisch – frühere Levels wurden rausgeworfen (v4→v5 Migration hat den Sprung gemacht). Im UI sind es Level 1–8, intern aber gemischte Dateinamen.

- **Save-Version v5:** Wer die Storage-Struktur anfasst, muss eine neue Migration schreiben. Schema in `storage.js`, Migration-Chain ist klar aufgebaut aber fummelig. Nicht vergessen `saveVersion` hochzudrehen.

- **`dailyChallenges` im Schema:** Steht im Save-Objekt, aber kein Code der es befüllt oder auswertet. Entweder geplant oder vergessen.

- **generate-icons.js / generate-crab.js:** Diese Scripts brauchen Node.js und `canvas`-Package. Werden nicht automatisch ausgeführt – nur wenn Icons oder Crab-PNG neu generiert werden müssen.

- **Kein package.json:** Wirklich keins. Keine Dependencies außer Browser. Der einzige Node-Einsatz sind die Icon-Generator-Scripts.

---

## 6. Was NICHT ohne Rückfrage geändert werden soll

- **`storage.js` Schema & Migrations-Chain:** Jede Änderung hier kann bestehende Save-States von echten Spielern zerstören. Immer Migration schreiben, niemals Felder einfach umbenennen/löschen.

- **`service-worker.js`:** Cache-Strategie ist abgestimmt. Änderungen hier können Offline-Funktion brechen oder dazu führen dass alte Versionen gecacht bleiben.

- **`manifest.json`:** Theme-Farben, Icon-Pfade und `start_url` sind für installierte PWA-Instanzen auf Geräten gespeichert. Änderungen können zu Darstellungsfehlern bei bereits installierten Apps führen.

- **Asset-Dateinamen in `assets/`:** Werden per Hardcode in `config.js` und direkt in HTML referenziert. Umbenennen → Spiel kaputt.

- **Touch-Event-Handling in Level 5–8:** Wie oben beschrieben zweimal als Bug aufgetaucht. Nicht "vereinfachen" ohne auf iPhone zu testen.

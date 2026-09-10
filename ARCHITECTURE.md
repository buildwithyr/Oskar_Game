# Architektur – Oskar Beach Stories

Kurzreferenz für spätere Arbeit am Projekt. Kein Build-Step, kein Framework:
reines HTML/CSS/JavaScript, geladen als klassische `<script>`-Tags (kein
`type="module"`). Top-Level `function`-Deklarationen landen dadurch auf
`window` und sind aus jeder anderen Datei heraus aufrufbar – genau deshalb
ist eindeutige Namensgebung wichtig (siehe unten).

## Deployment / GitHub Pages – WICHTIG

**GitHub Pages muss auf `main` zeigen.** Zum Zeitpunkt dieser Aufräumaktion
(September 2026) zeigte die Live-Version https://buildwithyr.github.io/Oskar_Game/
neun Level inkl. "Kokos-Katapult", obwohl `main` nur acht Level enthielt.
Ursache: die letzte erfolgreiche "pages build and deployment"-Action lief
vom Branch `claude/sweet-ride-oo8lcy` (der Kokos-Katapult als PR #25 einführte),
nicht von `main`. Dieser Branch wurde nie in `main` gemerged, aber GitHub
Pages war (vermutlich über die Repo-Einstellung *Settings → Pages → Branch*)
weiterhin auf ihn eingestellt – jeder Push auf diesen Branch löste seither
ein neues Live-Deployment aus, unabhängig von `main`.

**Prüfen/Beheben (im Repository auf GitHub, nicht per Code):**
`Settings → Pages → Build and deployment → Branch` muss auf `main` (Ordner
`/ (root)`) stehen. Danach zeigt Live immer exakt das, was auf `main`
gemerged ist – kein Sonderfall mehr.

Kokos-Katapult (Level 9) wurde in dieser Aufräumaktion bewusst **nicht**
in `main` übernommen: der Code auf `claude/sweet-ride-oo8lcy` wurde nicht
gegen die aktuelle Level-Umbenennung (siehe unten) getestet und referenziert
z. B. eine Save-Version (v6 dort), die mit der Migration in diesem Branch
kollidiert. Bevor Level 9 aktiviert wird, muss sein Code auf den aktuellen
`main`-Stand portiert, durchgetestet und seine eigene Migration sauber an
`CURRENT_SAVE_VERSION` angehängt werden (siehe `.claude/skills/save-migration.md`).

## Dateistruktur

```
index.html          Alle Screens (Start, Menü, 8 Level, Sammelalbum, Einstellungen)
style.css            Gesamtes Styling (ein File, nach Screens/Leveln gegliedert)
service-worker.js    Offline-Cache (siehe PWA-Abschnitt unten)
manifest.json        PWA-Manifest
package.json         Nur für `npm test` (kein Build-Step für die App selbst)

assets/              Bilder (Oskar-Sprites, Deko) – siehe Bildgrößen-Hinweis unten
icons/               PWA-Icons

game/
  config.js          ASSETS-Pfade + Level-Konstanten (L2_*, R3_*, ...)
  utils.js            showScreen(), vibe(), awardLevelWin(), showLevelComplete(), Timer-Helfer
  storage.js           Speicher-/Migrationssystem (siehe unten)
  game-manager.js       Zentrale Level-Koordination (siehe unten)
  level1.js              Level 1 – Snack Hunt         (l1* Funktionen/State)
  level-02-beach-run.js  Level 2 – Beach Run           (l2* Funktionen/State)
  level-03-candy-match.js Level 3 – Candy Match        (match*, drag* Funktionen/State)
  level4_memory.js       Level 4 – Oskar Memory        (mem*, l4* Funktionen/State)
  level_frogger.js       Level 5 – Strandpromenade     (frog* Funktionen/State)
  level_dance.js         Level 6 – Tanzparty           (dc* Funktionen/State)
  level_dig.js           Level 7 – Buddel-Spaß         (dg* Funktionen/State)
  level_run3d.js         Level 8 – Leckerli-Lauf 3D    (r3* Funktionen/State)
  collection.js           Sammelalbum (Knochen-Meilensteine)
  daily-walk.js           Tages-Spaziergang (3 Teilziele/Tag)
  settings.js             Einstellungen (Vibration, reduzierte Bewegung, große Schrift, Export/Import)
  main.js                Boot-Splash, zentrale Event-Listener, Preload
  pwa.js                  Service-Worker-Registrierung + Install-Banner + Update-Handling

tests/                Node-Tests ohne Framework, `npm test` bzw. `node tests/run-all.js`
tools/                 Einmalige Asset-Generator-Skripte (nicht Teil der Laufzeit-App)
```

## Namenskonvention pro Level (WICHTIG – Grund für diese Aufräumaktion)

Vor dieser Aufräumaktion hießen die Dateien `level3.js` (Beach Run, echtes
Level 2!) und `level3_match.js` (Candy Match, Level 3). Beide definierten
eine Funktion `l3StopGame()` – die später geladene Datei
(`level3_match.js`) überschrieb dadurch beim Booten die Stop-Funktion von
Beach Run. Folge: der Home-Button in Beach Run stoppte in Wirklichkeit
Candy Match (das noch nicht lief), Beach Runs eigener `requestAnimationFrame`-
Loop lief im Hintergrund weiter, und ein Verlust in Beach Run schrieb den
Highscore fälschlich unter `level3` statt `level2`.

**Seitdem gilt:** jede Level-Datei bekommt ein Funktions-/Variablen-Präfix,
das zum **echten** Level im Menü passt (`l2*` für Level 2, nicht `l3*`).
Beim Hinzufügen eines neuen Levels:

1. Datei nach dem Muster `level-0N-kurzname.js` oder `level_kurzname.js` anlegen.
2. Alle globalen Funktionen/Variablen mit einem Level-eindeutigen Kürzel
   präfixen (z. B. `xy*`), das in keiner anderen `game/*.js`-Datei vorkommt.
3. `start()`/`stop()`-Paar bereitstellen und bei `GameManager.register(screenId, { stop, pause?, resume? })`
   anmelden (siehe unten) – `pause`/`resume` nur, wenn das Level einen
   echten `requestAnimationFrame`-Loop oder `setInterval`-Timer hat, der im
   Hintergrund weiterlaufen könnte.
4. `tests/static-checks.test.js` deckt Namenskollisionen zwischen Dateien
   automatisch ab (`node tests/run-all.js` vor jedem Commit laufen lassen).

## GameManager (`game/game-manager.js`)

Kleine zentrale Koordination, kein Overengineering:

- **Sicherheitsnetz:** `showScreen()` wird beim Laden einmal umschlossen.
  Wechselt der aktive Screen weg von einem registrierten Level, ruft
  `GameManager.onScreenChange()` automatisch dessen `stop()` auf – auch
  wenn ein Button vergisst, `stop()` selbst aufzurufen.
- **Hintergrund-Pause:** bei `visibilitychange` (Tab-Wechsel, Sperrbildschirm,
  App-Wechsel) wird `pause()` des aktiven Levels aufgerufen und eine große
  "▶ Weiter"-Schaltfläche (`.gm-resume-overlay`) eingeblendet. Erst ein Tap
  darauf ruft `resume()` auf – das Spiel läuft nie unbeobachtet im
  Hintergrund weiter.
- **Registriert sind `pause`/`resume`** für Level mit echtem
  `requestAnimationFrame`-Loop bzw. Countdown-Timer: Level 1, 2, 5, 8.
  Die turn-basierten Level (3, 4, 6, 7) registrieren nur `stop` – ohne
  Dauerschleife gibt es dort nichts, was im Hintergrund weiterlaufen könnte.

## Speichersystem (`game/storage.js`)

Versioniertes `localStorage`-Schema unter dem Key `oskar_player_data`.

- `createDefaultPlayerData()` ist eine **Factory-Funktion**, kein geteiltes
  Objekt – jeder Aufruf liefert eine unabhängige, tiefe Kopie. Ein
  `{ ...DEFAULT_PLAYER_DATA }` (der alte Stand) hätte verschachtelte Felder
  (`statistics`, `highscores`, ...) nur per Referenz geteilt.
- `migrateSaveData(data)` läuft als Kette von `if (data.saveVersion < N)`-
  Blöcken bis `CURRENT_SAVE_VERSION`. Neue Felder: **immer** einen neuen
  Migrationsschritt anhängen, nie bestehende überschreiben. Siehe
  `.claude/skills/save-migration.md` für die Schritt-für-Schritt-Anleitung.
- `sanitizePlayerData(data)` fängt kaputte/manipulierte Werte ab (negative
  Zahlen, `NaN`, falsche Typen) und ersetzt sie durch sichere Defaults.
- Export/Import (`exportPlayerDataString()` / `importPlayerDataString()`,
  UI in `game/settings.js`): Spielstand als JSON-Datei sichern/laden, kein
  Cloud-Dienst nötig.
- Aktuelle Version: **v6** – rettet einen durch den l3StopGame-Bug (s.o.)
  fälschlich unter `level3` gelandeten Beach-Run-Highscore nach `level2`
  und ergänzt `collection` (Sammelalbum) sowie `settings`.

## PWA / Offline (`service-worker.js`)

- **Kern-Dateien** (`CORE_URLS`: HTML, CSS, alle `game/*.js`, Manifest)
  werden mit `cache.addAll()` installiert – schlägt eine davon fehl,
  **bricht die Installation komplett ab** (alter Service Worker bleibt
  aktiv). So wird nie eine kaputte, halb-gecachte Version aktiviert.
- **Optionale Dateien** (`OPTIONAL_URLS`: Bilder/Icons) werden einzeln mit
  Fehlertoleranz gecacht (`Promise.allSettled`) – ein einzelnes langsames
  Bild darf die App nicht unbenutzbar machen.
- `index.html` lädt Skripte/Styles mit Cache-Busting-Query
  (`game/main.js?v=17`). Der Service Worker cacht bewusst **ohne** Query
  und matcht Requests mit `{ ignoreSearch: true }` – ein einziger
  Cache-Eintrag pro Datei bleibt so gültig, egal welche `?v=`-Nummer
  `index.html` gerade referenziert. **Beim nächsten Ändern einer Datei
  reicht ein `CACHE_VERSION`-Bump in `service-worker.js`** (siehe
  `.claude/skills/pwa-cache.md`); die `?v=`-Nummern in `index.html` sind
  nur für den Browser-HTTP-Cache relevant, nicht für den Service Worker.
- **Kein Reload mitten im Spiel:** ein fertig installiertes Update wird
  nicht sofort aktiviert. `game/pwa.js` wartet, bis `showScreen()` wieder
  `start` oder `intro` (also das Menü) zeigt, bevor es `SKIP_WAITING`
  schickt – siehe Kommentare dort.

## Bildgrößen (Phase 4)

Alle Oskar-/Deko-Bilder wurden auf die tatsächlich im CSS genutzte
Anzeigebreite (× ~3 für Retina-Displays) verkleinert – z. B.
`Instagram_icon.png` war 5001×5001px für eine 18px-Anzeige,
`OskarZungerechts.png` war 2048×2048px für eine 180px-Anzeige. Beim
Hinzufügen neuer Bilder: Anzeigebreite im CSS nachsehen und das Bild nicht
größer als das ~3-fache davon exportieren.

## Tests (`tests/`)

Kein Test-Framework, nur Node + `assert`. `npm test` bzw.
`node tests/run-all.js` führt alle `*.test.js` aus:

- `storage.test.js` – Migration, unabhängige Default-Kopien, Validierung
- `candy-match.test.js` – Sackgassen-Erkennung (`boardHasValidMove`)
- `game-manager.test.js` – zentrale Timer-/RAF-Bereinigung beim Screen-Wechsel
- `static-checks.test.js` – keine doppelt definierten Funktionsnamen über
  `game/*.js` hinweg, jede in `index.html` geladene Datei ist im
  Service-Worker-Precache, jedes Level hat start()/stop()

Dateien, die reine (DOM-freie) Logik enthalten, exportieren diese am
Dateiende per CommonJS-Guard (`if (typeof module !== 'undefined') ...`) –
im Browser wirkungslos, da `module` dort nicht existiert.

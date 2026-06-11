# Oskar Beach Stories 🐶🌴

Ein kleines Browsergame rund um Oskar am Strand.
Das Projekt wurde als Lern- und Spaßprojekt gebaut und läuft komplett im Browser mit HTML, CSS und JavaScript.

## 🎮 Spiel online

https://buildwithyr.github.io/Oskar_Game/

---

# Levels

## Level 1 - Snack Hunt 🍖

Füttere Oskar mit Snacks.

## Level 2 - Maze Escape 🌴

Finde den Weg durch das Labyrinth zum Strand.

## Level 3 - Beach Run 🥏

Springe über Hindernisse und renne am Strand entlang.

## Level 4 - Candy Match 🍭

Klassisches Match-3 Minispiel.

## Level 5 - Oskar Memory 🧠

Klassisches Memory-Spiel mit Oskar-Motiven. 6 Paare aufdecken.

## Level 6 - Fehlender Buchstabe 📝

Lernspiel: Den fehlenden Buchstaben in einem Wort erkennen. 8 Fragen.

## Level 7 - Finde den Buchstaben 🔍

Buchstabensuche: Den gesuchten Buchstaben in einem Raster finden. 5 Runden.

## Level 8 - Strandpromenade 🐕

Frogger-Klassiker: Oskar überquert Straße und Wasser zu 5 Zielhäusern.

## Level 9 - Tanzparty 🎵

Simon Says: Oskar tanzt eine Schrittfolge auf 4 bunten Pads vor –
gut zuschauen und in der gleichen Reihenfolge nachtippen. 5 Runden, 3 Herzen.

## Level 10 - Buddel-Spaß 🦴

Buddel-Schatzsuche: Im 4×4-Sandfeld sind 6 Knochen vergraben.
2× tippen = Loch graben. Oskars Nase (👃) verrät, ob ein Knochen
in einem Nachbarfeld liegt. Je weniger Löcher, desto mehr Sterne.

## Level 11 - Leckerli-Lauf 3D 🌅

Pseudo-3D-Runner ohne Engine: Oskar rennt einen Strandweg entlang,
der sich zum Horizont verjüngt. Leckerlis 🦴🍖⭐ und Kothaufen 💩
kommen von vorne und werden größer. Links/rechts tippen zum
Ausweichen, 15 Leckerlis sammeln, 3 Herzen.

---

# Projektstruktur

```txt
/assets
  Bilder & Grafiken

/game
  config.js
  utils.js
  main.js
  level1.js
  level2.js
  level3.js
  level4.js

index.html
style.css
README.md
```

---

# Features

* Mehrere spielbare Levels
* Mobile freundlich
* Keyboard Support
* Modularer Aufbau
* GitHub Pages Deployment
* Modernes UI-Design
* Zurück-Button in jedem Level

---

# Technologien

* HTML5
* CSS3
* JavaScript
* Google Fonts (Bubblegum Sans, Nunito)
* GitHub Pages

---

# Idee hinter dem Projekt

Das Spiel dient als kreatives Lernprojekt rund um:

* Spielentwicklung
* Browsergames
* JavaScript
* Projektstruktur
* GitHub & Deployment

---

# Changelog

## Version 9 – Strandpromenade-Überarbeitung, Mobile-Feinschliff & 3D-Level (2026-06-11)

**Level 8 – Strandpromenade (komplett überarbeitete Bedienung):**
- D-Pad verdeckt Oskar nicht mehr: kompaktere Reihen (Start-Zone 186→96px),
  dadurch eigener Steuerbereich unter dem Spielfeld
- D-Pad jetzt einreihig (◀ ▲ ▼ ▶), Vorwärts-Knopf grün hervorgehoben
- Neu: Tippen aufs Spielfeld = Schritt nach vorn, Wischen = zur Seite
- Kindgerechter: nur noch 3 Ziele statt 5, Autos langsamer (1.8→1.45 / 1.4→1.15)
- Feldbreite dynamisch statt fix 390px (kein Abschneiden auf kleinen Handys,
  zentriertes Feld auf Desktop), Ziel-Slots passen sich der Breite an
- Timer wird nicht mehr vom Home-Button verdeckt

**Mobile-Feinschliff (alle Level):**
- Home-Button größer (44→50px) für Kinderhände
- Level 1: Tippen setzt Oskar sofort an die Stelle (vorher nur Ziehen)
- Level 3: Sprung reagiert sofort auf Touch (kein Warten auf Click-Event)

**Level 11 – Leckerli-Lauf 3D (neu):**
- Pseudo-3D-Runner: Weg verjüngt sich zum Horizont, Objekte skalieren beim
  Näherkommen (reine DOM/CSS-Transforms, keine externe Bibliothek)
- Tipp links/rechts oder Wischen zum Spurwechsel, Pfeiltasten am Desktop
- 15 Leckerlis sammeln, 💩 ausweichen, 3 Herzen mit Schonzeit nach Treffer
- Mitlaufende Palmen und Wegmarkierungen für den Tiefeneffekt
- Neue Datei: `game/level_run3d.js`, Save-Version 4, Cache v7

## Version 8 – Zwei neue Level (2026-06-11)

Zwei komplett neue Spielmodi. Bestehende Level unverändert.

**Level 9 – Tanzparty (Simon Says):**
- Oskar zeigt mit den Tanz-Grafiken eine Schrittfolge auf 4 bunten Pads vor
- Spieler tippt die Folge nach; 5 Runden mit wachsender Länge (2→5 Schritte)
- 3 Herzen, bei Fehlern wird dieselbe Folge sanft wiederholt
- Disco-Bühne mit Konfetti-Effekt, Tastatur-Support (Tasten 1–4)
- Neue Datei: `game/level_dance.js`

**Level 10 – Buddel-Spaß (Knochen suchen):**
- 4×4-Sandfeld, 6 vergrabene Knochen, 2 Krabben als Schreckmoment
- 2× tippen = graben (mit Sandpartikel-Animation)
- Schnüffel-Hinweise: 👃-Marker, wenn ein Knochen im Nachbarfeld liegt
- Kein Verlieren möglich; Sterne nach Anzahl der Grabungen
- Neue Datei: `game/level_dig.js`

**Integration:**
- Hauptmenü: 10-Karten-Layout, neue Badges für Level 9/10
- Save-System: Version 3 (Statistiken + Highscores für Level 9/10)
- Service Worker: Cache v6 inkl. neuer Dateien und Tanz-Grafiken

## Version 7 – Mobile-Optimierung (2026-05-30)

**Back-Button (alle Level):**
- Von Pill-Button "🏠 Menü" auf kompaktes 44×44px Icon-Button reduziert
- Überdeckt keine Spielinhalte mehr

**Level 7 – Buchstaben-Schrift:**
- `'Bubblegum Sans', cursive` → `'Nunito', Arial, sans-serif` (font-weight: 900)
- Auf iOS fiel `cursive` auf System-Schreibschrift zurück — jetzt immer klare Blockschrift
- Buchstabengröße: `clamp(26px, 8vw, 44px)` (war `clamp(22px, 7vw, 40px)`)
- Aufgabenstellung (Prompt): ebenfalls auf Nunito Bold umgestellt

**Level 2 – Maze größer / D-Pad gleichmäßig:**
- Maze-Formel: `min(calc(100vw - 12px), calc(100svh - 300px))` — nutzt mehr Bildschirmbreite
- D-Pad: 160×160px → 216×216px, explizite Zellgröße 66×66px (kein Grid-Stretch-Artefakt)
- Alle 4 Pfeile gleich groß durch feste `width/height` statt `1fr`
- Font-size Pfeile: 22px → 26px, `border-radius: 16px`, stärkerer Schatten
- Touch-Feedback: schnellere Transition 0.1s → 0.08s

## Version 6 – Bugfixes & Level-6-Animation (2026-05-30)

**Level 4 – Match-3 Bugfix (iOS Touch):**
- Ursache: `pointerdown`/`pointerup` auf iOS Safari unzuverlässig
- Fix: Native `touchstart`/`touchend` + `mousedown`/`mouseup`, End-Event auf `document`
- `touch-action: none` auf `.match-cell` verhindert Browser-Interferenz
- Dateien: `game/level4.js`, `style.css`

**Level 6 – Buchstaben-Fly-In-Animation:**
- Phase 1: Buchstabe fliegt animiert in die Lücke
- Phase 2: Vollständiges Wort erscheint groß (1,2s sichtbar)
- Phase 3: "Super gemacht!" → nächste Frage
- Dateien: `game/level6.js`, `style.css`

## Version 5 – Drei neue Level (2026-05-30)

Drei neue Spielmodi hinzugefügt. Bestehende Level unverändert.

**Level 5 – Oskar Memory:**
- 6 Paare (12 Karten) mit Oskar-Motiven: 🐶🦴⚽🐱🐾🍖
- 3×4-Karten-Grid, für Touch optimiert
- Flip-Animation (CSS 3D rotateY)
- Grüne Erfolgs-Animation bei gefundenem Paar
- Fortschrittsanzeige "X von 6 Paaren gefunden"

**Level 6 – Fehlender Buchstabe:**
- 20 Wörter im Pool, 8 zufällige Fragen pro Spiel
- Wort mit Lücke in großer Schrift
- 3 Antwort-Buttons (gemischte Reihenfolge)
- Positives / korrigierendes Feedback, Wiederholung bei Fehler
- Oskar-Maskottchen mit Sprechblase

**Level 7 – Finde den Buchstaben:**
- 5 Runden mit steigender Schwierigkeit (Gittergröße + mehr Buchstaben)
- Grüne Hervorhebung bei richtigem Tippen, roter Shake bei falschem
- Feedback "Toll gemacht!" / "Versuch es noch einmal!"

**Navigation:**
- Alle Level (1–7) haben einheitlichen "🏠 Menü"-Button oben rechts
- Hauptmenü: 7-Karten-Layout (2-spaltig, Level 7 volle Breite)

## Version 4 – UI/UX Modernisierung (2026-05-30)

Komplette visuelle Überarbeitung des Projekts. Spiellogik und -inhalte unverändert.

**Hauptmenü (Intro-Screen):**
- Neuer App-Header mit Oskar-Logo und Titel (Lernwelten-Stil)
- Greeting-Card mit persönlicher Begrüßung
- Levelauswahl als 2×2 Karten-Grid statt vertikaler Buttons
- Jede Level-Karte zeigt: großes Emoji-Icon, farbiges Level-Badge, Levelname
- Sanfte Einblend-Animationen mit versetztem Timing (Stagger-Effekt)
- Warmer Creme/Pfirsich-Hintergrund (#FFF8F0 → #FFE8D0)
- Instagram-Link als dezenter Footer

**Navigation:**
- Zurück-zum-Menü-Button auf allen Level-Screens

**HUD (alle Levels):**
- Glasmorphism-Stil: weißer Hintergrund, backdrop-filter blur, weicher Schatten
- Verbesserte Typografie (Nunito + Bubblegum Sans)
- Farbakzente für Score-Anzeige

**Popup / Level Complete:**
- Stärkerer Glasmorphism-Effekt mit backdrop-filter
- Neues Orange-Gradient für Buttons (statt Rot)
- Verbesserte Schatten und Animation

**Radio (Level 3):**
- Glasmorphism-Stil passend zum HUD

**Typografie:**
- Neue Google Font "Nunito" als Hauptschrift (modern, kinderfreundlich)
- Bubblegum Sans für Überschriften und spielerische Elemente

**CSS-Architektur:**
- Bereinigung von doppelten Regeln
- Konsistente Abstände und Border-Radius-Werte
- Verbesserte Responsive-Breakpoints (480px, 360px)

## Version 3 – Bugfixes & Feinschliff

- Asset-Dateiname korrigiert (OskarInstagram.PNG → .png)
- Diverse Style-Anpassungen

## Version 2 – Erste Veröffentlichung

- Grundlegendes Spieldesign mit 4 Levels
- Mobile D-Pad für Level 2
- Basis-Responsive-Layout

---

# Status

Aktiv in Entwicklung 🚧

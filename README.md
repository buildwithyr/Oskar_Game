# Oskar Beach Stories 🐶🌴

Ein kleines Browsergame rund um Oskar am Strand. Das Projekt läuft komplett im Browser mit HTML, CSS und JavaScript.

## 🎮 Spiel online

https://buildwithyr.github.io/Oskar_Game/

---

## Levels

### Level 1 - Snack Hunt 🍖
Füttere Oskar mit Snacks.

### Level 2 - Beach Run 🥏
Springe über Hindernisse und renne am Strand entlang.

### Level 3 - Candy Match 🍭
Klassisches Match-3-Minispiel.

### Level 4 - Oskar Memory 🧠
Klassisches Memory-Spiel mit Oskar-Motiven. 6 Paare aufdecken.

### Level 5 - Strandpromenade 🐕
Frogger-Klassiker: Oskar überquert Straße und Wasser zu den Zielhäusern.

### Level 6 - Tanzparty 🎵
Simon Says: Oskar tanzt eine Schrittfolge auf 4 bunten Pads vor – gut zuschauen und in der gleichen Reihenfolge nachtippen.

### Level 7 - Buddel-Spaß 🦴
Buddel-Schatzsuche: Im 4×4-Sandfeld sind 6 Knochen vergraben. Oskars Nase (👃) gibt Hinweise.

### Level 8 - Leckerli-Lauf 3D 🌅
Pseudo-3D-Runner: Oskar sammelt Leckerlis und weicht Kothaufen aus.

---

## Projektstruktur

```txt
/assets          Bilder & Grafiken
/game            Spiel-Logik, Speicher- und PWA-Helfer
/icons           PWA-Icons
index.html       Screens und Level-Auswahl
style.css        Layout und Level-Styles
service-worker.js Offline-Cache
manifest.json    PWA-Manifest
```

---

## Features

* 8 spielbare Levels ohne Nummernlücken
* Mobile-first Layout
* Touch-Steuerung für alle Levels
* Fortschritt, Highscores und Knochen-Belohnungen via `localStorage`
* PWA-Unterstützung mit Install-Banner und Offline-Cache
* Einheitliches Level-Grid auf dem Home-Screen

---

## Entwicklung

Das Spiel benötigt keinen Build-Step. Zum Testen reicht ein statischer Webserver, z. B.:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen.

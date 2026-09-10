# Oskar Beach Stories 🐶🌴

Ein kleines Browsergame rund um Oskar am Strand. Das Projekt läuft komplett im Browser mit HTML, CSS und JavaScript.

## 🎮 Spiel online

https://buildwithyr.github.io/Oskar_Game/

**Deployment-Stand:** GitHub Pages muss auf den Branch `main` (Ordner
`/ root`) zeigen (*Settings → Pages* im Repository) – dann bildet Live
immer exakt den Stand von `main` ab. Details und Hintergrund einer
zwischenzeitlichen Abweichung (Live zeigte einen nicht gemergten
Feature-Branch mit einem zusätzlichen 9. Level) stehen in
[`ARCHITECTURE.md`](ARCHITECTURE.md).

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

*Ein 9. Level ("Kokos-Katapult") existiert als unfertiger Code auf einem
separaten Branch, ist aber bewusst noch nicht in `main`/Live – siehe
[`ARCHITECTURE.md`](ARCHITECTURE.md).*

---

## Spielwelt-Funktionen

* **🖼️ Sammelalbum** – mit jedem verdienten Knochen (insgesamt, nie
  abnehmend) schaltet sich ein neues Andenken frei (Muschel, Sonnenhut,
  Postkarten, Sticker, …). Einmal freigeschaltet, bleibt es für immer
  sichtbar – kein Zufall, kein Frust.
* **🚶 Tages-Spaziergang** – jeden Tag 3 freiwillige Teilziele aus
  unterschiedlichen Leveln. Kein Zeitdruck, keine Strafe beim Verpassen;
  alle drei geschafft gibt +2 Bonus-Knochen.
* **⚙️ Einstellungen** – Vibration an/aus, Bewegung reduzieren, große
  Schrift, Spielstand als JSON-Datei sichern/laden (kein Cloud-Login
  nötig).

## Projektstruktur

```txt
/assets          Bilder & Grafiken
/game            Spiel-Logik, Speicher-, PWA- und GameManager-Helfer
/icons           PWA-Icons
/tests           Node-Tests ohne Framework (npm test)
/tools           Einmalige Asset-Generator-Skripte
index.html       Screens und Level-Auswahl
style.css        Layout und Level-Styles
service-worker.js Offline-Cache
manifest.json    PWA-Manifest
ARCHITECTURE.md  Technische Referenz (Namenskonventionen, Speichersystem, PWA-Cache, Deployment)
```

---

## Features

* 8 spielbare Levels ohne Nummernlücken, jedes mit eigener eindeutiger
  Speicher-ID (kein geteilter Highscore mehr zwischen Leveln)
* Zeitbasierte (bildratenunabhängige) Bewegung in Beach Run und
  Strandpromenade – läuft auf 60Hz- und 120Hz-Geräten gleich schnell
* Candy Match erkennt Sackgassen automatisch und mischt freundlich neu,
  ohne Punkte zu verlieren
* Zentraler `GameManager`: kein Level läuft im Hintergrund weiter, App im
  Hintergrund pausiert automatisch mit großer "Weiter"-Schaltfläche
* Mobile-first Layout, große Touchflächen, kurze Texte
* Touch-Steuerung für alle Levels
* Fortschritt, Highscores und Knochen-Belohnungen via `localStorage`
  (versioniertes Speicherformat mit sicherer Migration, Export/Import)
* Sammelalbum und Tages-Spaziergang geben den Knochen einen Zweck
* PWA-Unterstützung mit Install-Banner, konsistentem Offline-Cache und
  Update erst beim nächsten Menü-Besuch (nie mitten in einer Runde)
* Einheitliches Level-Grid auf dem Home-Screen

---

## Entwicklung

Das Spiel benötigt keinen Build-Step. Zum Testen reicht ein statischer Webserver, z. B.:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen.

### Tests

```bash
npm test
```

Führt alle Node-Tests in `tests/` aus (Speicher-Migration, eindeutige
Level-IDs, Candy-Match-Sackgassenerkennung, GameManager-Aufräumlogik,
PWA-Offline-Dateiliste). Kein Build/Install nötig, nur Node.

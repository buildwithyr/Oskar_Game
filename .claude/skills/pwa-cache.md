# Skill: pwa-cache

Wie man den PWA-Service-Worker aktuell hält, wenn neue Dateien oder Assets zum Projekt kommen. Wird dieser Schritt vergessen, liefert der Browser veraltete Versionen aus dem Cache.

---

## Datei: `service-worker.js`

### 1. `CACHE_VERSION` hochzählen

```js
// Muster: oskar-vN  (N ist eine laufende Zahl)
const CACHE_VERSION = 'oskar-v12'   // war v11
```

Der neue Cache-Name (`oskar-beach-stories-oskar-v12`) wird beim nächsten Aufruf aktiviert. Der Activate-Handler löscht alle alten Caches automatisch.

### 2. Neue Datei(en) in `PRECACHE_URLS` eintragen

```js
const PRECACHE_URLS = [
  // … bestehende Einträge …
  BASE_URL + 'game/level_mynew.js',        // neue JS-Datei
  BASE_URL + 'assets/MeinNeuesBild.png',   // neues Bild
]
```

**Reihenfolge ist egal** – alle URLs werden parallel gecacht.

---

## Neue Assets auch in `game/config.js` und `game/main.js` registrieren

Wenn ein Bild neu dazukommt, muss es an zwei weiteren Stellen eingetragen werden:

### `game/config.js` – ASSETS-Objekt

```js
const ASSETS = {
  // … bestehende …
  MY_NEW_IMAGE: "assets/MeinNeuesBild.png",
}
```

### `game/main.js` – preloadImages-Array

```js
const preloadImages = [
  // … bestehende …
  ASSETS.MY_NEW_IMAGE,
]
```

Das stellt sicher, dass das Bild beim App-Start sofort in den Browser-Cache geladen wird und im Spiel verzögerungsfrei erscheint.

---

## Checkliste

- [ ] `CACHE_VERSION` in `service-worker.js` um 1 erhöht (z. B. `oskar-v11` → `oskar-v12`)
- [ ] Neue Dateien in `PRECACHE_URLS` eingetragen
- [ ] Neue Bilder in `ASSETS` (config.js) und `preloadImages` (main.js) eingetragen

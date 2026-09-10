const CACHE_VERSION = 'oskar-v15';
const CACHE_NAME = `oskar-beach-stories-${CACHE_VERSION}`;

// Base URL derived from service worker location (works on GitHub Pages subpaths)
const BASE_URL = new URL('./', self.location).href;

// Kern-Dateien: ohne diese ist die App offline kaputt. Wird auch nur eine
// davon nicht gecacht, MUSS die Installation fehlschlagen (siehe unten,
// cache.addAll statt "stiller" Promise.allSettled) – sonst denkt der
// Browser, ein Update sei fertig, obwohl z. B. ein neues Level-Skript fehlt.
const CORE_URLS = [
  BASE_URL,
  BASE_URL + 'index.html',
  BASE_URL + 'style.css',
  BASE_URL + 'manifest.json',
  BASE_URL + 'game/config.js',
  BASE_URL + 'game/utils.js',
  BASE_URL + 'game/storage.js',
  BASE_URL + 'game/game-manager.js',
  BASE_URL + 'game/main.js',
  BASE_URL + 'game/level1.js',
  BASE_URL + 'game/level_frogger.js',
  BASE_URL + 'game/level-02-beach-run.js',
  BASE_URL + 'game/level-03-candy-match.js',
  BASE_URL + 'game/level4_memory.js',
  BASE_URL + 'game/level_dance.js',
  BASE_URL + 'game/level_dig.js',
  BASE_URL + 'game/level_run3d.js',
  BASE_URL + 'game/collection.js',
  BASE_URL + 'game/daily-walk.js',
  BASE_URL + 'game/settings.js',
  BASE_URL + 'game/pwa.js',
];

// Bilder/Icons: schön zu haben für Offline, aber ein einzelnes fehlendes
// Bild soll die App nicht unbenutzbar machen (z. B. bei langsamer/instabiler
// Verbindung beim ersten Besuch). Deshalb per-Datei-Fehler tolerant.
const OPTIONAL_URLS = [
  BASE_URL + 'icons/icon-192.png',
  BASE_URL + 'icons/icon-512.png',
  BASE_URL + 'icons/apple-touch-icon.png',
  BASE_URL + 'icons/favicon.png',
  BASE_URL + 'assets/OskarCartoon.png',
  BASE_URL + 'assets/OskarBadehose.png',
  BASE_URL + 'assets/Oskar_springt.png',
  BASE_URL + 'assets/OskarZungelinks.png',
  BASE_URL + 'assets/OskarZungerechts.png',
  BASE_URL + 'assets/Frau am Liegestuhl.png',
  BASE_URL + 'assets/Frau am Liegestuhl 2.png',
  BASE_URL + 'assets/Kothaufen.png',
  BASE_URL + 'assets/Instagram_icon.png',
  BASE_URL + 'assets/krebs.png',
  BASE_URL + 'assets/Oskartanzend - Kopie.png',
  BASE_URL + 'assets/Oskartanzendgespiegelt.png',
];

// index.html/main.js laden Skripte/Styles mit Cache-Busting-Query
// (z. B. game/main.js?v=17). Damit ein solcher Request trotzdem den hier
// query-frei abgelegten Cache-Eintrag trifft, wird beim Ablegen UND beim
// Abgleichen konsequent die Query gestrippt ({ ignoreSearch: true } bzw.
// ein bereinigter Cache-Key). So bleibt ein einziger Cache-Eintrag pro
// Datei gültig, egal welche "?v="-Nummer gerade referenziert wird.
function cacheKeyFor(request) {
  const url = new URL(request.url);
  url.search = '';
  return new Request(url.toString(), { mode: 'same-origin' });
}

// Install: Kern-Dateien müssen sicher landen (addAll bricht bei jedem
// Fehler die ganze Installation ab -> alter Service Worker bleibt aktiv,
// nichts wird "kaputt" aktiviert). Bilder sind best-effort.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(CORE_URLS);
      await Promise.allSettled(
        OPTIONAL_URLS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Optionales Asset nicht gecacht:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
      .catch(err => {
        console.error('[SW] Installation fehlgeschlagen – Kern-Datei konnte nicht gecacht werden:', err);
        throw err; // Installation bewusst scheitern lassen statt den Fehler zu schlucken
      })
  );
});

// Activate: delete old caches, keep localStorage intact
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('oskar-beach-stories-') && key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for assets, network-first for HTML
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first for HTML (to get updates)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(cacheKeyFor(event.request), clone));
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true })
          .then(r => r || caches.match(BASE_URL + 'index.html')))
    );
    return;
  }

  // Cache-first for everything else (assets, JS, CSS, images)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(cacheKeyFor(event.request), clone));
        }
        return response;
      }).catch(() => {
        console.warn('[SW] Fetch failed, no cache:', event.request.url);
      });
    })
  );
});

// Handle update messages from the app.
// SKIP_WAITING wird jetzt NICHT mehr automatisch beim Installieren
// ausgelöst (siehe game/pwa.js) – die App fordert es erst an, wenn kein
// Level gerade läuft, damit ein Update nicht mitten in einer Runde
// neu lädt.
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

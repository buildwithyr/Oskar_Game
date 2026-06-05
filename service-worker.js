const CACHE_VERSION = 'oskar-v5';
const CACHE_NAME = `oskar-beach-stories-${CACHE_VERSION}`;

// Base URL derived from service worker location (works on GitHub Pages subpaths)
const BASE_URL = new URL('./', self.location).href;

// All files to cache on install
const PRECACHE_URLS = [
  BASE_URL,
  BASE_URL + 'index.html',
  BASE_URL + 'style.css',
  BASE_URL + 'manifest.json',
  BASE_URL + 'game/config.js',
  BASE_URL + 'game/utils.js',
  BASE_URL + 'game/storage.js',
  BASE_URL + 'game/main.js',
  BASE_URL + 'game/level1.js',
  BASE_URL + 'game/level_bubble.js',
  BASE_URL + 'game/level_frogger.js',
  BASE_URL + 'game/level3.js',
  BASE_URL + 'game/level4.js',
  BASE_URL + 'game/level5.js',
  BASE_URL + 'game/level6.js',
  BASE_URL + 'game/level7.js',
  BASE_URL + 'game/pwa.js',
  BASE_URL + 'icons/icon-192.png',
  BASE_URL + 'icons/icon-512.png',
  BASE_URL + 'icons/apple-touch-icon.png',
  BASE_URL + 'icons/favicon.png',
  BASE_URL + 'assets/OskarCartoon.png',
  BASE_URL + 'assets/OskarBadehose.png',
  BASE_URL + 'assets/OskarLiegestuhl.png',
  BASE_URL + 'assets/Oskar_springt.png',
  BASE_URL + 'assets/OskarZunge.png',
  BASE_URL + 'assets/OskarZungelinks.png',
  BASE_URL + 'assets/OskarZungerechts.png',
  BASE_URL + 'assets/Frau am Liegestuhl.png',
  BASE_URL + 'assets/Frau am Liegestuhl 2.png',
  BASE_URL + 'assets/Kothaufen.png',
  BASE_URL + 'assets/Instagram_icon.png',
  BASE_URL + 'assets/krebs.png'
];

// Install: precache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Failed to cache:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
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
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match(BASE_URL + 'index.html')))
    );
    return;
  }

  // Cache-first for everything else (assets, JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        console.warn('[SW] Fetch failed, no cache:', event.request.url);
      });
    })
  );
});

// Handle update messages from the app
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

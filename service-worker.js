const CACHE_VERSION = 'oskar-v3';
const CACHE_NAME = `oskar-beach-stories-${CACHE_VERSION}`;

// All files to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/game/config.js',
  '/game/utils.js',
  '/game/storage.js',
  '/game/main.js',
  '/game/level1.js',
  '/game/level2.js',
  '/game/level_crab.js',
  '/game/level3.js',
  '/game/level4.js',
  '/game/level5.js',
  '/game/level6.js',
  '/game/level7.js',
  '/game/pwa.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.png',
  '/assets/OskarCartoon.png',
  '/assets/OskarBadehose.png',
  '/assets/OskarLiegestuhl.png',
  '/assets/Oskar_springt.png',
  '/assets/OskarZunge.png',
  '/assets/OskarZungelinks.png',
  '/assets/OskarZungerechts.png',
  '/assets/Frau am Liegestuhl.png',
  '/assets/Frau am Liegestuhl 2.png',
  '/assets/Kothaufen.png',
  '/assets/Instagram_icon.png',
  '/assets/krebs.png'
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
        .catch(() => caches.match(event.request).then(r => r || caches.match('/index.html')))
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

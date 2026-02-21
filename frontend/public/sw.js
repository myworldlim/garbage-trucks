//frontend\public\sw.js
// Custom Service Worker для дополнительного кэширования
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // OSM тайлы - Cache First
  if (url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const cache = caches.open('osm-tiles-cache');
            cache.then((c) => c.put(event.request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // OSRM роутинг - Stale While Revalidate
  if (url.includes('router.project-osrm.org')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            const cache = caches.open('osrm-routes-cache');
            cache.then((c) => c.put(event.request, response.clone()));
          }
          return response;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// Сообщение для триггера кэширования
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_TILES') {
    console.log('[SW] Received cache tiles request:', event.data.tiles);
    // Логика кэширования обрабатывается в useTileCache хуке
  }
});
// Minimal Service Worker - Only for offline page fallback
// No data caching, no sync, just shows a friendly offline page

const CACHE_NAME = 'cardiac-delights-offline-v1';
const OFFLINE_URL = '/offline.html';

// Install: Cache only the offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching offline page');
      return cache.add(OFFLINE_URL);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Only serve offline page when navigation fails
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If fetch fails (offline), return the cached offline page
        return caches.match(OFFLINE_URL);
      })
    );
  }
  // Let all other requests (API, assets, etc.) fail normally
  // This ensures no data caching happens
});

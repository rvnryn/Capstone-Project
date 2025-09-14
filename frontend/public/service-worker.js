const CACHE_NAME = "cardiac-delights-v2";
const STATIC_CACHE = "cardiac-delights-static-v2";
const DYNAMIC_CACHE = "cardiac-delights-dynamic-v2";

const urlsToCache = [
  "/",
  "/dashboard",
  "/inventory",
  "/menu",
  "/report",
  "/supplier",
  "/settings",
  "/manifest.json",
  "/logo.png",
  "/Dashboard.png",
  "/Inventory.png",
  "/Menu.png",
  "/offline.html",
];

// Static assets that should be cached immediately
const STATIC_ASSETS = [
  "/manifest.json",
  "/logo.png",
  "/Dashboard.png",
  "/Inventory.png",
  "/Menu.png",
  "/offline.html",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    Promise.all([
      // Cache main URLs
      caches.open(CACHE_NAME).then((cache) => {
        console.log("[SW] Caching app shell");
        return cache.addAll(urlsToCache);
      }),
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE
          ) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

// Enhanced fetch event - serve from cache, fallback to network, cache strategically
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        console.log("[SW] Serving from cache:", event.request.url);
        return response;
      }

      // Clone the request for fetching
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();
          const url = event.request.url;

          // Cache Next.js static assets
          if (
            url.includes("/_next/static/") ||
            url.includes("/_next/image/") ||
            event.request.destination === "script" ||
            event.request.destination === "style" ||
            event.request.destination === "image"
          ) {
            caches.open(STATIC_CACHE).then((cache) => {
              console.log("[SW] Caching static asset:", url);
              cache.put(event.request, responseToCache);
            });
          }
          // Cache API responses and dynamic content
          else if (
            url.includes("/api/") ||
            event.request.destination === "document"
          ) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              console.log("[SW] Caching dynamic content:", url);
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          console.log("[SW] Network request failed, trying offline fallback");

          // Return offline page for navigation requests
          if (
            event.request.mode === "navigate" ||
            event.request.destination === "document"
          ) {
            return caches.match("/offline.html");
          }

          // For API requests, try to return cached version
          if (event.request.url.includes("/api/")) {
            return caches.match(event.request);
          }

          // For images, return a placeholder or cached version
          if (event.request.destination === "image") {
            return caches.match("/logo.png");
          }
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data
      ? event.data.text()
      : "New notification from Cardiac Delights",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "cardiac-delights-notification",
  };

  event.waitUntil(
    self.registration.showNotification("Cardiac Delights", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

async function doBackgroundSync() {
  // Handle offline actions when connection is restored
  console.log("Background sync triggered");
}

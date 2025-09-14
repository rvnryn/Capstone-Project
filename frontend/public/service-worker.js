const CACHE_NAME = "cardiac-delights-v3";
const STATIC_CACHE = "cardiac-delights-static-v3";
const DYNAMIC_CACHE = "cardiac-delights-dynamic-v3";
const API_CACHE = "cardiac-delights-api-v3";

// API endpoints and their cache strategies
const API_CACHE_STRATEGIES = {
  // Frequently changing data - short cache
  "/api/dashboard/stats": { strategy: "networkFirst", maxAge: 30 * 60 * 1000 }, // 30 minutes
  "/api/inventory": { strategy: "networkFirst", maxAge: 2 * 60 * 60 * 1000 }, // 2 hours
  "/api/sales": { strategy: "networkFirst", maxAge: 60 * 60 * 1000 }, // 1 hour
  "/api/notifications": { strategy: "networkFirst", maxAge: 60 * 60 * 1000 }, // 1 hour

  // Moderately changing data - medium cache
  "/api/menu": { strategy: "cacheFirst", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  "/api/users": { strategy: "cacheFirst", maxAge: 12 * 60 * 60 * 1000 }, // 12 hours

  // Rarely changing data - long cache
  "/api/suppliers": { strategy: "cacheFirst", maxAge: 48 * 60 * 60 * 1000 }, // 48 hours
};

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
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== API_CACHE
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

// Enhanced fetch event - intelligent caching strategies for different data types
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  const url = new URL(event.request.url);

  // Handle API requests with intelligent caching
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(event.request));
});

// Handle API requests with different strategies
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const endpoint = findMatchingEndpoint(url.pathname);

  if (endpoint) {
    const strategy = API_CACHE_STRATEGIES[endpoint];

    if (strategy.strategy === "networkFirst") {
      return networkFirst(request, strategy.maxAge);
    } else if (strategy.strategy === "cacheFirst") {
      return cacheFirst(request, strategy.maxAge);
    }
  }

  // Default to network first for unknown API endpoints
  return networkFirst(request, 5 * 60 * 1000); // 5 minutes default
}

// Network first strategy - try network, fallback to cache
async function networkFirst(request, maxAge) {
  const cache = await caches.open(API_CACHE);

  try {
    console.log("[SW] Network first: fetching", request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response with timestamp
      const responseToCache = networkResponse.clone();
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: {
          ...Object.fromEntries(responseToCache.headers.entries()),
          "sw-cached-at": Date.now().toString(),
          "sw-max-age": maxAge.toString(),
        },
      });

      await cache.put(request, responseWithTimestamp);
      console.log("[SW] Cached API response:", request.url);

      return networkResponse;
    }
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", error);
  }

  // Try cache as fallback
  const cachedResponse = await cache.match(request);
  if (cachedResponse && !isExpired(cachedResponse)) {
    console.log("[SW] Serving from API cache:", request.url);
    return cachedResponse;
  }

  // Return error response if no cache available
  return new Response(
    JSON.stringify({
      error: "No network connection and no cached data available",
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Cache first strategy - try cache, fallback to network
async function cacheFirst(request, maxAge) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse)) {
    console.log("[SW] Cache first: serving from cache", request.url);

    // Update cache in background if close to expiry
    const cachedAt = parseInt(
      cachedResponse.headers.get("sw-cached-at") || "0"
    );
    const age = Date.now() - cachedAt;
    const refreshThreshold = maxAge * 0.75; // Refresh when 75% of max age reached

    if (age > refreshThreshold) {
      console.log("[SW] Background refresh triggered for", request.url);
      // Don't await this - let it run in background
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            const responseWithTimestamp = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: {
                ...Object.fromEntries(responseToCache.headers.entries()),
                "sw-cached-at": Date.now().toString(),
                "sw-max-age": maxAge.toString(),
              },
            });
            await cache.put(request, responseWithTimestamp);
          }
        })
        .catch((err) => console.log("[SW] Background refresh failed:", err));
    }

    return cachedResponse;
  }

  // Try network if no valid cache
  try {
    console.log("[SW] Cache first: fetching from network", request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: {
          ...Object.fromEntries(responseToCache.headers.entries()),
          "sw-cached-at": Date.now().toString(),
          "sw-max-age": maxAge.toString(),
        },
      });

      await cache.put(request, responseWithTimestamp);
      return networkResponse;
    }
  } catch (error) {
    console.log("[SW] Network failed:", error);
  }

  // Return error if both cache and network fail
  return new Response(
    JSON.stringify({
      error: "No network connection and no cached data available",
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Handle static requests (pages, assets)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log("[SW] Serving static from cache:", request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const url = request.url;

      // Cache static assets
      if (
        url.includes("/_next/static/") ||
        url.includes("/_next/image/") ||
        request.destination === "script" ||
        request.destination === "style" ||
        request.destination === "image"
      ) {
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, responseToCache);
        console.log("[SW] Cached static asset:", url);
      }
      // Cache pages
      else if (request.destination === "document") {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, responseToCache);
        console.log("[SW] Cached page:", url);
      }

      return networkResponse;
    }
  } catch (error) {
    console.log("[SW] Static request failed:", error);
  }

  // Offline fallbacks
  if (request.mode === "navigate" || request.destination === "document") {
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) {
      return offlinePage;
    }
  }

  if (request.destination === "image") {
    const logoFallback = await caches.match("/logo.png");
    if (logoFallback) {
      return logoFallback;
    }
  }

  // Return generic error
  return new Response("Offline", { status: 503 });
}

// Helper functions
function findMatchingEndpoint(pathname) {
  // Find exact match first
  if (API_CACHE_STRATEGIES[pathname]) {
    return pathname;
  }

  // Find pattern match
  for (const endpoint in API_CACHE_STRATEGIES) {
    if (pathname.startsWith(endpoint)) {
      return endpoint;
    }
  }

  return null;
}

function isExpired(response) {
  const cachedAt = parseInt(response.headers.get("sw-cached-at") || "0");
  const maxAge = parseInt(response.headers.get("sw-max-age") || "0");

  if (cachedAt === 0 || maxAge === 0) {
    return true; // Assume expired if no timestamp
  }

  return Date.now() - cachedAt > maxAge;
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle offline action queue synchronization
async function doBackgroundSync() {
  console.log("[SW] Background sync triggered");

  try {
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();

    if (offlineActions.length === 0) {
      console.log("[SW] No offline actions to sync");
      return;
    }

    console.log(`[SW] Syncing ${offlineActions.length} offline actions`);

    for (const action of offlineActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        if (response.ok) {
          console.log("[SW] Successfully synced action:", action.id);
          await removeOfflineAction(action.id);
        } else {
          console.error(
            "[SW] Failed to sync action:",
            action.id,
            response.status
          );
        }
      } catch (error) {
        console.error("[SW] Error syncing action:", action.id, error);
      }
    }

    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        synced: offlineActions.length,
      });
    });
  } catch (error) {
    console.error("[SW] Background sync failed:", error);
  }
}

// Helper functions for offline action management
async function getOfflineActions() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array as placeholder
  return [];
}

async function removeOfflineAction(actionId) {
  // In a real implementation, this would remove from IndexedDB
  console.log("[SW] Removing offline action:", actionId);
}

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

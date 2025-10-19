// Service Worker for Cardiac Delights PWA
// Modern, maintainable approach with clean separation of concerns

const VERSION = "v14";
const CACHE_NAMES = {
  static: `cardiac-delights-static-${VERSION}`,
  dynamic: `cardiac-delights-dynamic-${VERSION}`,
  api: `cardiac-delights-api-${VERSION}`,
};

// Configuration object for better maintainability
const CONFIG = {
  // Static assets to precache during install
  staticAssets: [
    "/",
    "/manifest.json",
    "/logo.png",
    "/logo2.png",
    "/Dashboard.png",
    "/Inventory.png",
    "/Menu.png",
    "/offline.html",
    "/favicon.ico",
    "/service-worker.js",
  ],

  // Critical pages for offline functionality
  criticalPages: [
    "/",
    "/resetPassword",
    "/Features/Dashboard",
    "/Features/Inventory",
    "/Features/Inventory/Master_Inventory",
    "/Features/Inventory/Today_Inventory",
    "/Features/Inventory/Surplus_Inventory",
    "/Features/Inventory/Spoilage_Inventory",
    "/Features/Inventory/Master_Inventory/View_Inventory",
    "/Features/Inventory/Today_Inventory/View_Today_Inventory",
    "/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory",
    "/Features/Inventory/Spoilage_Inventory/View_Spoilage_Inventory",
    "/Features/Report",
    "/Features/Report/Report_Sales",
    "/Features/Report/Report_Inventory",
    "/Features/Report/Report_UserActivity",
    "/Features/Menu",
    "/Features/Menu/View_Menu",
    "/Features/Supplier",
    "/Features/Supplier/View_Supplier",
    "/Features/Settings",
    "/Features/Settings/userManagement",
    "/Features/Settings/userManagement/View_Users",
    "/Features/Settings/notification",
    "/Features/Settings/inventory",
    "/Features/Settings/backup_restore",
  ],

  // Next.js patterns to skip (never cache development/HMR files)
  skipPatterns: [
    "/_next/webpack-hmr",
    "/__nextjs_original-stack-frames",
    "/__turbopack_",
    "[turbopack]",
  ],

  // API caching strategies
  apiStrategies: {
    // Fast-changing data: Network-first with short cache
    "/api/dashboard/stats": { strategy: "network-first", maxAge: 30 * 60 * 1000 },
    "/api/dashboard/low-stock": { strategy: "network-first", maxAge: 30 * 60 * 1000 },
    "/api/inventory": { strategy: "network-first", maxAge: 2 * 60 * 60 * 1000 },
    "/api/inventory-log": { strategy: "network-first", maxAge: 2 * 60 * 60 * 1000 },
    "/api/sales": { strategy: "network-first", maxAge: 60 * 60 * 1000 },
    "/api/sales-summary": { strategy: "network-first", maxAge: 60 * 60 * 1000 },
    "/api/notifications": { strategy: "network-first", maxAge: 60 * 60 * 1000 },
    "/api/user-activity": { strategy: "network-first", maxAge: 60 * 60 * 1000 },

    // Slow-changing data: Cache-first with longer cache
    "/api/menu": { strategy: "cache-first", maxAge: 24 * 60 * 60 * 1000 },
    "/api/menu/": { strategy: "cache-first", maxAge: 24 * 60 * 60 * 1000 }, // for dynamic menu endpoints
    "/api/users": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/users/": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 }, // for dynamic user endpoints
    "/api/suppliers": { strategy: "cache-first", maxAge: 48 * 60 * 60 * 1000 },
    "/api/suppliers/": { strategy: "cache-first", maxAge: 48 * 60 * 60 * 1000 }, // for dynamic supplier endpoints
    "/api/report": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/report/sales": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/report/inventory": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/report/user-activity": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/settings": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/settings/notification": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/settings/inventory": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
    "/api/settings/backup_restore": { strategy: "cache-first", maxAge: 12 * 60 * 60 * 1000 },
  },

  // Cache refresh threshold (75% of max age)
  refreshThreshold: 0.75,
};

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker", VERSION);

  event.waitUntil(
    caches
      .open(CACHE_NAMES.static)
      .then(async (cache) => {
        console.log("[SW] Caching static assets...");

        // Cache each asset individually to see which ones fail
        const results = await Promise.allSettled(
          CONFIG.staticAssets.map(async (url) => {
            try {
              await cache.add(url);
              console.log(`[SW] ✓ Cached: ${url}`);
              return { url, success: true };
            } catch (err) {
              console.error(`[SW] ✗ Failed to cache ${url}:`, err);
              return { url, success: false, error: err };
            }
          })
        );

        const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);
        if (failed.length > 0) {
          console.warn(`[SW] Failed to cache ${failed.length} assets`);
        }
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker", VERSION);

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !Object.values(CACHE_NAMES).includes(name))
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        )
      ),
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// ============================================================================
// FETCH EVENT HANDLER (Main Request Router)
// ============================================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Next.js development files
  if (shouldSkipRequest(url)) return;

  // Route to appropriate handler
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
  } else if (isAPIRequest(url) && request.method === "GET") {
    event.respondWith(handleAPIGet(request));
  } else if (isAPIRequest(url) && isMutationMethod(request.method)) {
    event.respondWith(handleAPIMutation(request));
  } else {
    event.respondWith(handleStatic(request));
  }
});

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

/**
 * Handle navigation requests (page loads)
 * Strategy: Network-first, fallback to cached page, then app shell
 */
async function handleNavigation(request) {
  const url = new URL(request.url);
  const isAppRoute = url.pathname.startsWith('/Features/') ||
                     url.pathname === '/privacy-policy' ||
                     url.pathname === '/pwa-debug';

  try {
    // Try network first for fresh content
    const response = await fetch(request);
    if (response.ok) {
      // Cache the page
      const cache = await caches.open(CACHE_NAMES.dynamic);
      await cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.log("[SW] Navigation network failed:", error.message);
  }

  // Offline fallback logic
  const cache = await caches.open(CACHE_NAMES.dynamic);

  // First, try to get the exact cached page
  const cached = await cache.match(request);
  if (cached) {
    console.log("[SW] Serving cached page:", url.pathname);
    return cached;
  }

  // For any /Features/* route (including dynamic subpages), always serve the app shell
  if (url.pathname.startsWith('/Features/')) {
    console.log("[SW] App shell fallback for /Features/* route:", url.pathname);
    // Try to get app shell from dynamic cache first
    let appShell = await cache.match("/");
    if (!appShell) {
      // If not in dynamic cache, try static cache
      const staticCache = await caches.open(CACHE_NAMES.static);
      appShell = await staticCache.match("/");
    }
    if (appShell) return appShell;
  }

  // Try to serve offline.html from static cache (for all routes as fallback)
  console.log("[SW] Trying to serve offline.html");
  const staticCache = await caches.open(CACHE_NAMES.static);
  const offlinePage = await staticCache.match("/offline.html");

  if (offlinePage) {
    console.log("[SW] ✓ Serving offline.html");
    return offlinePage;
  }

  console.warn("[SW] ✗ offline.html not found in cache");

  // Try app shell as backup
  console.log("[SW] Trying app shell as backup");
  let appShell = await cache.match("/");
  if (!appShell) {
    appShell = await staticCache.match("/");
  }
  if (appShell) {
    console.log("[SW] ✓ Serving app shell");
    return appShell;
  }

  // Absolute last resort: inline HTML (you should never see this)
  console.error("[SW] ⚠️ Using inline fallback - NO CACHE AVAILABLE!");
  return createOfflineFallback();
}

/**
 * Handle API GET requests
 * Strategy: Use configured strategy (network-first or cache-first)
 */
async function handleAPIGet(request) {
  const url = new URL(request.url);
  const endpoint = findMatchingEndpoint(url.pathname);
  const config = endpoint ? CONFIG.apiStrategies[endpoint] : null;

  if (config?.strategy === "cache-first") {
    return cacheFirst(request, config.maxAge);
  }

  // Default to network-first
  return networkFirst(request, config?.maxAge || 5 * 60 * 1000);
}

/**
 * Handle API mutations (POST, PUT, DELETE)
 * Strategy: Network-only with offline queueing
 */
async function handleAPIMutation(request) {
  try {
    const response = await fetch(request.clone());

    if (response.ok) {
      return response;
    }

    // Non-200 response - queue for retry
    await queueOfflineAction(request);
    return createMutationQueuedResponse(request.method);
  } catch (error) {
    // Network error - queue for retry
    await queueOfflineAction(request);
    return createMutationQueuedResponse(request.method);
  }
}

/**
 * Handle static assets (JS, CSS, images, fonts)
 * Strategy: Cache-first with network fallback
 */
async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);

    if (response.ok) {
      // Determine cache based on asset type
      const cacheName = isStaticAsset(request)
        ? CACHE_NAMES.static
        : CACHE_NAMES.dynamic;

      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      return response;
    }

    return response;
  } catch (error) {
    // Return placeholder for images
    if (request.destination === "image") {
      const logo = await caches.match("/logo.png");
      if (logo) return logo;
    }

    return new Response("Resource unavailable", { status: 503 });
  }
}

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Network-first strategy
 * Try network, fallback to cache if available
 */
async function networkFirst(request, maxAge) {
  const cache = await caches.open(CACHE_NAMES.api);

  try {
    const response = await fetch(request);

    if (response.ok) {
      // Cache with timestamp headers
      await cache.put(request, addCacheMetadata(response, maxAge));
      return response;
    }
  } catch (error) {
    console.log("[SW] Network-first failed, trying cache:", error.message);
  }

  // Fallback to cache
  const cached = await cache.match(request);
  if (cached && !isCacheExpired(cached)) {
    return cached;
  }

  return createAPIErrorResponse("No network and no valid cache");
}

/**
 * Cache-first strategy
 * Try cache, fallback to network, background refresh when stale
 */
async function cacheFirst(request, maxAge) {
  const cache = await caches.open(CACHE_NAMES.api);
  const cached = await cache.match(request);

  if (cached && !isCacheExpired(cached)) {
    // Check if we should background refresh
    const age = getCacheAge(cached);
    const threshold = maxAge * CONFIG.refreshThreshold;

    if (age > threshold) {
      // Background refresh (don't await)
      refreshCacheInBackground(request, cache, maxAge);
    }

    return cached;
  }

  // No valid cache - fetch from network
  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, addCacheMetadata(response, maxAge));
      return response;
    }
  } catch (error) {
    console.log("[SW] Cache-first network fallback failed:", error.message);
  }

  return createAPIErrorResponse("No valid cache and network failed");
}

/**
 * Background refresh for stale cache
 */
function refreshCacheInBackground(request, cache, maxAge) {
  fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, addCacheMetadata(response, maxAge));
        console.log("[SW] Background refresh complete:", request.url);
      }
    })
    .catch((err) => console.log("[SW] Background refresh failed:", err.message));
}

// ============================================================================
// OFFLINE QUEUE MANAGEMENT
// ============================================================================

/**
 * Queue failed mutations for background sync
 */
async function queueOfflineAction(request) {
  try {
    const body = await request.text();
    const action = {
      id: `${Date.now()}-${Math.random()}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    };

    // Store in IndexedDB would be better, but localStorage works for now
    const queue = getOfflineQueue();
    queue.push(action);
    saveOfflineQueue(queue);

    console.log("[SW] Queued offline action:", action.id);

    // Request background sync if available
    if ("sync" in self.registration) {
      await self.registration.sync.register("background-sync");
    }
  } catch (error) {
    console.error("[SW] Failed to queue offline action:", error);
  }
}

/**
 * Background sync event handler
 */
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(syncOfflineQueue());
  }
});

/**
 * Sync queued offline actions
 */
async function syncOfflineQueue() {
  const queue = getOfflineQueue();

  if (queue.length === 0) {
    console.log("[SW] No offline actions to sync");
    return;
  }

  console.log(`[SW] Syncing ${queue.length} offline actions`);
  const results = [];

  for (const action of queue) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body,
      });

      if (response.ok) {
        console.log("[SW] Synced action:", action.id);
        removeFromQueue(action.id);
        results.push({ id: action.id, status: "success" });
      } else {
        console.error("[SW] Failed to sync:", action.id, response.status);
        results.push({ id: action.id, status: "failed", error: response.status });
      }
    } catch (error) {
      console.error("[SW] Sync error:", action.id, error.message);
      results.push({ id: action.id, status: "error", error: error.message });
    }
  }

  // Notify clients
  notifyClients({
    type: "SYNC_COMPLETE",
    synced: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status !== "success").length,
  });
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

self.addEventListener("message", async (event) => {
  const { data } = event;

  switch (data?.type) {
    case "CACHE_CRITICAL_ASSETS":
      await cacheCriticalAssets();
      break;

    case "SET_OFFLINE_TEST_MODE":
      self.offlineTestMode = data.enabled;
      console.log("[SW] Offline test mode:", data.enabled ? "ENABLED" : "DISABLED");
      event.ports[0]?.postMessage({ success: true, offlineTestMode: self.offlineTestMode });
      break;

    case "GET_OFFLINE_TEST_MODE":
      event.ports[0]?.postMessage({ offlineTestMode: self.offlineTestMode || false });
      break;
  }
});

/**
 * Aggressively cache critical assets for offline use
 */
async function cacheCriticalAssets() {
  console.log("[SW] Caching critical assets...");

  const allAssets = [
    ...CONFIG.staticAssets,
    ...CONFIG.criticalPages,
  ];

  const cache = await caches.open(CACHE_NAMES.static);
  const results = await Promise.allSettled(
    allAssets.map((url) => cache.add(url))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  console.log(`[SW] Cached ${succeeded}/${allAssets.length} critical assets`);

  notifyClients({
    type: "CACHE_COMPLETE",
    cached: succeeded,
    total: allAssets.length,
  });
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener("push", (event) => {
  const title = "Cardiac Delights";
  const options = {
    body: event.data?.text() || "New notification",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "cardiac-delights-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function shouldSkipRequest(url) {
  return CONFIG.skipPatterns.some((pattern) => url.pathname.includes(pattern));
}

function isAPIRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isMutationMethod(method) {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method);
}

function isStaticAsset(request) {
  const url = request.url;
  return (
    url.includes("/_next/static/") ||
    url.includes("/_next/image/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  );
}

function findMatchingEndpoint(pathname) {
  // Exact match
  if (CONFIG.apiStrategies[pathname]) return pathname;

  // Prefix match
  for (const endpoint in CONFIG.apiStrategies) {
    if (pathname.startsWith(endpoint)) return endpoint;
  }

  return null;
}

function addCacheMetadata(response, maxAge) {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      "sw-cached-at": Date.now().toString(),
      "sw-max-age": maxAge.toString(),
    },
  });
}

function isCacheExpired(response) {
  const cachedAt = parseInt(response.headers.get("sw-cached-at") || "0");
  const maxAge = parseInt(response.headers.get("sw-max-age") || "0");

  if (!cachedAt || !maxAge) return true;

  return Date.now() - cachedAt > maxAge;
}

function getCacheAge(response) {
  const cachedAt = parseInt(response.headers.get("sw-cached-at") || "0");
  return Date.now() - cachedAt;
}

function createOfflineFallback() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Cardiac Delights - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container { text-align: center; max-width: 500px; padding: 2rem; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        p { opacity: 0.9; margin-bottom: 2rem; }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 2rem;
          cursor: pointer;
          margin: 0.5rem;
          transition: transform 0.2s;
        }
        button:hover { transform: scale(1.05); }
        .secondary {
          background: transparent;
          border: 2px solid white;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❤️</div>
        <h1>You're Offline</h1>
        <p>Check your internet connection and try again.</p>
        <button onclick="location.reload()">Retry</button>
        <button class="secondary" onclick="location.href='/'">Go Home</button>
      </div>
    </body>
    </html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}

function createMutationQueuedResponse(method) {
  const messages = {
    POST: "Created offline - will sync when online",
    PUT: "Updated offline - will sync when online",
    DELETE: "Deleted offline - will sync when online",
    PATCH: "Modified offline - will sync when online",
  };

  return new Response(
    JSON.stringify({
      success: true,
      offline: true,
      message: messages[method] || "Queued offline - will sync when online",
      queued: true,
      timestamp: Date.now(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

function createAPIErrorResponse(message) {
  return new Response(
    JSON.stringify({ error: message, offline: true }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Offline queue helpers (using localStorage for simplicity)

// Offline queue helpers using IndexedDB (service worker compatible)
const OFFLINE_DB_NAME = "cardiac_delights_offline_db";
const OFFLINE_STORE_NAME = "offline_queue";

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getOfflineQueue() {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, "readonly");
    const store = tx.objectStore(OFFLINE_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

async function saveOfflineQueue(queue) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, "readwrite");
    const store = tx.objectStore(OFFLINE_STORE_NAME);
    // Clear store first
    const clearReq = store.clear();
    clearReq.onsuccess = () => {
      // Add all items
      Promise.all(queue.map(action => {
        return new Promise((res, rej) => {
          const addReq = store.add(action);
          addReq.onsuccess = () => res();
          addReq.onerror = () => res();
        });
      })).then(() => resolve()).catch(() => resolve());
    };
    clearReq.onerror = () => resolve();
  });
}

async function removeFromQueue(id) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, "readwrite");
    const store = tx.objectStore(OFFLINE_STORE_NAME);
    const delReq = store.delete(id);
    delReq.onsuccess = () => resolve();
    delReq.onerror = () => resolve();
  });
}

async function notifyClients(message) {
  const clientsList = await clients.matchAll();
  clientsList.forEach((client) => client.postMessage(message));
}

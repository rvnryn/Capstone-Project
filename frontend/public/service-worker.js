const CACHE_NAME = "cardiac-delights-v8";
const STATIC_CACHE = "cardiac-delights-static-v8";
const DYNAMIC_CACHE = "cardiac-delights-dynamic-v8";
const API_CACHE = "cardiac-delights-api-v8";

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
  // Inventory features
  "/Features/Inventory",
  "/Features/Inventory/Master_Inventory",
  "/Features/Inventory/Master_Inventory/Add_Inventory",
  "/Features/Inventory/Master_Inventory/Update_Inventory",
  "/Features/Inventory/Master_Inventory/View_Inventory",
  "/Features/Inventory/Surplus_Inventory",
  "/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory",
  "/Features/Inventory/Today_Inventory",
  "/Features/Inventory/Today_Inventory/Update_Today_Inventory",
  "/Features/Inventory/Today_Inventory/View_Today_Inventory",
  // Menu features
  "/offline.html",
  "/Features/Menu",
  "/Features/Menu/Add_Menu",
  "/Features/Menu/Update_Menu",
  "/Features/Menu/View_Menu",
  // Report features
  "/Features/Report",
  "/Features/Report/Report_Inventory",
  "/Features/Report/Report_Sales",
  "/Features/Report/Report_UserActivity",
  // Settings features
  "/Features/Settings",
  "/Features/Settings/backup_restore",
  "/Features/Settings/inventory",
  "/Features/Settings/notification",
  "/Features/Settings/userManagement",
  "/Features/Settings/userManagement/Add_Users",
  "/Features/Settings/userManagement/Update_Users",
  "/Features/Settings/userManagement/View_Users",
  // Supplier features
  "/Features/Supplier",
  "/Features/Supplier/Add_Supplier",
  "/Features/Supplier/Update_Supplier",
  "/Features/Supplier/View_Supplier",
  // Dashboard components
  "/Features/Dashboard",
  // Reset password
  "/resetPassword",
  // Static assets
  "/manifest.json",
  "/logo.png",
  "/Dashboard.png",
  "/Inventory.png",
  "/Menu.png",
  // REMOVED: "/offline.html" - No more offline page caching
  "/offline-test-utils.js",
];

// Static assets that should be cached immediately
const STATIC_ASSETS = [
  "/manifest.json",
  "/logo.png",
  "/Dashboard.png",
  "/Inventory.png",
  "/Menu.png",
  // REMOVED: "/offline.html" - No offline page fallback
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    Promise.all([
      // Skip caching pages during install in development mode
      // They don't exist as static files - will be cached on-demand
      caches.open(CACHE_NAME).then(() => {
        console.log("[SW] Cache created (pages will be cached on-demand)");
        return Promise.resolve();
      }),
      // Cache static assets only (images, manifest)
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn("[SW] Some static assets failed to cache:", err);
          return Promise.resolve(); // Don't fail install if some assets fail
        });
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
  const url = new URL(event.request.url);

  // CRITICAL: Skip service worker for Next.js development files
  // These are dynamically generated and should NEVER be cached in dev mode
  if (url.pathname.includes("/_next/static/chunks/") ||
      url.pathname.includes("/_next/static/development/") ||
      url.pathname.includes("/_next/webpack-hmr") ||
      url.pathname.includes("/__nextjs_original-stack-frames") ||
      url.pathname.includes("/__turbopack_") ||
      url.pathname.includes("[turbopack]")) {
    // Let browser handle these directly - do NOT intercept
    return;
  }

  // Handle navigation requests (pages)
  if (event.request.method === "GET" && event.request.mode === "navigate") {
    event.respondWith(handleNavigationWithoutOfflinePage(event.request));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    // Check if offline test mode is enabled
    if (self.offlineTestMode) {
      event.respondWith(handleOfflineAPIRequest(event.request));
      return;
    }

    // Handle mutations (POST, PUT, DELETE)
    if (event.request.method !== "GET") {
      event.respondWith(handleMutationRequest(event.request));
      return;
    }

    // Handle GET API requests with caching strategies
    event.respondWith(handleAPIRequest(event.request));
    return;
  }

  // Handle static assets (JS, CSS, images, fonts, etc.)
  event.respondWith(handleStaticRequest(event.request));
});

// New function to handle navigation requests (always allow)
async function handleNavigationRequest(request) {
  const url = new URL(request.url);

  console.log("[SW] Handling navigation request:", url.pathname);

  // Always try network first for navigation to ensure fresh content
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      console.log("[SW] Navigation network success:", request.url);
      // Cache the page for offline use
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log("[SW] Navigation network failed, trying cache:", error);
  }

  // Try to serve from cache if network fails
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log("[SW] Serving navigation from cache:", request.url);
    return cachedResponse;
  }

  // For Next.js app routes, try to serve the main app shell
  if (
    url.pathname.startsWith("/Features/") ||
    url.pathname === "/dashboard" ||
    url.pathname === "/inventory" ||
    url.pathname === "/menu" ||
    url.pathname === "/report" ||
    url.pathname === "/supplier" ||
    url.pathname === "/settings"
  ) {
    const appShell = await caches.match("/");
    if (appShell) {
      console.log("[SW] Serving app shell for route:", url.pathname);
      return appShell;
    }
  }

  // Return a minimal HTML page instead of offline.html for navigation
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Loading...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h2>Loading Cardiac Delights...</h2>
          <p>Please check your connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </div>
    </body>
    </html>
  `,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}

// New function to handle navigation WITHOUT showing offline page
async function handleNavigationWithoutOfflinePage(request) {
  const url = new URL(request.url);

  console.log("[SW] Navigation request (no offline page):", url.pathname);

  // Always try network first for fresh content
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      console.log("[SW] Navigation network success:", request.url);

      // CRITICAL FIX: Always fetch and cache root page as app shell on ANY navigation
      // This ensures the app shell is available for offline routing
      const cache = await caches.open(CACHE_NAME);

      try {
        // Fetch and cache the root page (app shell) for offline use
        const rootUrl = new URL("/", request.url);
        const rootResponse = await fetch(rootUrl);
        if (rootResponse.ok) {
          await cache.put("/", rootResponse.clone());
          console.log("[SW] ✅ Cached root page as app shell (from", url.pathname, ")");
        }
      } catch (err) {
        console.warn("[SW] Failed to cache root page:", err);
      }

      return networkResponse;
    }
  } catch (error) {
    console.log("[SW] Navigation network failed, trying cache:", error);
  }

  // For Next.js App Router - ALWAYS serve the app shell (root page)
  // This allows client-side routing to work offline
  console.log("[SW] Offline - serving app shell for:", url.pathname);
  const appShell = await caches.match("/");
  if (appShell) {
    console.log("[SW] App shell found, serving for:", url.pathname);
    return appShell;
  }

  // NEVER return offline.html - return a minimal loading page that works
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cardiac Delights</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          margin: 0; 
          background: #1a1a1a; 
          color: white; 
        }
        .loading { text-align: center; }
      </style>
    </head>
    <body>
      <div class="loading">
        <h2>Loading Cardiac Delights...</h2>
        <p>Connecting...</p>
        <script>
          // Try to reload every 3 seconds until successful
          setTimeout(() => window.location.reload(), 3000);
        </script>
      </div>
    </body>
    </html>
  `,
    {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }
  );
}

// New function to handle mutation requests (POST, PUT, DELETE) with offline queueing
async function handleMutationRequest(request) {
  const url = new URL(request.url);

  // Only handle API mutations
  if (!url.pathname.startsWith("/api/")) {
    // Let non-API mutations pass through normally
    return fetch(request);
  }

  console.log("[SW] Handling mutation request:", request.method, url.pathname);

  try {
    // Try to send the request immediately
    const response = await fetch(request.clone());

    if (response.ok) {
      console.log("[SW] Mutation successful:", request.method, url.pathname);
      return response;
    } else {
      console.log("[SW] Mutation failed, queueing for sync:", response.status);
      // Queue for background sync
      await queueOfflineAction(request);
      return createMutationOfflineResponse(request);
    }
  } catch (error) {
    console.log("[SW] Mutation network error, queueing for sync:", error);
    // Queue for background sync
    await queueOfflineAction(request);
    return createMutationOfflineResponse(request);
  }
}

// Queue offline actions for background sync
async function queueOfflineAction(request) {
  try {
    const body = await request.text();
    const action = {
      id: Date.now() + Math.random(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: Date.now(),
    };

    // Store in localStorage for now (could upgrade to IndexedDB)
    const existingActions = JSON.parse(
      localStorage.getItem("offline_actions") || "[]"
    );
    existingActions.push(action);
    localStorage.setItem("offline_actions", JSON.stringify(existingActions));

    console.log("[SW] Queued offline action:", action.id);

    // Request background sync
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      self.registration.sync.register("background-sync");
    }
  } catch (error) {
    console.error("[SW] Error queueing offline action:", error);
  }
}

// Create response for offline mutations
function createMutationOfflineResponse(request) {
  const method = request.method;
  const message =
    method === "POST"
      ? "Created offline - will sync when online"
      : method === "PUT"
      ? "Updated offline - will sync when online"
      : method === "DELETE"
      ? "Deleted offline - will sync when online"
      : "Action queued offline - will sync when online";

  return new Response(
    JSON.stringify({
      success: true,
      offline: true,
      message: message,
      queued: true,
      timestamp: Date.now(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// New function to handle API requests in offline test mode
async function handleOfflineAPIRequest(request) {
  console.log("[SW] Offline test mode: blocking API request", request.url);

  // Try to serve from cache first
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse)) {
    console.log(
      "[SW] Serving cached API response (offline mode):",
      request.url
    );
    return cachedResponse;
  }

  // Return offline response with cached data structure
  return new Response(
    JSON.stringify({
      error: "Offline test mode - API blocked",
      offline: true,
      cached: false,
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}

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

  // NEVER serve offline.html - always return network error or minimal fallback
  if (request.mode === "navigate" || request.destination === "document") {
    // Return a basic loading page instead of offline.html
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cardiac Delights</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif; background: #1a1a1a; color: white;">
          <div style="text-align: center;">
            <h2>Loading...</h2>
            <script>setTimeout(() => window.location.reload(), 2000);</script>
          </div>
        </div>
      </body>
      </html>
    `,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  }

  if (request.destination === "image") {
    const logoFallback = await caches.match("/logo.png");
    if (logoFallback) {
      return logoFallback;
    }
  }

  // Return generic error for other requests
  return new Response("Resource unavailable", { status: 503 });
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
    // Get offline actions from localStorage
    const offlineActions = await getOfflineActions();

    if (offlineActions.length === 0) {
      console.log("[SW] No offline actions to sync");
      return;
    }

    console.log(`[SW] Syncing ${offlineActions.length} offline actions`);

    const syncResults = [];

    for (const action of offlineActions) {
      try {
        console.log(`[SW] Syncing action: ${action.method} ${action.url}`);

        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        if (response.ok) {
          console.log("[SW] Successfully synced action:", action.id);
          await removeOfflineAction(action.id);
          syncResults.push({ action: action.id, status: "success" });
        } else {
          console.error(
            "[SW] Failed to sync action:",
            action.id,
            response.status
          );
          syncResults.push({
            action: action.id,
            status: "failed",
            error: response.status,
          });
        }
      } catch (error) {
        console.error("[SW] Error syncing action:", action.id, error);
        syncResults.push({
          action: action.id,
          status: "error",
          error: error.message,
        });
      }
    }

    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        synced: syncResults.filter((r) => r.status === "success").length,
        failed: syncResults.filter((r) => r.status !== "success").length,
        results: syncResults,
      });
    });
  } catch (error) {
    console.error("[SW] Background sync failed:", error);
  }
}

// Helper functions for offline action management
async function getOfflineActions() {
  try {
    const actions = localStorage.getItem("offline_actions");
    return actions ? JSON.parse(actions) : [];
  } catch (error) {
    console.error("[SW] Error getting offline actions:", error);
    return [];
  }
}

async function removeOfflineAction(actionId) {
  try {
    const actions = await getOfflineActions();
    const filteredActions = actions.filter((action) => action.id !== actionId);
    localStorage.setItem("offline_actions", JSON.stringify(filteredActions));
    console.log("[SW] Removed offline action:", actionId);
  } catch (error) {
    console.error("[SW] Error removing offline action:", error);
  }
}

// Message handler for controlling offline test mode
self.addEventListener("message", (event) => {
  // DISABLED: CACHE_CRITICAL_ASSETS causes errors in Next.js dev mode
  // Using App Shell model instead - only root page is cached
  if (event.data && event.data.type === "CACHE_CRITICAL_ASSETS") {
    console.log("[SW] CACHE_CRITICAL_ASSETS disabled - using App Shell model");
    // Notify clients immediately that we're not caching (App Shell handles it)
    self.clients.matchAll().then((clientsList) => {
      clientsList.forEach((client) => {
        client.postMessage({ type: "CACHE_COMPLETE", cached: 0, appShell: true });
      });
    });
    return;
  }
  if (event.data && event.data.type === "SET_OFFLINE_TEST_MODE") {
    self.offlineTestMode = event.data.enabled;
    console.log(
      "[SW] Offline test mode:",
      self.offlineTestMode ? "ENABLED" : "DISABLED"
    );

    // Notify client of the change
    event.ports[0].postMessage({
      success: true,
      offlineTestMode: self.offlineTestMode,
    });
  }

  if (event.data && event.data.type === "GET_OFFLINE_TEST_MODE") {
    event.ports[0].postMessage({
      offlineTestMode: self.offlineTestMode || false,
    });
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

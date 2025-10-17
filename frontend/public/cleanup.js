// Immediate cleanup script - paste in browser console
(async function () {
  console.log("🧹 Cleaning up service worker...");

  try {
    // Remove all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log("✅ Removed:", registration.scope);
    }

    // Clear problematic caches
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      if (cacheName.includes("cardiac-delights")) {
        await caches.delete(cacheName);
        console.log("🗑️ Cleared cache:", cacheName);
      }
    }

    console.log("✅ Cleanup complete! Refreshing...");

    // Refresh without cache
    window.location.reload(true);
  } catch (error) {
    console.error("Cleanup error:", error);
    // Force refresh anyway
    window.location.reload(true);
  }
})();

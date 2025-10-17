// Force update service worker
(async function () {
  console.log("Forcing service worker update...");

  if ("serviceWorker" in navigator) {
    try {
      // Get all registrations
      const registrations = await navigator.serviceWorker.getRegistrations();

      // Unregister all existing service workers
      for (let registration of registrations) {
        await registration.unregister();
        console.log("Unregistered service worker:", registration.scope);
      }

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Register the new service worker
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js"
      );
      console.log("New service worker registered:", registration.scope);

      // Wait for it to activate
      await new Promise((resolve) => {
        if (registration.active) {
          resolve();
        } else {
          registration.addEventListener("statechange", () => {
            if (registration.active) {
              resolve();
            }
          });
        }
      });

      console.log("Service worker is now active");
      alert("Service worker updated! Please refresh the page.");
    } catch (error) {
      console.error("Error updating service worker:", error);
      alert("Error updating service worker: " + error.message);
    }
  } else {
    alert("Service workers not supported in this browser");
  }
})();

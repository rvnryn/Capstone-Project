// Offline Testing Utility Functions
// Add these to your browser console to control offline mode

// Enable offline test mode (blocks API calls, allows navigation)
window.enableOfflineTestMode = async function () {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();

    return new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        console.log(
          "✅ Offline test mode ENABLED - API calls will be blocked, navigation works"
        );
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: "SET_OFFLINE_TEST_MODE", enabled: true },
        [messageChannel.port2]
      );
    });
  } else {
    console.log("❌ Service worker not available");
  }
};

// Disable offline test mode (normal operation)
window.disableOfflineTestMode = async function () {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();

    return new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        console.log(
          "✅ Offline test mode DISABLED - normal operation restored"
        );
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: "SET_OFFLINE_TEST_MODE", enabled: false },
        [messageChannel.port2]
      );
    });
  } else {
    console.log("❌ Service worker not available");
  }
};

// Check current offline test mode status
window.getOfflineTestMode = async function () {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();

    return new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        const status = event.data.offlineTestMode ? "ENABLED" : "DISABLED";
        console.log(`🔍 Offline test mode status: ${status}`);
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: "GET_OFFLINE_TEST_MODE" },
        [messageChannel.port2]
      );
    });
  } else {
    console.log("❌ Service worker not available");
  }
};

// Auto-load these functions when script is loaded
console.log(`
🚀 Offline Testing Utils Loaded!

Available commands:
• enableOfflineTestMode()  - Block API calls, allow navigation
• disableOfflineTestMode() - Restore normal operation  
• getOfflineTestMode()     - Check current status

Usage example:
> await enableOfflineTestMode()
> // Test your offline functionality
> await disableOfflineTestMode()
`);

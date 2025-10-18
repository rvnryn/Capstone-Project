// PWA Utilities for Cardiac Delights

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Check if app is running as PWA
export const isPWA = (): boolean => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes("android-app://")
  );
};

// Check if device supports PWA installation
export const canInstallPWA = (): boolean => {
  if (typeof window === "undefined") return false;

  return "serviceWorker" in navigator && "PushManager" in window;
};

// Install PWA prompt handler
export class PWAInstaller {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private installed = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.setupInstallPrompt();
    }
  }

  private setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener(
      "beforeinstallprompt",
      (e) => {
        // Prevent the mini-infobar from appearing on mobile
        try {
          e.preventDefault();
        } catch (err) {
          /* some browsers may throw if preventDefault is not allowed */
        }

        // Stash the event so it can be triggered later
        this.deferredPrompt = e as any;
        // Also expose on window as a fallback in case modules loaded in different orders
        try {
          (window as any).deferredInstallPrompt = e;
        } catch (err) {
          // ignore
        }

        console.log("Install prompt captured and ready", this.deferredPrompt);
      },
      true
    );

    // Listen for app installation
    window.addEventListener("appinstalled", () => {
      this.installed = true;
      this.deferredPrompt = null;
      console.log("PWA installed successfully");
    });
  }


  async install(): Promise<boolean> {
    // Prefer the captured prompt on the instance, but fall back to a window-level prompt
    const promptCandidate = this.deferredPrompt || (window as any).deferredInstallPrompt;
    if (!promptCandidate) return false;

    try {
      await promptCandidate.prompt();
      const choice = await promptCandidate.userChoice;
      const outcome = choice && choice.outcome ? choice.outcome : (choice as any);

      if (outcome === "accepted") {
        this.installed = true;
        localStorage.setItem("pwa-installed", "true");
        this.deferredPrompt = null;
        try {
          (window as any).deferredInstallPrompt = null;
        } catch (err) {}
        return true;
      }
    } catch (error) {
      console.error("PWA installation failed:", error);
    }

    return false;
  }

  canInstall(): boolean {
    // Consider either the internal deferred prompt or the window fallback.
    const hasPrompt = (!!this.deferredPrompt || !!(window as any).deferredInstallPrompt) && !this.installed;
    // Removed excessive logging - only log when state changes
    return hasPrompt;
  }

  isInstalled(): boolean {
    // Check persistent install state
    if (typeof window !== "undefined") {
      if (localStorage.getItem("pwa-installed") === "true") return true;
    }
    return this.installed || isPWA();
  }
}

// Online/Offline status
export class NetworkStatus {
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.notifyListeners(true));
      window.addEventListener("offline", () => this.notifyListeners(false));
    }
  }

  isOnline(): boolean {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  }

  addListener(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (isOnline: boolean) => void) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach((listener) => listener(isOnline));
  }
}

// Background sync for offline actions
export class OfflineQueue {
  private queue: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }> = [];

  addAction(action: string, data: any): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.queue.push({
      id,
      action,
      data,
      timestamp: Date.now(),
    });

    // Store in localStorage for persistence
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pwa-offline-queue", JSON.stringify(this.queue));
    }

    // Try to register background sync
    this.registerBackgroundSync();

    return id;
  }

  private async registerBackgroundSync() {
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Type assertion for background sync API
        await (registration as any).sync.register("background-sync");
      } catch (error) {
        console.warn("Background sync not supported:", error);
      }
    }
  }

  getQueue() {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("pwa-offline-queue");
    }
  }
}

// Push notifications
export class PushNotifications {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error("Service worker not ready:", error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return "denied";
    }

    return await Notification.requestPermission();
  }

  async subscribe(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) return null;

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          vapidPublicKey
        ) as BufferSource,
      });

      return subscription;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instances
export const pwaInstaller = new PWAInstaller();
export const networkStatus = new NetworkStatus();
export const offlineQueue = new OfflineQueue();
export const pushNotifications = new PushNotifications();

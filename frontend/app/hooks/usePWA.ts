"use client";

import { useState, useEffect, useCallback } from "react";

// PWA Hook - For installation and app features (NO offline data functionality)
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if running as installed PWA
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return {
    isOnline,
    isInstalled,
    canInstall: !!deferredPrompt,
    deferredPrompt,
  };
}

// Hook for install prompt UI
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    }

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("📱 beforeinstallprompt event captured");
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      console.log("📱 App was installed");
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn("Install prompt not available");
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("✅ User accepted the install prompt");
        setShowPrompt(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log("❌ User dismissed the install prompt");
        return false;
      }
    } catch (error) {
      console.error("Error during install:", error);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
    localStorage.setItem("pwa-install-dismissed-time", Date.now().toString());
  }, []);

  return {
    showPrompt,
    handleInstall,
    dismissPrompt,
    canInstall: !!deferredPrompt,
    isInstalled,
  };
}

// Simple hook for offline queue (NO-OP - offline functionality removed)
export function useOfflineQueue() {
  // Return empty functions to maintain compatibility
  return {
    addOfflineAction: () => {},
    getOfflineActions: () => [],
    syncWhenOnline: () => Promise.resolve(),
  };
}

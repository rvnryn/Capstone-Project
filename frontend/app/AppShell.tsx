"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/app/context/AuthContext";
import { NetworkStatusIndicator } from "@/app/components/PWA/PWAComponents";
import PWAInstallBanner from "@/app/components/PWA/PWAInstallBanner";
import PWAInstallPrompt from "@/app/components/PWAInstallPrompt";
import { DataPreloader } from "@/app/components/DataPreloader";
import { PagePreloader } from "@/app/components/PagePreloader";
import { ToastContainer } from "react-toastify";
import React, { useEffect } from "react";
import { GlobalLoadingProvider } from "@/app/context/GlobalLoadingContext";
import { GlobalLoadingOverlay } from "@/app/components/GlobalLoadingOverlay";
// @ts-ignore - missing type declarations for CSS side-effect import
import "react-toastify/dist/ReactToastify.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    setMounted(true);
    // Store install prompt globally for custom banner
    let deferredPrompt: any = null;
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log("Install prompt intercepted by AppShell");
      (window as any).deferredInstallPrompt = deferredPrompt;
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    const hideBrowserInstallBanners = () => {
      const browserBannerSelectors = [
        ".ms-appx-web-install-banner",
        ".browser-install-prompt",
        '[style*="background-color: rgb(66, 133, 244)"]',
        '[style*="background-color: #4285f4"]',
        '[style*="background: rgb(66, 133, 244)"]',
        '[style*="background: #4285f4"]',
        '[class*="blue"][class*="banner"]:not([class*="custom"])',
      ];
      browserBannerSelectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            if (!el.classList.contains("custom-pwa-banner")) {
              const htmlEl = el as HTMLElement;
              htmlEl.style.cssText =
                "display: none !important; visibility: hidden !important;";
              htmlEl.remove();
            }
          });
        } catch {}
      });
    };
    hideBrowserInstallBanners();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", hideBrowserInstallBanners);
    } else {
      hideBrowserInstallBanners();
    }
    const intervalId = setInterval(hideBrowserInstallBanners, 1000);

    // Register minimal service worker (only for offline page fallback)
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("✅ Minimal SW registered for offline fallback:", registration);
          })
          .catch((error) => {
            console.log("❌ SW registration failed:", error);
          });
      });
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);
  if (!mounted) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoadingProvider>
        <AuthProvider>
            <DataPreloader />
            <PagePreloader />
            <GlobalLoadingOverlay />
            {children}
            <PWAInstallBanner />
            <PWAInstallPrompt />
            <NetworkStatusIndicator />
            <ToastContainer />
        </AuthProvider>
      </GlobalLoadingProvider>
    </QueryClientProvider>
  );
}

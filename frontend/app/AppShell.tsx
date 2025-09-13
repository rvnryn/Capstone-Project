"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/app/context/AuthContext";
import {
  PWAInstallBanner,
  NetworkStatusIndicator,
} from "@/app/components/PWA/PWAComponents";
import { ToastContainer } from "react-toastify";
import {useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();


  useEffect(() => {
    const preventInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log(
        "Browser install prompt prevented - using custom banner instead"
      );
      return false;
    };

    window.addEventListener("beforeinstallprompt", preventInstallPrompt, true);

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

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener(
        "beforeinstallprompt",
        preventInstallPrompt,
        true
      );
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <PWAInstallBanner />
        <NetworkStatusIndicator />
        <ToastContainer />
      </AuthProvider>
    </QueryClientProvider>
  );
}

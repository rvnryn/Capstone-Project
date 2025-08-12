"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./Styles/globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/app/context/AuthContext";
import {
  PWAInstallBanner,
  NetworkStatusIndicator,
} from "@/app/components/PWA/PWAComponents";
import { useState } from "react";
import NavigationBar from "@/app/components/navigation/navigation";
import { useNavigation } from "@/app/components/navigation/hook/use-navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
  const [loading, setLoading] = useState(false);
  const { isMenuOpen, screenSize, deviceType } = useNavigation();

  // Immediately prevent browser install banners - runs before page load
  if (typeof window !== "undefined") {
    // Prevent install prompts as early as possible
    const preventInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log(
        "Browser install prompt prevented - using custom banner instead"
      );
      return false;
    };

    // Add listeners immediately
    window.addEventListener("beforeinstallprompt", preventInstallPrompt, true);

    // Force hide ONLY browser banners, NOT our custom banner
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
            // Only hide if it's NOT our custom banner
            if (!el.classList.contains("custom-pwa-banner")) {
              const htmlEl = el as HTMLElement;
              htmlEl.style.cssText =
                "display: none !important; visibility: hidden !important;";
              htmlEl.remove();
            }
          });
        } catch (e) {
          // Ignore errors
        }
      });
    };

    // Run immediately
    hideBrowserInstallBanners();

    // Run on DOM ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", hideBrowserInstallBanners);
    } else {
      hideBrowserInstallBanners();
    }

    // Keep running but less frequently
    setInterval(hideBrowserInstallBanners, 1000); // Register service worker
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
  }

  // Calculate sidebar width (match your navigation logic)
  const getSidebarWidth = () => {
    if (deviceType === "mobile") return 0;
    if (screenSize === "md") return isMenuOpen ? 256 : 64; // 16rem/4rem
    if (screenSize === "lg") return isMenuOpen ? 288 : 64; // 18rem/4rem
    if (screenSize === "xl" || screenSize === "2xl" || screenSize === "3xl")
      return isMenuOpen ? 320 : 64; // 20rem/4rem
    return isMenuOpen ? 288 : 64;
  };

  const sidebarWidth = getSidebarWidth();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fbbf24" />

        {/* Critical CSS to immediately hide ONLY browser install banners */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Hide ONLY browser install banners, not our custom banner */
            .ms-appx-web-install-banner,
            .browser-install-prompt,
            [style*="background-color: rgb(66, 133, 244)"],
            [style*="background-color: #4285f4"],
            [style*="background: rgb(66, 133, 244)"],
            [style*="background: #4285f4"] {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Allow our custom banner to show */
            .custom-pwa-banner {
              display: block !important;
              visibility: visible !important;
            }
          `,
          }}
        />

        {/* Explicitly disable browser install prompts */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="disable-web-app-install-banner" content="true" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo2.png" />

        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Cardiac Delights" />
        <link rel="apple-touch-icon" href="/logo2.png" />

        {/* Suppress browser install prompts */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />

        {/* Windows PWA */}
        <meta name="msapplication-TileColor" content="#fbbf24" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Security and Performance */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />

        {/* PWA Description */}
        <meta
          name="description"
          content="A modern, responsive dashboard and management PWA for Cardiac Delights with offline capabilities."
        />
        <meta
          name="keywords"
          content="PWA, dashboard, management, cardiac delights, offline, mobile app"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
            <PWAInstallBanner />
            <NetworkStatusIndicator />
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

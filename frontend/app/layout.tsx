import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore - allow importing global CSS with no type declarations
import "./Styles/globals.css";
import AppShell from "./AppShell";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cardiac Delights - Restaurant Management",
    template: "%s | Cardiac Delights",
  },
  description:
    "A modern, responsive dashboard and management PWA for Cardiac Delights with offline capabilities, inventory management, menu planning, and comprehensive reporting.",
  keywords: [
    "PWA",
    "dashboard",
    "management",
    "cardiac delights",
    "offline",
    "mobile app",
    "restaurant",
    "inventory",
    "menu",
    "reports",
    "POS",
  ],
  authors: [{ name: "Cardiac Delights Team" }],
  creator: "Cardiac Delights",
  publisher: "Cardiac Delights",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  applicationName: "Cardiac Delights",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "0f0feb73e946e066",
  },
  category: "food",
  classification: "Business Application",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Fallback viewport for compatibility */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  {/* Enhanced PWA Meta Tags */}
  {/* Vendor-prefixed theme colors for legacy browsers */}
  <meta name="theme-color" content="#000000" />
  <meta name="msapplication-navbutton-color" content="#000000" />
  <meta name="apple-mobile-web-app-status-bar-style" content="#000000" />
        <meta name="application-name" content="Cardiac Delights" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Cardiac Delights" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#fbbf24" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA Manifest and Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo2.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/logo2.png" />

        {/* Apple Splash Screen - Using default logo */}
        <link rel="apple-touch-startup-image" href="/logo2.png" />

        {/* Microsoft Tiles - Using default logo */}
        <meta name="msapplication-TileImage" content="/logo2.png" />

        {/* Security and Performance */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />

  {/* Preload Critical Resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="//fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} aria-label="Cardiac Delights App Body">
        <AppShell>
          <main role="main" tabIndex={-1} id="main-content">
            {children}
          </main>
        </AppShell>

        {/* Enhanced Service Worker with Offline CRUD Support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                      console.log('✅ Enhanced SW registered with offline CRUD:', registration.scope);

                      // Automatically pre-cache all critical pages after registration
                      if (registration.active) {
                        registration.active.postMessage({ type: 'CACHE_CRITICAL_ASSETS' });
                        console.log('🚀 Triggering automatic page pre-caching...');
                      }

                      // Listen for messages from service worker
                      navigator.serviceWorker.addEventListener('message', function(event) {
                        if (event.data.type === 'CACHE_COMPLETE') {
                          console.log('✅ Auto-cached', event.data.cached, 'pages!');
                        }
                        if (event.data.type === 'SYNC_COMPLETE') {
                          console.log('📊 Background sync completed:', event.data);
                        }
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('❌ SW registration failed:', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

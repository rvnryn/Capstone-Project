import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./Styles/globals.css";
import AppShell from "./AppShell";

import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cardiac Delights",
  description:
    "A modern, responsive dashboard and management PWA for Cardiac Delights with offline capabilities.",
  keywords: "PWA, dashboard, management, cardiac delights, offline, mobile app",
};

export const viewport: Viewport = {
  themeColor: "#fbbf24",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fbbf24" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo2.png" />
        <link rel="apple-touch-icon" href="/logo2.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Cardiac Delights" />
        <meta name="msapplication-TileColor" content="#fbbf24" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        <style>{`
          .ms-appx-web-install-banner,
          .browser-install-prompt,
          [style*="background-color: rgb(66, 133, 244)"],
          [style*="background-color: #4285f4"],
          [style*="background: rgb(66, 133, 244)"],
          [style*="background: #4285f4"] {
            display: none !important;
            visibility: hidden !important;
          }
          .custom-pwa-banner {
            display: block !important;
            visibility: visible !important;
          }
        `}</style>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

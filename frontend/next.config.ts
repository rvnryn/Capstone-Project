import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "production"
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
            : "http://localhost:8000/api/:path*", // backend URL
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pfxxnqvaniyadzlizgqf.supabase.co", // replace with your actual domain
        port: "",
        pathname: "/**",
      },
      // Add more patterns as needed
    ],
  },
  // Enhanced PWA support
  experimental: {
    optimizePackageImports: ["@tanstack/react-query"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
  compress: true,
};

const pwaConfig = withPWA({
  dest: "public",
  disable: false, // Enable PWA in both development and production
  register: true,
  fallbacks: {
    document: "/offline.html",
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // App Shell
      {
        urlPattern:
          /^https?.*\/(dashboard|inventory|menu|report|supplier|settings)/,
        handler: "CacheFirst",
        options: {
          cacheName: "app-shell",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Static assets with long cache
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // Images with cache first
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // API calls with network first strategy
      {
        urlPattern: /\/api\/(?!auth).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Auth API with network only
      {
        urlPattern: /\/api\/auth\/.*/,
        handler: "NetworkOnly",
      },
      // Dashboard stats with short cache
      {
        urlPattern: /\/api\/dashboard\/stats/,
        handler: "NetworkFirst",
        options: {
          cacheName: "dashboard-stats",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 30 * 60, // 30 minutes
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Inventory data with medium cache
      {
        urlPattern: /\/api\/inventory/,
        handler: "NetworkFirst",
        options: {
          cacheName: "inventory-data",
          networkTimeoutSeconds: 8,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 2 * 60 * 60, // 2 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Menu data with longer cache
      {
        urlPattern: /\/api\/menu/,
        handler: "CacheFirst",
        options: {
          cacheName: "menu-data",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Google Fonts
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // All other requests with network first
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "general-cache",
          networkTimeoutSeconds: 15,
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
})(nextConfig);

export default pwaConfig;

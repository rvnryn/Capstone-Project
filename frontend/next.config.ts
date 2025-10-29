import type { NextConfig } from "next";
// Using custom service-worker.js instead of auto-generated PWA
// import withPWA from "@ducanh2912/next-pwa";

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
    optimizePackageImports: [
      "@tanstack/react-query",
      "react-icons",
      "react-chartjs-2",
      "@fullcalendar/react",
    ],
    // Turbopack for faster dev builds (Next.js 15+)
    turbo: {
      // Enable Turbopack optimizations
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
  compress: true,
  // Performance optimizations for dev mode
  ...(process.env.NODE_ENV === "development" && {
    webpack: (config: any) => {
      // Reduce file watching overhead on Windows
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after changes
        ignored: ['**/node_modules', '**/.next', '**/public'],
      };
      // Optimize chunk splitting in dev
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
      return config;
    },
  }),
};

// Use custom service worker instead of auto-generated one
const pwaConfig = nextConfig; // Bypass PWA auto-generation, use custom service-worker.js

export default pwaConfig;

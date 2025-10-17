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
    optimizePackageImports: ["@tanstack/react-query"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
  compress: true,
};

// Use custom service worker instead of auto-generated one
const pwaConfig = nextConfig; // Bypass PWA auto-generation, use custom service-worker.js

export default pwaConfig;

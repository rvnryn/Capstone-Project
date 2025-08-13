import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*", // backend URL
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
};

export default nextConfig;

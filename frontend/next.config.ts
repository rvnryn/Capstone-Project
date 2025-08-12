import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // backend URL
      },
    ];
  },
  images: {
    domains: ["pfxxnqvaniyadzlizgqf.supabase.co"],
  },
};

export default nextConfig;

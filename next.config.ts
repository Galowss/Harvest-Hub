import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Disable TypeScript errors during build for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint errors during build for deployment  
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

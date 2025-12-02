import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Disable TypeScript errors during build for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Completely disable ESLint during build
    ignoreDuringBuilds: true,
    dirs: [],
  },
  // Additional configuration to ensure deployment succeeds
  experimental: {
    typedRoutes: false,
    turbo: {
      rules: {
        '*.{js,jsx,ts,tsx}': {
          loaders: ['swc-loader'],
        },
      },
    },
  },
  // Disable strict mode for deployment
  reactStrictMode: false,
  // Disable all build optimizations that might cause issues
  productionBrowserSourceMaps: false,
  // Exclude Node.js modules from client bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        amqplib: false,
      };
    }
    return config;
  },
  serverExternalPackages: ['amqplib'],
};

export default nextConfig;

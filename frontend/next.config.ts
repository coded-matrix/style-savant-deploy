import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // /api/backend/* and /health are proxied via middleware.ts (Node.js runtime)
  // so long-running AI requests (catalog/tryon) aren't killed by the dev
  // proxy's ~30s default timeout. See middleware.ts.
};

export default nextConfig;
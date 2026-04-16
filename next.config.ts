import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy all /api/v1/* requests to the backend so the browser never makes
  // cross-origin calls (eliminates CORS issues in development and production).
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;

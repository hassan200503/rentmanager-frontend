import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error(
          "BACKEND_URL must be set in a production build. Refusing to proxy /api/v1 to http://localhost:8080."
        );
      })()
    : "http://localhost:8080");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
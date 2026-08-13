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

  images: {
    // Property photos are stored on Cloudinary (secure_url returned by the
    // backend media upload service).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },

  async headers() {
    // 'unsafe-eval' is required by React's dev-mode debugging (call-stack
    // reconstruction); it is added ONLY in development builds and stripped
    // from the production policy. Clerk loads its JS from the instance
    // domain (*.clerk.accounts.dev) and may render hosted UI in frames.
    const scriptSrc =
      process.env.NODE_ENV === "development"
        ? "'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev"
        : "'self' 'unsafe-inline' https://*.clerk.accounts.dev";

    const CSP = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // connect-src: 'self' covers the Next origin; `https:` covers
      // production backends/CDNs; `http:` is needed for the dev backend on
      // http://localhost:8080 (the app calls NEXT_PUBLIC_API_URL directly
      // from the browser). ws/wss: dev HMR.
      "connect-src 'self' http: https: ws: wss:",
      "frame-src 'self' https://*.clerk.accounts.dev",
      "worker-src 'self' blob:",
      "media-src 'self' blob:",
    ].join("; ");

    return [
      {
        // Apply to every route.
        source: "/:path*",
        headers: [
          // Clickjacking: the admin console and payment flows must never
          // render inside a third-party frame.
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No camera/mic/geolocation/QR code access for any page.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()" },
          // Popups keep window.opener (Clerk OAuth popup flow); cross-origin
          // pages still lose opener access (reverse-tabnabbing mitigation).
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

// Pragmatic CSP for a Next.js App Router app with Clerk + framer-motion +
// Cloudinary media:
//   - 'unsafe-inline' is required by Next's inline bootstrap scripts and
//     CSS-in-JS styles (framer-motion); the policy still blocks arbitrary
//     external script origins and inline event handlers beyond Next's own.
//   - 'unsafe-eval' appears only in development (see headers() above).
//   - frame-ancestors 'none' + X-Frame-Options DENY stop clickjacking.
//   - object-src 'none' blocks Flash/plugin-style attacks.
//   - blob: sources cover the react-pdf worker and dynamic images.

export default nextConfig;
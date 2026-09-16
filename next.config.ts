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

/**
 * The Clerk Frontend API origin for this build's publishable key.
 *
 * Development instances serve from *.clerk.accounts.dev, but a production
 * instance serves from the customer's own domain (clerk.<your-domain>). A CSP
 * that only allows the development domain blocks Clerk entirely the moment
 * pk_live_ keys are used — sign-in silently stops working at launch. The key
 * is `pk_(test|live)_` + base64("<frontend-api-host>$"), so the host is known
 * at build time without extra configuration.
 */
function clerkFrontendApiOrigin(publishableKey: string | undefined): string | null {
  const match = /^pk_(?:test|live)_([A-Za-z0-9+/=_-]+)$/.exec(publishableKey ?? "");
  if (!match) return null;
  try {
    const host = Buffer.from(match[1], "base64").toString("utf8").replace(/\$$/, "");
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) ? `https://${host}` : null;
  } catch {
    return null;
  }
}

const CLERK_ORIGIN = clerkFrontendApiOrigin(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
// Frontend API, Clerk-hosted images and Cloudflare Turnstile (Clerk's bot
// protection on sign-up) — the origins Clerk documents for a strict CSP.
const CLERK_SCRIPT = ["https://*.clerk.accounts.dev", "https://challenges.cloudflare.com", CLERK_ORIGIN]
  .filter(Boolean)
  .join(" ");
const CLERK_CONNECT = ["https://*.clerk.com", "https://*.clerk.accounts.dev", CLERK_ORIGIN]
  .filter(Boolean)
  .join(" ");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Self-contained server bundle (node server.js) for the container image only.
  // Netlify's Next runtime packages the app itself and does not want it.
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,

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
        ? `'self' 'unsafe-inline' 'unsafe-eval' ${CLERK_SCRIPT}`
        : `'self' 'unsafe-inline' ${CLERK_SCRIPT}`;

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
      // connect-src: restrict to known origins in production. In development
      // we still need http://localhost:* for the Spring Boot backend and
      // ws://localhost:* for HMR; broad http:/https: would be overly permissive
      // in prod so we tighten it to Clerk and Cloudinary only.
      // Note: all /api/v1/* backend calls are proxied through Next.js rewrites
      // so the browser only sees 'self' for those — no BACKEND_URL needed here.
      process.env.NODE_ENV === "development"
        ? "connect-src 'self' http://localhost:* https: ws://localhost:* wss:"
        : `connect-src 'self' ${CLERK_CONNECT} https://res.cloudinary.com wss:`,
      `frame-src 'self' ${CLERK_SCRIPT}`,
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
          // Browsers only honour this over HTTPS; the reverse proxy
          // terminates TLS for every deployed host.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
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
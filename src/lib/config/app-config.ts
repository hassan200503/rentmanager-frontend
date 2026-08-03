import { clientEnv } from "./env";

export const appConfig = {
  appName: clientEnv.NEXT_PUBLIC_APP_NAME,

  environment: clientEnv.NEXT_PUBLIC_APP_ENV,

  // Canonical origin for SEO (metadataBase). Optional — falls back to the
  // public API origin's protocol+host when unset so social previews still
  // resolve absolute URLs in dev.
  appUrl: clientEnv.NEXT_PUBLIC_APP_URL || undefined,

  api: {
    baseUrl: clientEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, ""),
    version: "v1",
    basePath: "/api/v1",
  },

  auth: {
    clerkPublishableKey: clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },

  billing: {
    stripePublishableKey: clientEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  monitoring: {
    sentryDsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  },

  flags: {
    isDevelopment: clientEnv.NEXT_PUBLIC_APP_ENV === "development",
    isTest: clientEnv.NEXT_PUBLIC_APP_ENV === "test",
    isProduction: clientEnv.NEXT_PUBLIC_APP_ENV === "production",
  },

  // The first PayPal‑inspired version did not expose a version here.
  // Keeping it undefined preserves the original behaviour.
  version: undefined,
} as const;

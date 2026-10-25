import { clientEnv } from "./env";

export const appConfig = {
  appName: clientEnv.NEXT_PUBLIC_APP_NAME,

  environment: clientEnv.NEXT_PUBLIC_APP_ENV,

  // Canonical origin for SEO (metadataBase). Optional — falls back to the
  // public API origin's protocol+host when unset so social previews still
  // resolve absolute URLs in dev.
  appUrl: clientEnv.NEXT_PUBLIC_APP_URL || undefined,

  /**
   * The absolute origin used for every canonical, og:url and structured-data
   * URL. Always absolute, never undefined.
   *
   * `appUrl` above is optional, so when NEXT_PUBLIC_APP_URL was unset
   * `metadataBase` became undefined and Next emitted the metadata verbatim —
   * shipping `<link rel="canonical" href="/">` and `og:url` of `/`. A
   * relative canonical is ignored by crawlers and a relative og:url breaks
   * link previews outright, so a wrong-but-absolute origin is strictly better
   * than a correct-but-relative one: the first is fixable by setting an env
   * var, the second silently produces invalid markup in every build.
   */
  siteUrl: (clientEnv.NEXT_PUBLIC_APP_URL || "https://rentmanager.co.ke").replace(/\/+$/, ""),

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

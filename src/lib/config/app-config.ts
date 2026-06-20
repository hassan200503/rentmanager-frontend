import { clientEnv } from "./env";

export const appConfig = {
    appName: clientEnv.NEXT_PUBLIC_APP_NAME,

    environment: clientEnv.NEXT_PUBLIC_APP_ENV,

    api: {
        baseUrl: clientEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, ""),
        version: "v1",
        basePath: "/api/v1",
    },

    auth: {
        clerkPublishableKey:
        clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },

    billing: {
        stripePublishableKey:
        clientEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },

    monitoring: {
        sentryDsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
    },

    flags: {
        isDevelopment:
            clientEnv.NEXT_PUBLIC_APP_ENV === "development",

        isTest:
            clientEnv.NEXT_PUBLIC_APP_ENV === "test",

        isProduction:
            clientEnv.NEXT_PUBLIC_APP_ENV === "production",
    },
    version: undefined
} as const;
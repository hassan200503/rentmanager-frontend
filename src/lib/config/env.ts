import { clientEnvSchema, serverEnvSchema } from "./validation";

/**
 * Client-safe env — fine to import anywhere, including client components.
 * Each NEXT_PUBLIC_* key MUST be accessed literally so Next.js can inline it.
 */
const parsedClientEnv = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!parsedClientEnv.success) {
    console.error("❌ Invalid client environment configuration:", parsedClientEnv.error.format());
    throw new Error("Client environment validation failed");
}

export const clientEnv = parsedClientEnv.data;

/**
 * Server-only env — secrets. Only ever import this from server-side code
 * (API routes, server actions, server components). Never from a file that
 * a "use client" component might import.
 */
export function getServerEnv() {
    if (typeof window !== "undefined") {
        throw new Error("getServerEnv() must not be called in the browser");
    }
    const parsed = serverEnvSchema.safeParse({
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
        CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        ENABLE_PREMIUM_FEATURES: process.env.ENABLE_PREMIUM_FEATURES,
    });
    if (!parsed.success) {
        console.error("❌ Invalid server environment configuration:", parsed.error.format());
        throw new Error("Server environment validation failed");
    }
    return parsed.data;
}
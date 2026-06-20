import { z } from "zod";

export const clientEnvSchema = z.object({
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_APP_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_API_URL: z
        .string()
        .min(1)
        .url()
        .transform((val) => val.replace(/\/$/, "")),
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),
    NEXT_PUBLIC_TENANT_ID: z.string().uuid().optional(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
});

export const serverEnvSchema = z.object({
    CLERK_SECRET_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    ENABLE_PREMIUM_FEATURES: z
        .enum(["true", "false"])
        .default("false")
        .transform((val) => val === "true"),
});

export type ClientEnvironment = z.infer<typeof clientEnvSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvSchema>;
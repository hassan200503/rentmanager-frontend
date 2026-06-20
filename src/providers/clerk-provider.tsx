"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";
import { appConfig } from "@/lib/config/app-config";

/**
 * SaaS-grade Clerk Provider
 * Bridges Clerk auth → Backend JWT
 * Supports tenant branding + customization
 */
export default function ClerkAuthProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider
            publishableKey={appConfig.auth.clerkPublishableKey}
            appearance={{
                elements: {
                    logoImage: {
                        backgroundImage: "url('/logo.svg')",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        height: "40px",
                    },
                },
            }}
        >
            {children}
        </ClerkProvider>
    );
}
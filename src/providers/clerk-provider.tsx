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
                // CORRECTED: colorText / colorTextSecondary do not exist on Variables
                // (confirmed against node_modules/@clerk/react/dist/types-CLmOfOIQ.d.mts).
                // The real property for secondary/muted text is colorMutedForeground.
                variables: {
                    colorPrimary: "#14213D",
                    colorBackground: "#FFFFFF",
                    colorMutedForeground: "#5B6472",
                    colorDanger: "#C1502E",
                    borderRadius: "0.75rem",
                },
                elements: {
                    logoImage: {
                        backgroundImage: "url('/favicon.svg')",
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
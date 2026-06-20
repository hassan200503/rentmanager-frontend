"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";

type ClerkClaimsWindow = Window & {
    Clerk?: {
        session?: {
            claims?: {
                subscription?: string;
            };
        };
    };
};

/**
 * SaaS-grade Route Guard
 * - Enforces authentication (Clerk JWT)
 * - Enforces tenant isolation
 * - Supports subscription tier checks
 */
export default function RouteGuard({
                                       children,
                                       requireAuth = true,
                                       requireTenant = true,
                                       requirePremium = false,
                                   }: {
    children: ReactNode;
    requireAuth?: boolean;
    requireTenant?: boolean;
    requirePremium?: boolean;
}) {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        // 🔒 Authentication enforcement
        if (requireAuth && !isSignedIn) {
            router.replace("/public/sign-in");
            return;
        }

        // 🏢 Tenant enforcement
        const tenantId = getTenantIdFromSession();
        if (requireTenant && !tenantId) {
            router.replace("/tenant-required");
            return;
        }

        // 💳 Subscription enforcement
        const isPremium =
            (window as ClerkClaimsWindow).Clerk?.session?.claims?.subscription === "premium";

        if (requirePremium && !isPremium) {
            router.replace("/upgrade");
            return;
        }
    }, [isLoaded, isSignedIn, requireAuth, requireTenant, requirePremium, router]);

    return <>{children}</>;
}

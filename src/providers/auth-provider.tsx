"use client";

import { ClerkProvider, useAuth, useOrganization } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";

import { useOrgStore } from "@/stores/org-store";

/**
 * providers/auth-provider.tsx
 *
 * Responsibilities:
 *  1. Wrap the app in ClerkProvider (session + org management).
 *  2. Sync Clerk's active organization into org-store, so the rest of the
 *     app reads tenant context from one place (the store), not from Clerk
 *     hooks scattered everywhere.
 *
 * tenantId === Clerk orgId. See architecture decision log if this changes.
 */

function OrgStoreSync({ children }: { children: ReactNode }) {
    const { isLoaded: authLoaded, orgId, userId } = useAuth();
    const { organization, isLoaded: orgLoaded } = useOrganization();

    const setTenant = useOrgStore((s) => s.setTenant);
    const clearTenant = useOrgStore((s) => s.clearTenant);
    const setResolved = useOrgStore((s) => s.setResolved);
    const setNeedsOrgSelection = useOrgStore((s) => s.setNeedsOrgSelection);

    useEffect(() => {
        // Wait for both auth and org data to finish loading before deciding
        // anything — acting on partial state causes flicker and bad requests.
        if (!authLoaded || !orgLoaded) {
            return;
        }

        if (!userId) {
            // Not signed in at all — nothing to resolve, no tenant.
            clearTenant();
            setResolved(true);
            return;
        }

        if (orgId && organization) {
            setTenant(orgId, organization.name ?? null);
            setResolved(true);
            return;
        }

        // Signed in, but no active organization selected — onboarding flow
        // (e.g. "create or join an organization") should handle this state.
        setNeedsOrgSelection(true);
        setResolved(true);
    }, [
        authLoaded,
        orgLoaded,
        userId,
        orgId,
        organization,
        setTenant,
        clearTenant,
        setResolved,
        setNeedsOrgSelection,
    ]);

    return <>{children}</>;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider
            signInUrl="/public/sign-in"
            signUpUrl="/public/sign-up"
            // Adjust to your actual (auth) and (dashboard) route group paths.
            afterSignOutUrl="/"
        >
            <OrgStoreSync>{children}</OrgStoreSync>
        </ClerkProvider>
    );
}
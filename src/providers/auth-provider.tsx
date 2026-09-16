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
 *  tenantId === Clerk orgId. See architecture decision log if this changes.
 *
 * ── Post-auth redirect contract ────────────────────────────────────────────
 *   - Everyone signs in the same way; there is no persona choice. After
 *     sign-in (and after sign-up) Clerk sends the person to /continue, which
 *     asks the API what the account is authorised for (GET /users/me/access)
 *     and routes to /admin, /dashboard, /portal or /onboarding.
 *   - signInFallbackRedirectUrl applies only when no redirect was provided, so
 *     a return-to-origin flow (a renter signing in mid-reservation) still wins.
 *   - None of this grants anything: the proxy re-evaluates every navigation and
 *     the backend authorises every call.
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
            signInFallbackRedirectUrl="/continue"
            afterSignOutUrl="/"
            // Our sign-in/up pages already show the RentManager brand mark above
            // Clerk's form. Clerk's own logo is whatever image is stored in the
            // Clerk dashboard, which had drifted from the brand; one mark, owned
            // by this codebase, is the only way the two cannot disagree.
            appearance={{ options: { logoPlacement: "none" } }}
        >
            <OrgStoreSync>{children}</OrgStoreSync>
        </ClerkProvider>
    );
}
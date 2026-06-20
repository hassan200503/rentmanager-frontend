import { useOrgStore } from "@/stores/org-store";

/**
 * SaaS-grade tenant resolver
 * Source of truth: Clerk session JWT claims
 */
type ClerkTenantWindow = Window & {
    Clerk?: {
        session?: {
            claims?: {
                tenant_id?: string;
            };
        };
    };
};

export function getTenantIdFromSession(): string | null {
    const activeTenantId = useOrgStore.getState().tenantId;
    if (activeTenantId) return activeTenantId;

    if (typeof window === "undefined") return null;

    const session = (window as ClerkTenantWindow).Clerk?.session;

    if (!session) return null;

    const claims = session?.claims;

    return claims?.tenant_id || null;
}

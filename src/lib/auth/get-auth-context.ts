// lib/auth/get-auth-context.ts
// Single shared auth-context resolver for every client API module. This
// used to be copy-pasted into ~19 feature API files (uuidv5 namespace hash,
// Clerk token, X-Tenant-Id derivation); any fix landed in only some copies.
//
// Options:
// - `tenantIdOverride`: callers that already hold the real backend tenant
//   UUID (e.g. activity feeds sourced from /users/me) can pass it through
//   verbatim — it is NOT re-hashed, matching the documented semantics of
//   those call sites.
// - `suppressTenantOverride`: skip tenant resolution entirely (the dev-only
//   "_dev_portal=renter" simulation in the tenant portal).
//
// The Clerk token lookup rejects if the session/template is unhealthy.
// Swallowing that rejection is deliberate: it mirrors the rationale
// documented in activity-api — an uncaught rejection can leave React Query
// permanently stuck in "loading". Falling back to an empty token turns the
// failure into a clean 401 ApiError instead.
import { v5 as uuidv5 } from "uuid";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";

type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export interface GetAuthContextOptions {
    tenantId?: string;
    suppressTenantOverride?: boolean;
}

export async function getAuthContext(options: GetAuthContextOptions = {}): Promise<{
    token: string | undefined;
    tenantId: string | undefined;
}> {
    if (typeof window === "undefined") {
        return { token: undefined, tenantId: undefined };
    }

    const tenantId = options.tenantId
        ? options.tenantId
        : options.suppressTenantOverride
          ? undefined
          : (() => {
                const rawTenantId =
                    useOrgStore.getState().tenantId ??
                    getTenantIdFromSession() ??
                    undefined;
                return rawTenantId ? uuidv5(rawTenantId, TENANT_NAMESPACE) : undefined;
            })();

    let token: string | undefined;
    try {
        token =
            (await (window as ClerkWindow).Clerk?.session?.getToken?.({
                template: BACKEND_JWT_TEMPLATE,
            })) ?? undefined;
    } catch {
        token = undefined;
    }

    return { token, tenantId };
}
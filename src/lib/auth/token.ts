import type { useAuth } from "@clerk/nextjs";

/**
 * lib/auth/token.ts
 *
 * Pure, framework-agnostic token retrieval logic. No React here on purpose:
 * this module is consumed both by the React hook (shared/hooks/use-auth-token.ts)
 * and by the Axios request interceptor (lib/api/interceptor.ts), which cannot
 * call hooks. Keeping the logic here avoids duplicating it in two places.
 *
 * Backend contract:
 *  - Authorization: Bearer <clerk-jwt-using-"backend"-template>
 *  - X-Tenant-Id: <clerk-org-id>
 *
 * Security note: X-Tenant-Id is a convenience header for routing/logging on
 * the backend. It must NEVER be trusted as the source of truth for
 * authorization — Spring Security must independently verify the org_id
 * claim inside the verified JWT matches the tenant being acted on. Treat
 * the header as advisory, the JWT claim as authoritative.
 */

export const BACKEND_JWT_TEMPLATE = "backend" as const;

export interface BackendAuthHeaders {
    Authorization: string;
    "X-Tenant-Id"?: string;
}

/** Minimal shape of what we need from Clerk's useAuth(), to keep this decoupled. */
export type ClerkGetToken = ReturnType<typeof useAuth>["getToken"];

/**
 * Resolves backend-ready auth headers from a Clerk getToken function.
 * Returns undefined if no session/token is available (caller should treat
 * this as "not authenticated" and avoid firing the request).
 */
export async function resolveAuthHeaders(
    getToken: ClerkGetToken,
    tenantId?: string | null
): Promise<BackendAuthHeaders | undefined> {
    try {
        const token = await getToken({ template: BACKEND_JWT_TEMPLATE });

        if (!token) {
            if (process.env.NODE_ENV !== "production") {
                console.warn("[auth/token] No Clerk token available for backend template");
            }
            return undefined;
        }

        const headers: BackendAuthHeaders = {
            Authorization: `Bearer ${token}`,
        };

        if (tenantId) {
            headers["X-Tenant-Id"] = tenantId;
        }

        return headers;
    } catch (err) {
        console.error("[auth/token] Failed to retrieve Clerk token", err);
        return undefined;
    }
}
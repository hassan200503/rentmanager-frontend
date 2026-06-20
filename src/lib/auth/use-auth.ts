"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

import { resolveAuthHeaders, type BackendAuthHeaders } from "@/lib/auth/token";
import { useOrgStore } from "@/stores/org-store";

/**
 * shared/hooks/use-auth-token.ts
 *
 * React-facing wrapper around lib/auth/token.ts. Tenant ID is resolved
 * automatically from org-store — callers should NOT need to pass a
 * tenantId manually. This removes the entire class of bugs where a call
 * site forgets to attach tenant context.
 *
 * Most components should not need this directly — lib/api/interceptor.ts
 * already attaches these headers to every outgoing request automatically.
 * Reach for this hook only when you need a raw token outside the Axios
 * client (e.g. a direct fetch, a websocket handshake, a file upload to a
 * third-party signed URL flow, etc).
 */
export function useAuthToken() {
    const { getToken } = useAuth();
    const tenantId = useOrgStore((s) => s.tenantId);

    const getAccessToken = useCallback(async (): Promise<
        BackendAuthHeaders | undefined
    > => {
        return resolveAuthHeaders(getToken, tenantId);
    }, [getToken, tenantId]);

    return { getAccessToken };
}
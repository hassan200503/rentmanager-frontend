import { v5 as uuidv5 } from "uuid";
import { tenantEndpoints } from "@/features/tenant/api/tenant-endpoints";
import type {
    ConfigureDarajaCredentialsRequest,
    DarajaCredentialsStatusResponse,
} from "../types/daraja-types";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";

// Duplicated from property-api.ts — same auth pattern used everywhere else
// in this codebase. Candidate for extraction into a shared getAuthContext()
// helper; not doing that here since it'd mean editing property-api.ts too.
type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const getAuthContext = async () => {
    if (typeof window === "undefined") {
        return {};
    }

    const rawTenantId = useOrgStore.getState().tenantId ?? getTenantIdFromSession() ?? undefined;
    const tenantId = rawTenantId ? uuidv5(rawTenantId, TENANT_NAMESPACE) : undefined;

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token, tenantId };
};

// Keeping the original exported function names/signatures so the existing
// use-daraja-status-query / use-configure-daraja-mutation hooks (not shown,
// but referenced from page.tsx) don't need to change.
export async function getDarajaCredentialsStatus(
    tenantId: string
): Promise<DarajaCredentialsStatusResponse> {
    const { token, tenantId: authTenantId } = await getAuthContext();
    return apiClient.get<DarajaCredentialsStatusResponse>(
        tenantEndpoints.darajaCredentialsStatus(tenantId),
        token,
        authTenantId
    );
}

export async function configureDarajaCredentials(
    tenantId: string,
    payload: ConfigureDarajaCredentialsRequest
): Promise<DarajaCredentialsStatusResponse> {
    const { token, tenantId: authTenantId } = await getAuthContext();
    return apiClient.put<DarajaCredentialsStatusResponse>(
        tenantEndpoints.darajaCredentials(tenantId),
        payload,
        token,
        authTenantId
    );
}
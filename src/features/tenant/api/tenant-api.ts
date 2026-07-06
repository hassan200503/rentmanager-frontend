import { v5 as uuidv5 } from "uuid";
import { tenantEndpoints } from "./tenant-endpoints";
import { SuspendTenantRequest, TenantResponse } from "../types/tenant-types";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";

// Same duplicated auth pattern as property-api.ts / daraja-api.ts.
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

export const tenantApi = {
    get: async (id: string): Promise<TenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TenantResponse>(tenantEndpoints.byId(id), token, tenantId);
    },

    suspend: async (id: string, payload: SuspendTenantRequest): Promise<TenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<TenantResponse>(
            tenantEndpoints.suspend(id),
            payload,
            token,
            tenantId
        );
    },

    activate: async (id: string): Promise<TenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<TenantResponse>(
            tenantEndpoints.activate(id),
            undefined,
            token,
            tenantId
        );
    },
};
import { v5 as uuidv5 } from "uuid";
import { tenantEndpoints } from "./tenant-endpoints";
import {
    SuspendTenantRequest,
    TenantResponse,
    OnboardingTenantRequest,
    OnboardingTenantResponse,
} from "../types/tenant-types";
import { apiClient } from "@/lib/api/client";
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
        return apiClient.post<TenantResponse>(tenantEndpoints.suspend(id), payload, token, tenantId);
    },

    activate: async (id: string): Promise<TenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<TenantResponse>(tenantEndpoints.activate(id), undefined, token, tenantId);
    },

    // Onboarding: at call time the user has no Tenant yet, so `tenantId` here
    // will always resolve to undefined (org store / session are empty pre-onboarding).
    // That's expected — the backend derives everything from the verified JWT's
    // clerkOrgId, never from a client-sent tenant id. See spec §2 "Do NOT send".
    onboard: async (payload: OnboardingTenantRequest): Promise<OnboardingTenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<OnboardingTenantResponse>(
            tenantEndpoints.onboard,
            payload,
            token,
            tenantId
        );
    },
};
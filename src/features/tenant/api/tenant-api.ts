import { tenantEndpoints } from "./tenant-endpoints";
import {
    SuspendTenantRequest,
    TenantResponse,
    OnboardingTenantRequest,
    OnboardingTenantResponse,
    OnboardingProgressResponse,
} from "../types/tenant-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

export const tenantApi = {
    get: async (id: string): Promise<TenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TenantResponse>(tenantEndpoints.byId(id), token, tenantId);
    },

    suspend: async (id: string, payload: SuspendTenantRequest): Promise<TenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<TenantResponse>(tenantEndpoints.suspend(id), payload, token, tenantId);
    },

    activate: async (id: string): Promise<TenantResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<TenantResponse>(tenantEndpoints.activate(id), undefined, token, tenantId);
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

    getOnboardingProgress: async (): Promise<OnboardingProgressResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<OnboardingProgressResponse>(
            tenantEndpoints.onboardingProgress,
            token,
            tenantId
        );
    },

    completeOnboarding: async (): Promise<OnboardingProgressResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<OnboardingProgressResponse>(
            tenantEndpoints.onboardingComplete,
            undefined,
            token,
            tenantId
        );
    },
};
import { v5 as uuidv5 } from "uuid";
import { subscriptionEndpoints } from "./subscription-endpoints";
import {
    RatibaSetupResponse,
    SubscriptionPaymentRequestResponse,
    SubscriptionPlan,
    SubscriptionStatusResponse,
    SwitchToPremiumRequest,
} from "../types/subscription-types";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";

// Same auth-context pattern as user-api.ts / daraja-api.ts. The
// X-Tenant-Id header is advisory only (tenant isolation is enforced
// server-side from the verified JWT via TenantContext).
type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const getTenantId = (): string | undefined => {
    const rawTenantId =
        useOrgStore.getState().tenantId ?? getTenantIdFromSession() ?? undefined;

    return rawTenantId ? uuidv5(rawTenantId, TENANT_NAMESPACE) : undefined;
};

const getAuthContext = async () => {
    if (typeof window === "undefined") {
        return {};
    }

    const tenantId = getTenantId();

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token, tenantId };
};

export const subscriptionApi = {
    getStatus: async (): Promise<SubscriptionStatusResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<SubscriptionStatusResponse>(
            subscriptionEndpoints.status,
            token,
            tenantId
        );
    },

    listPlans: async (): Promise<SubscriptionPlan[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<SubscriptionPlan[]>(
            subscriptionEndpoints.plans,
            token,
            tenantId
        );
    },

    switchToPremium: async (
        payload: SwitchToPremiumRequest
    ): Promise<SubscriptionPaymentRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<SubscriptionPaymentRequestResponse>(
            subscriptionEndpoints.switchToPremium,
            payload,
            token,
            tenantId
        );
    },

    getPaymentRequestStatus: async (
        paymentRequestId: string
    ): Promise<SubscriptionPaymentRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<SubscriptionPaymentRequestResponse>(
            subscriptionEndpoints.paymentStatus(paymentRequestId),
            token,
            tenantId
        );
    },

    cancelPremium: async (): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<void>(
            subscriptionEndpoints.cancelPremium,
            undefined,
            token,
            tenantId
        );
    },

    setupRatiba: async (): Promise<RatibaSetupResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<RatibaSetupResponse>(
            subscriptionEndpoints.ratiba,
            undefined,
            token,
            tenantId
        );
    },
};

/** True when the backend reports premium monthly billing. */
export function getIsPremium(status: SubscriptionStatusResponse): boolean {
    return status.billingMode === "PREMIUM_MONTHLY";
}

import { subscriptionEndpoints } from "./subscription-endpoints";
import {
    RatibaSetupResponse,
    SubscriptionPaymentRequestResponse,
    SubscriptionPlan,
    SubscriptionStatusResponse,
    SwitchToPremiumRequest,
} from "../types/subscription-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

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

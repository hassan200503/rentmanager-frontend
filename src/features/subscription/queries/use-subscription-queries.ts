import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
    subscriptionApi,
} from "../api/subscription-api";
import type {
    SwitchToPremiumRequest,
} from "../types/subscription-types";

export const subscriptionKeys = {
    status: ["subscription", "status"] as const,
    plans: ["subscription", "plans"] as const,
};

export function useSubscriptionStatusQuery() {
    const { isLoaded, isSignedIn } = useAuth();

    const query = useQuery({
        queryKey: subscriptionKeys.status,
        queryFn: subscriptionApi.getStatus,
        enabled: isLoaded && isSignedIn,
        staleTime: 60 * 1000,
        retry: 1,
    });

    return {
        ...query,
        // Fold Clerk's loading state in so callers never see "loaded with
        // no data" while auth is still resolving (same pattern as
        // useCurrentUserQuery).
        isLoading: !isLoaded || query.isLoading,
    };
}

export function useSubscriptionPlansQuery() {
    const { isLoaded, isSignedIn } = useAuth();

    const query = useQuery({
        queryKey: subscriptionKeys.plans,
        queryFn: subscriptionApi.listPlans,
        enabled: isLoaded && isSignedIn,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    return {
        ...query,
        isLoading: !isLoaded || query.isLoading,
    };
}

export function useSwitchToPremiumMutation() {
    return useMutation({
        mutationFn: (payload: SwitchToPremiumRequest) =>
            subscriptionApi.switchToPremium(payload),
    });
}

/**
 * Polls the switch STK payment request until it reaches a terminal
 * status. Enabled only while a payment request id is in flight; stops
 * polling on PAID / FAILED / EXPIRED.
 */
export function useSubscriptionPaymentRequestQuery(
    paymentRequestId: string | null
) {
    return useQuery({
        queryKey: ["subscription", "payment-request", paymentRequestId],
        queryFn: () =>
            subscriptionApi.getPaymentRequestStatus(paymentRequestId as string),
        enabled: paymentRequestId != null,
        retry: 1,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === "PAID" || status === "FAILED" || status === "EXPIRED") {
                return false;
            }
            return 4000;
        },
    });
}

export function useCancelPremiumMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => subscriptionApi.cancelPremium(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
        },
    });
}

export function useSetupRatibaMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => subscriptionApi.setupRatiba(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
        },
    });
}

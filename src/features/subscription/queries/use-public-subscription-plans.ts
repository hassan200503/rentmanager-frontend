import { useQuery } from "@tanstack/react-query";
import { publicSubscriptionApi } from "../api/public-subscription-api";

export const publicSubscriptionKeys = {
    plans: ["subscription", "public-plans"] as const,
};

/**
 * Live plan catalog for the public marketing surface. Deliberately
 * aggressive freshness so owner-side repricing reaches visitors within a
 * window (0s stale + window-focus refetch + gentle 2-minute poll while the
 * pricing section is mounted). GET requests are not client-rate-limited.
 */
export function usePublicSubscriptionPlansQuery() {
    return useQuery({
        queryKey: publicSubscriptionKeys.plans,
        queryFn: publicSubscriptionApi.listActivePlans,
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchInterval: 2 * 60 * 1000,
        retry: 1,
    });
}
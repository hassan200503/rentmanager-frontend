/**
 * Public pricing catalog API - unauthenticated read of the live plan
 * catalog. Serves ONLY active plans; whatever the platform owner reprices
 * through the platform route (PUT /tenants/subscription-plans/{id}) is
 * reflected here immediately because the public controller reads the same
 * catalog table on every request - no cache, no deployment.
 *
 * Path is relative to NEXT_PUBLIC_API_URL (which already ends in /api/v1).
 */
import { apiClient } from "@/lib/api/client";
import { SubscriptionPlan } from "../types/subscription-types";

export const publicSubscriptionApi = {
    listActivePlans: async (): Promise<SubscriptionPlan[]> =>
        apiClient.get<SubscriptionPlan[]>("/public/subscription-plans"),
};
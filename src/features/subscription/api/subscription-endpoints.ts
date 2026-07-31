/**
 * Backend routes for subscription billing. Mirrors the backend
 * TenantRoutes / SubscriptionBillingController mapping - these paths are
 * NOT nested under the old /tenants/{id} pattern: tenant resolution is
 * server-side via TenantContext (verified Clerk JWT), never the URL.
 *
 * Relative to NEXT_PUBLIC_API_URL (which already ends in /api/v1) —
 * apiClient prepends baseUrl, so do NOT include the /api/v1 prefix here.
 */
export const subscriptionEndpoints = {
    base: "/tenants/subscription",
    status: "/tenants/subscription",
    switchToPremium: "/tenants/subscription/switch",
    cancelPremium: "/tenants/subscription/cancel",
    ratiba: "/tenants/subscription/ratiba",
    paymentStatus: (paymentRequestId: string) =>
        `/tenants/subscription/payments/${paymentRequestId}`,
    plans: "/tenants/subscription-plans",
} as const;

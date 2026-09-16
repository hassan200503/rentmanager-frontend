// hooks/tenant-portal-keys.ts
//
// Factory functions used for targeted invalidation in components that mutate
// data (e.g., PaymentWidget after a successful STK push). Keep in sync with
// the flat constants in use-tenant-portal-queries.ts — both must resolve to
// the same array values so React Query's prefix-based matching works correctly.
export const tenantPortalKeys = {
    all: ["tenant-portal"] as const,
    dashboard: () => [...tenantPortalKeys.all, "dashboard"] as const,
    lease: () => [...tenantPortalKeys.all, "lease"] as const,
    paymentSummary: () => [...tenantPortalKeys.all, "payment-summary"] as const,
    paymentHistoryAll: [...["tenant-portal"], "payment-history"] as const,
    paymentHistory: (page: number, size: number = 20) =>
        [...tenantPortalKeys.all, "payment-history", page, size] as const,
    paymentReceipt: (transactionId: string) =>
        [...tenantPortalKeys.all, "receipt", transactionId] as const,
    maintenance: () => [...tenantPortalKeys.all, "maintenance"] as const,
    autoPay: () => [...tenantPortalKeys.all, "auto-pay"] as const,
};
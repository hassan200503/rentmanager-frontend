// hooks/tenant-portal-keys.ts
export const tenantPortalKeys = {
    all: ["tenant-portal"] as const,
    dashboard: () => [...tenantPortalKeys.all, "dashboard"] as const,
    lease: () => [...tenantPortalKeys.all, "lease"] as const,
    paymentSummary: () => [...tenantPortalKeys.all, "payment-summary"] as const,
    paymentHistory: (page: number, size: number) =>
        [...tenantPortalKeys.all, "payment-history", page, size] as const,
    paymentReceipt: (transactionId: string) =>
        [...tenantPortalKeys.all, "receipt", transactionId] as const,
    maintenance: () => [...tenantPortalKeys.all, "maintenance"] as const,
    autoPay: () => [...tenantPortalKeys.all, "auto-pay"] as const,
};
// api/tenant-portal-endpoints.ts
const base = "/tenant-portal";

export const tenantPortalEndpoints = {
    dashboard: () => `${base}/dashboard`,
    lease: () => `${base}/lease`,
    paymentSummary: () => `${base}/payments/summary`,
    paymentHistory: (page: number = 0, size: number = 20) =>
        `${base}/payments/history?page=${page}&size=${size}`,
    paymentReceipt: (transactionId: string) =>
        `${base}/payments/${transactionId}/receipt`,
};
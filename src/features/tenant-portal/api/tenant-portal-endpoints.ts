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
    collectPayment: (entryId: string) =>
        `${base}/entries/${entryId}/collect`,
    paymentRequestStatus: (requestId: string) =>
        `${base}/rent-payment-requests/${requestId}/status`,
    initiatePortalPayment: () => `${base}/rent-payments/initiate`,
    autoPay: () => `${base}/auto-pay`,
    autoPayToggle: () => `${base}/auto-pay/toggle`,
    autoPayPhone: () => `${base}/auto-pay/phone`,
    maintenanceList: () => `${base}/maintenance`,
    maintenanceSubmit: () => `${base}/maintenance`,
    reviewMe: () => `${base}/reviews/me`,
    submitReview: () => `${base}/reviews`,
    announcements: () => `${base}/announcements`,
    announcementsUnreadCount: () => `${base}/announcements/unread-count`,
    markAnnouncementRead: (id: string) => `${base}/announcements/${id}/read`,
    whatsAppOptIn: () => `${base}/whatsapp-opt-in`,
};
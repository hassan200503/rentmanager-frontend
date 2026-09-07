// hooks/use-tenant-portal-queries.ts
import { useQuery } from "@tanstack/react-query";
import { tenantPortalApi } from "../api/tenant-portal-api";

export const tenantPortalKeys = {
    all: ["tenant-portal"] as const,
    dashboard: ["tenant-portal", "dashboard"] as const,
    lease: ["tenant-portal", "lease"] as const,
    deposit: ["tenant-portal", "deposit"] as const,
    paymentSummary: ["tenant-portal", "payment-summary"] as const,
    paymentHistory: (page: number) => ["tenant-portal", "payment-history", page] as const,
    paymentReceipt: (transactionId: string) => ["tenant-portal", "receipt", transactionId] as const,
    maintenance: () => [...tenantPortalKeys.all, "maintenance"] as const,
    autoPay: () => [...tenantPortalKeys.all, "auto-pay"] as const,
    myReview: () => [...tenantPortalKeys.all, "my-review"] as const,
    reviewsAboutMe: () => [...tenantPortalKeys.all, "reviews-about-me"] as const,
    reviewsAboutMeSummary: () => [...tenantPortalKeys.all, "reviews-about-me", "summary"] as const,
    announcements: () => [...tenantPortalKeys.all, "announcements"] as const,
    unreadAnnouncementCount: () => [...tenantPortalKeys.all, "announcements", "unread-count"] as const,
    whatsAppOptIn: () => [...tenantPortalKeys.all, "whatsapp-opt-in"] as const,
};

export const useTenantDashboardQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.dashboard,
        queryFn: () => tenantPortalApi.getDashboard(),
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    });
};

export const useTenantLeaseQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.lease,
        queryFn: () => tenantPortalApi.getLease(),
        staleTime: 30 * 1000, // 30s — landlord contact details must propagate quickly
        refetchOnWindowFocus: true,
    });
};

export const useTenantDepositQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.deposit,
        queryFn: () => tenantPortalApi.getDeposit(),
        staleTime: 5 * 60 * 1000, // 5 minutes -- status changes only on a landlord refund/forfeit action
    });
};

export const useTenantPaymentSummaryQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.paymentSummary,
        queryFn: () => tenantPortalApi.getPaymentSummary(),
        staleTime: 60 * 1000, // 1 minute
    });
};

export const useTenantPaymentHistoryQuery = (page: number = 0, size: number = 20) => {
    return useQuery({
        queryKey: tenantPortalKeys.paymentHistory(page),
        queryFn: () => tenantPortalApi.getPaymentHistory(page, size),
        staleTime: 60 * 1000,
    });
};

export const useTenantPaymentReceiptQuery = (transactionId: string) => {
    return useQuery({
        queryKey: tenantPortalKeys.paymentReceipt(transactionId),
        queryFn: () => tenantPortalApi.getPaymentReceipt(transactionId),
        enabled: !!transactionId,
    });
};

export const useTenantMaintenanceRequestsQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.maintenance(),
        queryFn: () => tenantPortalApi.getMaintenanceRequests(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useTenantAutoPaySettingsQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.autoPay(),
        queryFn: () => tenantPortalApi.getAutoPaySettings(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useMyReviewQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.myReview(),
        queryFn: () => tenantPortalApi.getMyReview(),
        staleTime: 30 * 1000,
    });
};

export const useReviewsAboutMeQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.reviewsAboutMe(),
        queryFn: () => tenantPortalApi.getReviewsAboutMe(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useReviewsAboutMeSummaryQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.reviewsAboutMeSummary(),
        queryFn: () => tenantPortalApi.getReviewsAboutMeSummary(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useTenantAnnouncementsQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.announcements(),
        queryFn: () => tenantPortalApi.getAnnouncements(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

/**
 * Unread in-app announcements for the sidebar badge. Quiet 60s poll +
 * window-focus refetch so the badge picks up new broadcasts without a page
 * reload; the mark-read mutation invalidates it instantly as the renter
 * opens announcements.
 */
export const useUnreadAnnouncementCountQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.unreadAnnouncementCount(),
        queryFn: () => tenantPortalApi.getUnreadAnnouncementsCount(),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useWhatsAppOptInQuery = () => {
    return useQuery({
        queryKey: tenantPortalKeys.whatsAppOptIn(),
        queryFn: () => tenantPortalApi.getWhatsAppOptIn(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};
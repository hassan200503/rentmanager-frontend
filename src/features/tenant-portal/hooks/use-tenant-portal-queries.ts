// hooks/use-tenant-portal-queries.ts
import { useQuery } from "@tanstack/react-query";
import { tenantPortalApi } from "../api/tenant-portal-api";

export const tenantPortalKeys = {
    all: ["tenant-portal"] as const,
    dashboard: ["tenant-portal", "dashboard"] as const,
    lease: ["tenant-portal", "lease"] as const,
    paymentSummary: ["tenant-portal", "payment-summary"] as const,
    paymentHistory: (page: number) => ["tenant-portal", "payment-history", page] as const,
    paymentReceipt: (transactionId: string) => ["tenant-portal", "receipt", transactionId] as const,
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
        staleTime: 5 * 60 * 1000, // 5 minutes
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
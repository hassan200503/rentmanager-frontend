import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { adminKeys } from "./admin-keys";

export interface AdminLandlordsParams {
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
}

// Platform-owner session bootstrap: which platform sub-role this token carries.
// Used for client-side route gating (the proxy and backend @PreAuthorize are
// the authoritative guards; this just improves UX and shows a clear message).
export const usePlatformAdminInfoQuery = () => {
    return useQuery({
        queryKey: adminKeys.info(),
        queryFn: () => adminApi.getInfo(),
        retry: false,
    });
};

export const useAdminOverviewQuery = () => {
    return useQuery({
        queryKey: adminKeys.overview(),
        queryFn: () => adminApi.getOverview(),
    });
};

export const useAdminSettingsQuery = () => {
    return useQuery({
        queryKey: adminKeys.settings(),
        queryFn: () => adminApi.getSettings(),
    });
};

export const useAdminPropertyDetailQuery = (propertyId: string) => {
    return useQuery({
        queryKey: adminKeys.property(propertyId),
        queryFn: () => adminApi.getPropertyDetail(propertyId),
        enabled: !!propertyId,
    });
};

export const useAdminDefaultCommissionQuery = () => {
    return useQuery({
        queryKey: adminKeys.defaultCommission(),
        queryFn: () => adminApi.getDefaultCommission(),
    });
};

export const useAdminLandlordsQuery = (params: AdminLandlordsParams) => {
    return useQuery({
        queryKey: adminKeys.landlords(params),
        queryFn: () => adminApi.getLandlords(params),
        placeholderData: (prev) => prev,
    });
};

export const useAdminLandlordDetailQuery = (landlordId: string) => {
    return useQuery({
        queryKey: adminKeys.landlord(landlordId),
        queryFn: () => adminApi.getLandlordDetail(landlordId),
        enabled: !!landlordId,
    });
};

export const useAdminLandlordCommissionQuery = (landlordId: string) => {
    return useQuery({
        queryKey: adminKeys.landlordCommission(landlordId),
        queryFn: () => adminApi.getLandlordCommission(landlordId),
        enabled: !!landlordId,
    });
};

export interface AdminDisbursementsParams {
    landlordId?: string;
    status?: string;
    requiresManualAttention?: boolean;
    page?: number;
    size?: number;
}

export const useAdminDisbursementsQuery = (params: AdminDisbursementsParams) => {
    return useQuery({
        queryKey: adminKeys.disbursements(params),
        queryFn: () => adminApi.getDisbursements(params),
        placeholderData: (prev) => prev,
    });
};

export interface AdminPropertiesParams {
    search?: string;
    landlordId?: string;
    page?: number;
    size?: number;
    sort?: string;
}

export const useAdminPropertiesQuery = (params: AdminPropertiesParams) => {
    return useQuery({
        queryKey: adminKeys.properties(params),
        queryFn: () => adminApi.getProperties(params),
        placeholderData: (prev) => prev,
    });
};

export interface AdminRentersParams {
    search?: string;
    landlordId?: string;
    page?: number;
    size?: number;
}

export const useAdminRentersQuery = (params: AdminRentersParams) => {
    return useQuery({
        queryKey: adminKeys.renters(params),
        queryFn: () => adminApi.getRenters(params),
        placeholderData: (prev) => prev,
    });
};

export const useAdminReviewsQuery = (
    status: "PENDING" | "APPROVED" | "HIDDEN" = "PENDING",
    limit = 30
) => {
    return useQuery({
        queryKey: adminKeys.reviews({ status, limit }),
        queryFn: () => adminApi.getReviews(status, limit),
        placeholderData: (prev) => prev,
    });
};

export const useAdminReviewStatsQuery = () => {
    return useQuery({
        queryKey: adminKeys.reviewStats(),
        queryFn: () => adminApi.getReviewStats(),
    });
};

import { adminEndpoints } from "./admin-endpoints";
import type {
    AdminActivateSubscriptionRequest,
    AdminOverviewResponse,
    DisbursementItem,
    PaymentRequestItem,
    PaymentRequestQueryParams,
    LandlordDetailResponse,
    LandlordSummary,
    PlatformAdminInfo,
    PlatformBrandingResponse,
    PlatformReviewResponse,
    PlatformReviewStats,
    PlatformReviewType,
    PlatformSettingsResponse,
    PropertyDetailResponse,
    PropertySummary,
    RenterSummary,
    SpringPage,
    UpdatePlatformSettingsRequest,
    DisbursementQueryParams,
    SubscriptionPlanAdminRequest,
} from "../types/admin-types";
import type { SubscriptionPlan } from "@/features/subscription/types/subscription-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

// Admin endpoints are unscoped — they work across all tenants. The backend
// derives the platform role from the JWT and ignores X-Tenant-Id. Return
// token only, no tenantId.

export const adminApi = {
    getInfo: async (): Promise<PlatformAdminInfo> => {
        const { token } = await getAuthContext();
        return apiClient.get<PlatformAdminInfo>(adminEndpoints.info(), token);
    },
    getOverview: async (): Promise<AdminOverviewResponse> => {
        const { token } = await getAuthContext();
        return apiClient.get<AdminOverviewResponse>(adminEndpoints.overview(), token);
    },
    getSettings: async (): Promise<PlatformSettingsResponse> => {
        const { token } = await getAuthContext();
        return apiClient.get<PlatformSettingsResponse>(adminEndpoints.settings(), token);
    },
    updateSettings: async (request: UpdatePlatformSettingsRequest): Promise<PlatformSettingsResponse> => {
        const { token } = await getAuthContext();
        return apiClient.put<PlatformSettingsResponse>(adminEndpoints.settings(), request, token);
    },
    uploadLogo: async (file: File): Promise<PlatformSettingsResponse> => {
        const { token } = await getAuthContext();
        const form = new FormData();
        form.append("file", file);
        return apiClient.post<PlatformSettingsResponse>(adminEndpoints.settingsLogo(), form, token);
    },
    removeLogo: async (): Promise<PlatformSettingsResponse> => {
        const { token } = await getAuthContext();
        return apiClient.delete<PlatformSettingsResponse>(adminEndpoints.settingsLogo(), token);
    },
    getPublicBranding: async (): Promise<PlatformBrandingResponse> => {
        return apiClient.get<PlatformBrandingResponse>(adminEndpoints.publicBranding());
    },
    getPropertyDetail: async (propertyId: string): Promise<PropertyDetailResponse> => {
        const { token } = await getAuthContext();
        return apiClient.get<PropertyDetailResponse>(adminEndpoints.property(propertyId), token);
    },
    getLandlords: async (params?: { search?: string; page?: number; size?: number; sort?: string }): Promise<SpringPage<LandlordSummary>> => {
        const { token } = await getAuthContext();
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.page !== undefined) qs.set("page", String(params.page));
        if (params?.size !== undefined) qs.set("size", String(params.size));
        if (params?.sort) qs.set("sort", params.sort);
        const q = qs.toString();
        return apiClient.get<SpringPage<LandlordSummary>>(adminEndpoints.landlords(q || undefined), token);
    },
    getLandlordDetail: async (landlordId: string): Promise<LandlordDetailResponse> => {
        const { token } = await getAuthContext();
        return apiClient.get<LandlordDetailResponse>(adminEndpoints.landlord(landlordId), token);
    },
    updateLandlordStatus: async (landlordId: string, status: "ACTIVE" | "SUSPENDED"): Promise<void> => {
        const { token } = await getAuthContext();
        await apiClient.patch<void>(adminEndpoints.landlordStatus(landlordId), { status }, token);
    },
    getDisbursements: async (params?: DisbursementQueryParams): Promise<SpringPage<DisbursementItem>> => {
        const { token } = await getAuthContext();
        const qs = new URLSearchParams();
        if (params?.landlordId) qs.set("landlordId", params.landlordId);
        if (params?.status) qs.set("status", params.status);
        if (params?.requiresManualAttention !== undefined) qs.set("requiresManualAttention", String(params.requiresManualAttention));
        if (params?.page !== undefined) qs.set("page", String(params.page));
        if (params?.size !== undefined) qs.set("size", String(params.size));
        const q = qs.toString();
        return apiClient.get<SpringPage<DisbursementItem>>(adminEndpoints.disbursements(q || undefined), token);
    },
    getPaymentRequests: async (params?: PaymentRequestQueryParams): Promise<SpringPage<PaymentRequestItem>> => {
        const { token } = await getAuthContext();
        const qs = new URLSearchParams();
        if (params?.landlordId) qs.set("landlordId", params.landlordId);
        if (params?.status) qs.set("status", params.status);
        if (params?.page !== undefined) qs.set("page", String(params.page));
        if (params?.size !== undefined) qs.set("size", String(params.size));
        const q = qs.toString();
        return apiClient.get<SpringPage<PaymentRequestItem>>(adminEndpoints.paymentRequests(q || undefined), token);
    },
    retryDisbursement: async (disbursementId: string): Promise<void> => {
        const { token } = await getAuthContext();
        await apiClient.post<void>(adminEndpoints.disbursementRetry(disbursementId), undefined, token);
    },
    getProperties: async (params?: { search?: string; landlordId?: string; page?: number; size?: number; sort?: string }): Promise<SpringPage<PropertySummary>> => {
        const { token } = await getAuthContext();
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.landlordId) qs.set("landlordId", params.landlordId);
        if (params?.page !== undefined) qs.set("page", String(params.page));
        if (params?.size !== undefined) qs.set("size", String(params.size));
        if (params?.sort) qs.set("sort", params.sort);
        const q = qs.toString();
        return apiClient.get<SpringPage<PropertySummary>>(adminEndpoints.properties(q || undefined), token);
    },
    getRenters: async (params?: { search?: string; landlordId?: string; page?: number; size?: number }): Promise<SpringPage<RenterSummary>> => {
        const { token } = await getAuthContext();
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.landlordId) qs.set("landlordId", params.landlordId);
        if (params?.page !== undefined) qs.set("page", String(params.page));
        if (params?.size !== undefined) qs.set("size", String(params.size));
        const q = qs.toString();
        return apiClient.get<SpringPage<RenterSummary>>(adminEndpoints.renters(q || undefined), token);
    },
    getReviews: async (status: "PENDING" | "APPROVED" | "HIDDEN" = "PENDING", limit = 30): Promise<PlatformReviewResponse[]> => {
        const { token } = await getAuthContext();
        const qs = new URLSearchParams({ status, limit: String(limit) });
        return apiClient.get<PlatformReviewResponse[]>(adminEndpoints.reviews(qs.toString()), token);
    },
    getReviewStats: async (): Promise<PlatformReviewStats> => {
        const { token } = await getAuthContext();
        return apiClient.get<PlatformReviewStats>(adminEndpoints.reviewStats(), token);
    },
    reviewApprove: async (type: PlatformReviewType, reviewId: string): Promise<void> => {
        const { token } = await getAuthContext();
        await apiClient.patch<void>(adminEndpoints.reviewDecision(type, reviewId, "approve"), {}, token);
    },
    reviewHide: async (type: PlatformReviewType, reviewId: string): Promise<void> => {
        const { token } = await getAuthContext();
        await apiClient.patch<void>(adminEndpoints.reviewDecision(type, reviewId, "hide"), {}, token);
    },
    createSubscriptionPlan: async (request: SubscriptionPlanAdminRequest): Promise<SubscriptionPlan> => {
        const { token } = await getAuthContext();
        return apiClient.post<SubscriptionPlan>(adminEndpoints.subscriptionPlans(), request, token);
    },
    updateSubscriptionPlan: async (id: string, request: Omit<SubscriptionPlanAdminRequest, "code">): Promise<SubscriptionPlan> => {
        const { token } = await getAuthContext();
        return apiClient.put<SubscriptionPlan>(adminEndpoints.subscriptionPlan(id), request, token);
    },
    deactivateSubscriptionPlan: async (id: string): Promise<void> => {
        const { token } = await getAuthContext();
        await apiClient.put<void>(adminEndpoints.subscriptionPlanDeactivate(id), undefined, token);
    },
    activateLandlordSubscription: async (landlordId: string, request: AdminActivateSubscriptionRequest): Promise<void> => {
        const { token } = await getAuthContext();
        await apiClient.post<void>(adminEndpoints.landlordSubscriptionActivate(landlordId), request, token);
    },
};
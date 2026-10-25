// features/reviews/api/review-api.ts
// Landlord-facing review endpoints (GET /reviews, GET /reviews/summary).
// Paths are relative — apiClient prepends appConfig.api.baseUrl (which
// already ends in /api/v1), so no version prefix belongs here.
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import { LandlordReviewResponse, PlatformReviewResponse, RenterReviewResponse, ReviewStatusCountsResponse, ReviewSummaryResponse, SubmitPlatformReviewRequest, SubmitRenterReviewRequest } from "../types/review-response";

const REVIEWS_BASE = "/reviews";

export const reviewApi = {
    list: async (): Promise<LandlordReviewResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<LandlordReviewResponse[]>(REVIEWS_BASE, token, tenantId);
    },

    summary: async (): Promise<ReviewSummaryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<ReviewSummaryResponse>(`${REVIEWS_BASE}/summary`, token, tenantId);
    },

    counts: async (): Promise<ReviewStatusCountsResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<ReviewStatusCountsResponse>(`${REVIEWS_BASE}/counts`, token, tenantId);
    },

    renterReviews: async (): Promise<RenterReviewResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RenterReviewResponse[]>(`${REVIEWS_BASE}/renter`, token, tenantId);
    },

    submitRenterReview: async (request: SubmitRenterReviewRequest): Promise<RenterReviewResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<RenterReviewResponse>(REVIEWS_BASE, request, token, tenantId);
    },

    // V66 — platform reviews (users rating the platform). Same auth
    // context; the backend resolves the reviewer from the token.
    getMyPlatformReview: async (): Promise<PlatformReviewResponse | null> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<PlatformReviewResponse | null>("/platform-reviews/me", token, tenantId);
    },

    submitPlatformReview: async (request: SubmitPlatformReviewRequest): Promise<PlatformReviewResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<PlatformReviewResponse>("/platform-reviews", request, token, tenantId);
    },
};

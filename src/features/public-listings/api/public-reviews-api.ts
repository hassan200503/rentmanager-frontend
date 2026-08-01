// features/public-listings/api/public-reviews-api.ts
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "./public-endpoints";
import { PublicLandlordReviewsResponse } from "../types/public-review";

export const publicReviewsApi = {
    getForUnit: async (
        unitId: string
    ): Promise<PublicLandlordReviewsResponse> => {
        return apiClient.get<PublicLandlordReviewsResponse>(
            publicEndpoints.unitReviews(unitId)
        );
    },

    getForProperty: async (
        propertyId: string
    ): Promise<PublicLandlordReviewsResponse> => {
        return apiClient.get<PublicLandlordReviewsResponse>(
            publicEndpoints.propertyReviews(propertyId)
        );
    },
};

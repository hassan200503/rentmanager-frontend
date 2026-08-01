// features/reviews/types/review-response.ts
// Mirrors backend ReviewSummaryResponse + LandlordReviewResponse.

export interface ReviewSummaryResponse {
    reviewCount: number;
    averageRating: number | null;
    averageShown: boolean;
}

export interface LandlordReviewResponse {
    id: string;
    renterName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

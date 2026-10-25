// features/public-listings/types/public-review.ts
// Mirrors backend PublicLandlordReviewResponse + PublicLandlordReviewsResponse.
// Public reviews are privacy-redacted by the backend: renter names are
// first-name only and ids are never exposed.

export interface PublicLandlordReviewResponse {
    rating: number;
    renterName: string | null;
    comment: string | null;
    createdAt: string;
}

export interface PublicLandlordReviewsResponse {
    reviewCount: number;
    averageRating: number | null;
    averageShown: boolean;
    reviews: PublicLandlordReviewResponse[];
}

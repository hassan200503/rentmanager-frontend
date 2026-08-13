// features/reviews/types/review-response.ts
// Mirrors backend ReviewSummaryResponse, LandlordReviewResponse,
// RenterReviewResponse, ReviewStatusCountsResponse (V65 bidirectional
// reviews + moderation).

export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN";

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
    status: ReviewStatus;
    createdAt: string;
}

export interface RenterReviewResponse {
    id: string;
    tenantProfileId: string;
    renterName: string;
    rating: number;
    comment: string;
    status: ReviewStatus;
    createdAt: string;
}

export interface ReviewStatusCountsResponse {
    approvedCount: number;
    pendingCount: number;
    hiddenCount: number;
}

export interface SubmitRenterReviewRequest {
    tenantProfileId: string;
    rating: number;
    comment?: string | null;
}

// V66 — platform reviews: a user (landlord or renter) rates the platform
// itself. Mirrors backend PlatformReviewResponse (modules/review).
export type PlatformReviewType = "LANDLORD" | "RENTER" | "PLATFORM";

export interface PlatformReviewResponse {
    type: PlatformReviewType;
    reviewId: string;
    reviewerName: string | null;
    rating: number;
    comment: string | null;
    status: ReviewStatus;
    createdAt: string;
}

export interface SubmitPlatformReviewRequest {
    rating: number;
    comment?: string | null;
}

// Chip styling follows the same convention as the status registries in
// dashboard/admin pages (bg-*/10 text-*-dark border-*/20).
export const reviewStatusMeta: Record<
    ReviewStatus,
    { label: string; chip: string; dot: string }
> = {
    APPROVED: { label: "Approved", chip: "bg-success/10 text-success-dark border-success/20", dot: "bg-success" },
    PENDING: { label: "Pending", chip: "bg-warning/10 text-warning-dark border-warning/20", dot: "bg-warning" },
    HIDDEN: { label: "Hidden", chip: "bg-border-subtle text-fg-muted border-border", dot: "bg-fg-subtle" },
};

export const reviewStatusOrder: ReviewStatus[] = ["APPROVED", "PENDING", "HIDDEN"];
// features/reviews/hooks/use-review-query.ts
import { useQuery } from "@tanstack/react-query";
import { reviewApi } from "../api/review-api";

export const reviewKeys = {
    all: ["reviews"] as const,
    list: ["reviews", "list"] as const,
    summary: ["reviews", "summary"] as const,
    counts: ["reviews", "counts"] as const,
    renterReviews: ["reviews", "renter-reviews"] as const,
    platformReview: ["reviews", "platform-review"] as const,
};

export const useReviewsQuery = () => {
    return useQuery({
        queryKey: reviewKeys.list,
        queryFn: () => reviewApi.list(),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useReviewSummaryQuery = () => {
    return useQuery({
        queryKey: reviewKeys.summary,
        queryFn: () => reviewApi.summary(),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useReviewCountsQuery = () => {
    return useQuery({
        queryKey: reviewKeys.counts,
        queryFn: () => reviewApi.counts(),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useRenterReviewsQuery = () => {
    return useQuery({
        queryKey: reviewKeys.renterReviews,
        queryFn: () => reviewApi.renterReviews(),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useMyPlatformReviewQuery = () => {
    return useQuery({
        queryKey: reviewKeys.platformReview,
        queryFn: () => reviewApi.getMyPlatformReview(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

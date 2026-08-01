// features/reviews/hooks/use-review-query.ts
import { useQuery } from "@tanstack/react-query";
import { reviewApi } from "../api/review-api";

export const reviewKeys = {
    all: ["reviews"] as const,
    list: ["reviews", "list"] as const,
    summary: ["reviews", "summary"] as const,
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

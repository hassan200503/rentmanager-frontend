// features/reviews/hooks/use-review-mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "../api/review-api";
import { reviewKeys } from "./use-review-query";
import type { SubmitPlatformReviewRequest, SubmitRenterReviewRequest } from "../types/review-response";

export const useSubmitRenterReviewMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: SubmitRenterReviewRequest) =>
            reviewApi.submitRenterReview(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewKeys.renterReviews });
            queryClient.invalidateQueries({ queryKey: reviewKeys.counts });
        },
    });
};

export const useSubmitPlatformReviewMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: SubmitPlatformReviewRequest) =>
            reviewApi.submitPlatformReview(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewKeys.platformReview });
        },
    });
};
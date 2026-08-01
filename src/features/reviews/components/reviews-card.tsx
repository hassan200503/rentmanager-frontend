// features/reviews/components/reviews-card.tsx
"use client";

import { AlertTriangle, Star, Users } from "lucide-react";
import { useReviewSummaryQuery, useReviewsQuery } from "../hooks/use-review-query";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

export function ReviewsCard() {
    const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useReviewSummaryQuery();
    const { data: reviews, isLoading: reviewsLoading, isError: reviewsError, refetch: refetchReviews } = useReviewsQuery();

    const showAverage = summary?.averageShown === true && summary.averageRating != null;

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-brand" strokeWidth={2} />
                Renter Reviews
            </h2>

            {summaryError || reviewsError ? (
                <div className="p-6 text-center">
                    <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load reviews</p>
                    <button
                        onClick={() => {
                            refetchSummary();
                            refetchReviews();
                        }}
                        className="mt-2 btn-outline btn-sm"
                    >
                        Retry
                    </button>
                </div>
            ) : summaryLoading ? (
                <div className="skeleton h-10 w-2/3" />
            ) : (
                <div className="flex items-center gap-4 py-1">
                    <div className="text-center">
                        <p className="text-3xl font-semibold font-data text-fg dark:text-fg-dark">
                            {showAverage ? summary!.averageRating!.toFixed(1) : "—"}
                        </p>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${
                                        showAverage && i <= Math.round(summary!.averageRating!)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-border dark:text-border-dark"
                                    }`}
                                    strokeWidth={1.5}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                        <Users className="h-4 w-4" strokeWidth={2} />
                        {summary?.reviewCount ?? 0} review{(summary?.reviewCount ?? 0) === 1 ? "" : "s"}
                    </div>
                    {!showAverage && (summary?.reviewCount ?? 0) < 3 && (summary?.reviewCount ?? 0) > 0 && (
                        <span className="badge badge-neutral !text-[10px]">
                            Average hidden until 3 reviews
                        </span>
                    )}
                </div>
            )}

            <div className="mt-4 space-y-3">
                {reviewsLoading ? (
                    <div className="skeleton h-16" />
                ) : reviews && reviews.length > 0 ? (
                    reviews.slice(0, 4).map((review) => (
                        <div
                            key={review.id}
                            className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                    {review.renterName || "Verified renter"}
                                </p>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            className={`h-3 w-3 ${
                                                i <= review.rating
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-border dark:text-border-dark"
                                            }`}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                </div>
                            </div>
                            {review.comment && (
                                <p className="mt-1.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                                    {review.comment}
                                </p>
                            )}
                            <p className="mt-1.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                {formatDate(review.createdAt)}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                        No reviews yet. Verified renters can review you from the tenant portal.
                    </p>
                )}
            </div>
        </div>
    );
}

// features/tenant-portal/components/tenant-ratings-received.tsx
"use client";

import { BadgeCheck, Quote, Star, StarOff } from "lucide-react";
import { useReviewsAboutMeQuery, useReviewsAboutMeSummaryQuery } from "../hooks/use-tenant-portal-queries";
import { ReviewStatusBadge } from "@/features/reviews/components/review-status-badge";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

function StarDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                        i <= rating ? "fill-amber-400 text-amber-400" : "text-border dark:text-border-dark"
                    }`}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}

export function TenantRatingsReceived() {
    const { data: summary, isLoading: summaryLoading } = useReviewsAboutMeSummaryQuery();
    const { data: reviews, isLoading: reviewsLoading } = useReviewsAboutMeQuery();

    const showAverage = summary?.averageShown === true && summary.averageRating != null;
    const count = summary?.reviewCount ?? reviews?.length ?? 0;

    if (summaryLoading || reviewsLoading) {
        return (
            <div className="tenant-panel !p-6 sm:!p-7">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 animate-pulse" />
                    <div className="space-y-1.5">
                        <div className="tenant-skeleton-premium h-4 w-32 rounded" />
                        <div className="tenant-skeleton-premium h-3 w-48 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="tenant-panel !p-6 sm:!p-7">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                        <Star className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Your ratings as a renter
                        </h3>
                        <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                            {count === 0
                                ? "Not yet rated by any landlord"
                                : showAverage
                                ? `${summary!.averageRating!.toFixed(1)} average · ${count} landlord${count === 1 ? "" : "s"}`
                                : `Reviewed by ${count} landlord${count === 1 ? "" : "s"}`}
                        </p>
                    </div>
                </div>
                {count > 0 && (
                    <span className="shrink-0 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2.5 py-0.5 text-xs font-medium text-brand dark:text-brand-300 ring-1 ring-brand-200/50 dark:ring-brand-700/30">
                        {count}
                    </span>
                )}
            </div>

            {/* Empty state */}
            {count === 0 ? (
                <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border dark:border-border-dark py-8 px-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface dark:bg-surface-dark ring-1 ring-border dark:ring-border-dark">
                        <StarOff className="h-5 w-5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">No ratings yet</p>
                        <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark max-w-xs">
                            Your landlord can rate you once you have an active or completed lease. A strong renter reputation helps you secure future tenancies faster.
                        </p>
                    </div>
                </div>
            ) : (
                /* Review list */
                <div className="mt-5 space-y-3">
                    {(reviews ?? []).map((review) => (
                        <div
                            key={review.id}
                            className="relative overflow-hidden rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4"
                        >
                            <Quote
                                className="pointer-events-none absolute -top-1 -right-1 h-12 w-12 rotate-180 text-brand/10 dark:text-brand/15"
                                strokeWidth={1.5}
                                aria-hidden
                            />
                            <div className="relative flex flex-wrap items-center justify-between gap-2">
                                <p className="flex items-center gap-1.5 text-sm font-medium text-fg dark:text-fg-dark">
                                    Your landlord
                                    <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                                </p>
                                <StarDisplay rating={review.rating} />
                            </div>
                            {review.comment && (
                                <p className="relative mt-2 text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                                    {review.comment}
                                </p>
                            )}
                            <div className="relative mt-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                    {formatDate(review.createdAt)}
                                </p>
                                <ReviewStatusBadge status={review.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="relative mt-4 flex items-center gap-1.5 border-t border-border dark:border-border-dark pt-3 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                <Quote className="h-3 w-3" strokeWidth={2} />
                Ratings come from verified landlords who have hosted you.
            </p>
        </div>
    );
}

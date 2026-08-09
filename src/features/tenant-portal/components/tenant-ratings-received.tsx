// features/tenant-portal/components/tenant-ratings-received.tsx
"use client";

import { BadgeCheck, Loader2, Quote, Star } from "lucide-react";
import { useReviewsAboutMeQuery, useReviewsAboutMeSummaryQuery } from "../hooks/use-tenant-portal-queries";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

export function TenantRatingsReceived() {
    const { data: summary, isLoading: summaryLoading } = useReviewsAboutMeSummaryQuery();
    const { data: reviews, isLoading: reviewsLoading } = useReviewsAboutMeQuery();

    const showAverage = summary?.averageShown === true && summary.averageRating != null;
    const count = summary?.reviewCount ?? reviews?.length ?? 0;

    if (summaryLoading || reviewsLoading) {
        return (
            <div className="card-elevated p-6 sm:p-7">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
                        <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                    </div>
                    <div className="space-y-1.5">
                        <div className="skeleton h-4 w-32" />
                        <div className="skeleton h-3 w-48" />
                    </div>
                </div>
            </div>
        );
    }

    if (count === 0) {
        return null;
    }

    return (
        <div className="card-elevated p-6 sm:p-7">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                    <Star className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Your ratings as a renter</h3>
                    <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                        {showAverage
                            ? `${summary!.averageRating!.toFixed(1)} average from ${count} landlord${count === 1 ? "" : "s"}`
                            : `Reviewed by ${count} landlord${count === 1 ? "" : "s"}`}
                    </p>
                </div>
            </div>

            {(reviews ?? []).length > 0 && (
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
                            <div className="relative flex items-center justify-between gap-3">
                                <p className="flex items-center gap-1.5 text-sm font-medium text-fg dark:text-fg-dark">
                                    Your landlord
                                    <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                                </p>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            className={`h-3.5 w-3.5 ${
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
                                <p className="relative mt-2 text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                                    {review.comment}
                                </p>
                            )}
                            <p className="relative mt-2 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                {formatDate(review.createdAt)}
                            </p>
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
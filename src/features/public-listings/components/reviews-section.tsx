// features/public-listings/components/reviews-section.tsx
"use client";

import { BadgeCheck, MessageSquareHeart, Star } from "lucide-react";
import {
    usePublicPropertyReviewsQuery,
    usePublicUnitReviewsQuery,
} from "../queries/use-public-reviews-query";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

const RatingStars = ({ value, size = "h-3 w-3" }: { value: number; size?: string }) => (
    <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
            <Star
                key={i}
                className={`${size} ${
                    i <= Math.round(value)
                        ? "fill-amber-400 text-amber-400"
                        : "text-border dark:text-border-dark"
                }`}
                strokeWidth={1.5}
            />
        ))}
    </span>
);

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "RM";

export function ReviewsSection({ unitId, propertyId }: { unitId?: string; propertyId?: string }) {
    const unitReviews = usePublicUnitReviewsQuery(unitId ?? "");
    const propertyReviews = usePublicPropertyReviewsQuery(propertyId ?? "");

    const { data, isLoading, isError } = unitId ? unitReviews : propertyReviews;

    const showAverage = data?.averageShown === true && data.averageRating != null;

    return (
        <section className="card p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-100 dark:ring-brand-800/60">
                    <MessageSquareHeart className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                    <h2 className="section-header !text-sm !mb-0">Renter Reviews</h2>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                        Reviews from verified renters of this landlord
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="mt-5 space-y-3">
                    <div className="skeleton h-10 w-2/3" />
                    <div className="skeleton h-16" />
                </div>
            ) : isError || !data ? (
                <p className="mt-5 text-sm text-fg-muted dark:text-fg-muted-dark">
                    Reviews are not available for this listing.
                </p>
            ) : (
                <>
                    <div className="mt-5 flex items-center gap-5 rounded-2xl bg-ink/[0.03] dark:bg-white/[0.05] border border-border/70 dark:border-border-dark/70 px-5 py-4">
                        <div className="text-center shrink-0">
                            <p className="text-4xl font-semibold font-data text-fg dark:text-fg-dark leading-none">
                                {showAverage ? data.averageRating!.toFixed(1) : "—"}
                            </p>
                            {showAverage ? (
                                <div className="mt-2">
                                    <RatingStars value={data.averageRating!} size="h-3.5 w-3.5" />
                                </div>
                            ) : (
                                <p className="mt-1.5 text-[11px] font-medium text-fg-subtle dark:text-fg-subtle-dark">
                                    No score yet
                                </p>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                                {data.reviewCount} review{data.reviewCount === 1 ? "" : "s"}
                            </p>
                            <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                                {showAverage
                                    ? `Rated by verified renters who stayed at this ${unitId ? "unit" : "property"}.`
                                    : data.reviewCount > 0 && data.reviewCount < 3
                                      ? "Average shown once 3 reviews are received"
                                      : "This landlord is new to RentManager."}
                            </p>
                        </div>
                    </div>

                    {data.reviews.length > 0 ? (
                        <div className="mt-4 space-y-3">
                            {data.reviews.map((review, index) => {
                                const name = review.renterName || "Verified renter";
                                return (
                                    <div
                                        key={index}
                                        className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 transition-all duration-200 hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-800"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-semibold">
                                                    {initials(name)}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark truncate">
                                                        {name}
                                                    </p>
                                                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                        <BadgeCheck className="w-3 h-3" strokeWidth={2} />
                                                        Verified renter
                                                    </p>
                                                </div>
                                            </div>
                                            <RatingStars value={review.rating} />
                                        </div>
                                        {review.comment && (
                                            <p className="mt-3 text-sm text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                                                {review.comment}
                                            </p>
                                        )}
                                        <p className="mt-2.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                            {formatDate(review.createdAt)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="mt-5 text-sm text-fg-muted dark:text-fg-muted-dark">
                            No reviews yet — this landlord is new to RentManager.
                        </p>
                    )}
                </>
            )}
        </section>
    );
}
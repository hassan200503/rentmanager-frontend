// features/public-listings/components/reviews-section.tsx
"use client";

import { MessageSquareHeart, Star } from "lucide-react";
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

export function ReviewsSection({ unitId, propertyId }: { unitId?: string; propertyId?: string }) {
    const unitReviews = usePublicUnitReviewsQuery(unitId ?? "");
    const propertyReviews = usePublicPropertyReviewsQuery(propertyId ?? "");

    const { data, isLoading, isError } = unitId ? unitReviews : propertyReviews;

    const showAverage = data?.averageShown === true && data.averageRating != null;

    return (
        <section className="card p-6">
            <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                    <MessageSquareHeart className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <div>
                    <h2 className="section-header !text-sm">Renter Reviews</h2>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                        Reviews from verified renters of this landlord
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="mt-4 space-y-3">
                    <div className="skeleton h-10 w-2/3" />
                    <div className="skeleton h-16" />
                </div>
            ) : isError || !data ? (
                <p className="mt-4 text-sm text-fg-muted dark:text-fg-muted-dark">
                    Reviews are not available for this listing.
                </p>
            ) : (
                <>
                    <div className="mt-4 flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-semibold font-data text-fg dark:text-fg-dark">
                                {showAverage ? data.averageRating!.toFixed(1) : "—"}
                            </p>
                            {showAverage && (
                                <div className="mt-1">
                                    <RatingStars value={data.averageRating!} size="h-3.5 w-3.5" />
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            {data.reviewCount} review{data.reviewCount === 1 ? "" : "s"}
                            {!showAverage && data.reviewCount > 0 && data.reviewCount < 3 && (
                                <span className="block mt-1 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                    Average shown once 3 reviews are received
                                </span>
                            )}
                        </div>
                    </div>

                    {data.reviews.length > 0 ? (
                        <div className="mt-5 space-y-3">
                            {data.reviews.map((review, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                            {review.renterName || "Verified renter"}
                                        </p>
                                        <RatingStars value={review.rating} />
                                    </div>
                                    {review.comment && (
                                        <p className="mt-1.5 text-sm text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                                            {review.comment}
                                        </p>
                                    )}
                                    <p className="mt-1.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                        {formatDate(review.createdAt)}
                                    </p>
                                </div>
                            ))}
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

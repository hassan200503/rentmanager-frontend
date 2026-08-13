// features/reviews/components/platform-review-card.tsx
// V66 — "Rate RentManager": a user (landlord or renter) reviews the
// platform itself. Exactly one review per user; submitting again edits
// it in place and sends it back through moderation. Approved reviews
// feed the public testimonials wall.
"use client";

import { useState } from "react";
import {
    AlertTriangle,
    Loader2,
    MessageSquareHeart,
    ShieldCheck,
    Sparkles,
    Star,
} from "lucide-react";
import { toast } from "sonner";
import { useMyPlatformReviewQuery } from "../hooks/use-review-query";
import { useSubmitPlatformReviewMutation } from "../hooks/use-review-mutations";
import { reviewStatusMeta } from "../types/review-response";

const MAX_COMMENT_LENGTH = 1000;

const RATING_LABELS: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent",
};

function StarRating({ rating, onSelect, onHover }: {
    rating: number;
    onSelect: (v: number) => void;
    onHover: (v: number) => void;
}) {
    return (
        <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Rate RentManager out of 5 stars"
        >
            {[1, 2, 3, 4, 5].map((i) => (
                <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={rating === i}
                    aria-label={`${i} star${i === 1 ? "" : "s"}`}
                    onClick={() => onSelect(i)}
                    onMouseEnter={() => onHover(i)}
                    onMouseLeave={() => onHover(0)}
                    className="tenant-review-star-button group/star"
                >
                    <Star
                        className={`tenant-review-star ${
                            i <= rating
                                ? "is-active"
                                : "group-hover/star:text-amber-400/50"
                        }`}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
}

export function PlatformReviewCard() {
    const { data: myReview, isLoading, isError, refetch } = useMyPlatformReviewQuery();
    const submitMutation = useSubmitPlatformReviewMutation();

    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");

    const existing = myReview ?? null;
    const hasReview = existing != null;
    const selectedRating = rating > 0 ? rating : existing?.rating ?? 0;
    const defaultComment = comment !== "" ? comment : existing?.comment ?? "";
    const activeRating = hovered || selectedRating;
    const nearLimit = defaultComment.length >= MAX_COMMENT_LENGTH - 100;

    const handleSubmit = () => {
        if (selectedRating < 1 || selectedRating > 5) {
            toast.error("Pick a rating between 1 and 5 stars");
            return;
        }
        submitMutation.mutate(
            {
                rating: selectedRating,
                comment: defaultComment.trim() === "" ? null : defaultComment.trim(),
            },
            {
                onSuccess: (saved) => {
                    toast.success(
                        saved.status === "APPROVED" && hasReview
                            ? "Review updated — it will be moderated before it goes live again"
                            : "Thanks! Your review of RentManager was received"
                    );
                    setComment("");
                    setRating(0);
                    refetch();
                },
                onError: () => toast.error("Could not submit your review — please try again"),
            }
        );
    };

    return (
        <section className="tenant-review-panel">
            {/* Premium hairline accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

            {/* Header */}
            <div className="relative flex items-center gap-2.5">
                <div className="tenant-review-mark">
                    <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                    <h2 className="font-display text-sm font-bold text-fg dark:text-fg-dark">
                        Rate RentManager
                    </h2>
                    <p className="truncate text-[11px] text-fg-muted dark:text-fg-muted-dark">
                        Your feedback shapes the platform for landlords and renters
                    </p>
                </div>
                {hasReview && (
                    <span className={`tenant-review-status ${reviewStatusMeta[existing!.status].chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${reviewStatusMeta[existing!.status].dot}`} />
                        {existing!.status === "APPROVED"
                            ? "Live"
                            : existing!.status === "PENDING"
                              ? "Moderating"
                              : "Hidden"}
                    </span>
                )}
            </div>

            <div className="mt-4">
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="skeleton h-7 w-44" />
                        <div className="skeleton h-16" />
                    </div>
                ) : isError ? (
                    <div className="tenant-review-error">
                        <AlertTriangle className="mx-auto h-5 w-5 text-warning" strokeWidth={2} />
                        <p className="mt-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                            Couldn&#39;t load your review.
                        </p>
                        <button onClick={() => refetch()} className="tenant-secondary-action mt-3">
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Current rating — compact inline summary */}
                        {hasReview && (
                            <div className="tenant-review-current">
                                <div className="flex min-w-0 items-center gap-2">
                                    <MessageSquareHeart className="h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
                                    <span className="truncate text-xs text-fg-muted dark:text-fg-muted-dark">
                                        {existing!.comment
                                            ? `“${existing!.comment}”`
                                            : "You rated the platform"}
                                    </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            className={`h-3 w-3 ${
                                                i <= existing!.rating
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-border dark:text-border-dark"
                                            }`}
                                            strokeWidth={1.5}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rating row */}
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                            <StarRating
                                rating={activeRating}
                                onSelect={setRating}
                                onHover={setHovered}
                            />
                            <span
                                className={`font-data text-sm font-bold transition-colors ${
                                    activeRating > 0
                                        ? "text-fg dark:text-fg-dark"
                                        : "text-fg-subtle dark:text-fg-subtle-dark"
                                }`}
                            >
                                {activeRating > 0
                                    ? `${activeRating}/5 · ${RATING_LABELS[activeRating]}`
                                    : hasReview
                                      ? `${existing!.rating}/5`
                                      : "Tap a star to rate"}
                            </span>
                        </div>

                        {/* Comment */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="platform-review-comment"
                                    className="text-[11px] font-semibold uppercase text-fg-muted dark:text-fg-muted-dark"
                                >
                                    Your experience (optional)
                                </label>
                                <span
                                    className={`font-mono-nums text-[11px] ${
                                        nearLimit
                                            ? "text-warning"
                                            : "text-fg-subtle dark:text-fg-subtle-dark"
                                    }`}
                                >
                                    {defaultComment.length}/{MAX_COMMENT_LENGTH}
                                </span>
                            </div>
                            <textarea
                                id="platform-review-comment"
                                value={defaultComment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={MAX_COMMENT_LENGTH}
                                rows={2}
                                placeholder="What worked well? What could be better?"
                                className="tenant-review-textarea"
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                            <p className="flex items-center gap-1.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2} />
                                {hasReview
                                    ? "Updates are re-moderated before going live."
                                    : "Moderated before going live."}
                                <span className="hidden text-fg-subtle/60 sm:inline">
                                    {hasReview ? "·" : ""} One review per account — approved reviews join the testimonials.
                                </span>
                            </p>
                            <button
                                type="button"
                                disabled={submitMutation.isPending}
                                onClick={handleSubmit}
                                className="tenant-primary-action tenant-review-submit"
                            >
                                {submitMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Star className="h-3.5 w-3.5 fill-white" strokeWidth={2} />
                                        {hasReview ? "Update my review" : "Submit review"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

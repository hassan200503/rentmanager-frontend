// features/reviews/components/platform-review-card.tsx
// V66 — "Rate RentManager": a user (landlord or renter) reviews the
// platform itself. Exactly one review per user; submitting again edits
// it in place and sends it back through moderation. Approved reviews
// feed the public testimonials wall.
"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { useMyPlatformReviewQuery } from "../hooks/use-review-query";
import { useSubmitPlatformReviewMutation } from "../hooks/use-review-mutations";
import { reviewStatusMeta } from "../types/review-response";

const MAX_COMMENT_LENGTH = 1000;

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
        <div className="card animate-fade-in-up">
            <div className="flex items-center justify-between gap-3">
                <h2 className="section-header inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand" strokeWidth={2} />
                    Rate RentManager
                </h2>
                {hasReview && (
                    <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${reviewStatusMeta[existing!.status].chip}`}
                    >
                        {existing!.status === "APPROVED"
                            ? "Live on the testimonials wall"
                            : existing!.status === "PENDING"
                              ? "Awaiting moderation"
                              : "Hidden"}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="mt-4 space-y-2">
                    <div className="skeleton h-8 w-48" />
                    <div className="skeleton h-20" />
                </div>
            ) : isError ? (
                <div className="mt-4 p-4 text-center">
                    <AlertTriangle className="mx-auto h-6 w-6 text-warning" strokeWidth={2} />
                    <p className="mt-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                        Couldn&#39;t load your review.
                    </p>
                    <button onClick={() => refetch()} className="mt-2 btn-outline btn-sm">
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    {hasReview && (
                        <p className="mt-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                            You&rsquo;ve rated the platform{" "}
                            <span className="font-semibold text-fg dark:text-fg-dark">
                                {existing!.rating}/5
                            </span>
                            . Feel free to update it anytime.
                        </p>
                    )}

                    <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                            Your rating
                        </p>
                        <div
                            className="mt-2 flex items-center gap-1"
                            role="radiogroup"
                            aria-label="Rate RentManager out of 5 stars"
                        >
                            {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    role="radio"
                                    aria-checked={selectedRating === i}
                                    aria-label={`${i} star${i === 1 ? "" : "s"}`}
                                    onClick={() => setRating(i)}
                                    onMouseEnter={() => setHovered(i)}
                                    onMouseLeave={() => setHovered(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={`h-7 w-7 ${
                                            i <= (hovered || selectedRating)
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-border dark:text-border-dark"
                                        }`}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm font-medium text-fg dark:text-fg-dark">
                                {selectedRating > 0 ? `${selectedRating}/5` : "—"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label htmlFor="platform-review-comment" className="text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                            Your experience (optional)
                        </label>
                        <textarea
                            id="platform-review-comment"
                            value={defaultComment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={MAX_COMMENT_LENGTH}
                            rows={3}
                            placeholder="What worked well? What could be better?"
                            className="mt-2 w-full rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle focus:border-brand focus:outline-none"
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                {hasReview ? "Updates are re-moderated before going live." : "Your review is moderated before going live."}
                            </p>
                            <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                {defaultComment.length}/{MAX_COMMENT_LENGTH}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={submitMutation.isPending}
                        onClick={handleSubmit}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-60"
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        ) : (
                            <Star className="h-4 w-4 fill-white" strokeWidth={2} />
                        )}
                        {hasReview ? "Update my review" : "Submit review"}
                    </button>
                </>
            )}
        </div>
    );
}
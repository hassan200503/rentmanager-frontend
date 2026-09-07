// features/tenant-portal/components/tenant-review-card.tsx
"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { BadgeCheck, Loader2, MessageSquareHeart, Quote, Star } from "lucide-react";
import { toast } from "sonner";
import { tenantPortalApi } from "../api/tenant-portal-api";
import { tenantPortalKeys, useMyReviewQuery } from "../hooks/use-tenant-portal-queries";
import { ReviewStatusBadge } from "@/features/reviews/components/review-status-badge";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

const StarRow = ({ value, onChange, interactive }: {
    value: number;
    onChange?: (v: number) => void;
    interactive?: boolean;
}) => (
    <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => {
            const star = (
                <Star
                    key={i}
                    className={`${interactive ? "h-7 w-7" : "h-6 w-6"} transition-all duration-200 ${
                        i <= value
                            ? "fill-amber-400 text-amber-400"
                            : "text-border dark:text-border-dark"
                    }`}
                    strokeWidth={1.5}
                />
            );
            if (!interactive) return star;
            return (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange?.(i)}
                    aria-label={`Rate ${i} star${i === 1 ? "" : "s"}`}
                    className="rounded-md p-0.5 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                >
                    {star}
                </button>
            );
        })}
    </div>
);

export function TenantReviewCard() {
    const queryClient = useQueryClient();
    const { data: myReview, isLoading } = useMyReviewQuery();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const mutation = useMutation({
        mutationFn: (payload: { rating: number; comment: string }) =>
            tenantPortalApi.submitReview(payload.rating, payload.comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.myReview() });
            toast.success("Review submitted — thank you for the feedback");
            setRating(0);
            setComment("");
        },
        onError: () => {
            toast.error("Failed to submit review. Please try again.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating < 1) return;
        mutation.mutate({ rating, comment: comment.trim() });
    };

    return (
        <div className="tenant-panel !p-6 sm:!p-7">
            <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                    <MessageSquareHeart className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">
                        Rate your landlord
                    </h3>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                        Only verified renters can review — your name shows as a first name publicly
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="tenant-skeleton-premium h-24 w-full mt-4 rounded-xl" />
            ) : myReview ? (
                <div className="mt-5 relative rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 sm:p-5 overflow-hidden">
                    <Quote className="absolute -top-1 -right-1 h-14 w-14 text-brand/10 dark:text-brand/15 rotate-180 pointer-events-none" strokeWidth={1.5} aria-hidden />
                    <div className="relative flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-fg dark:text-fg-dark">
                            Your review
                            <ReviewStatusBadge status={myReview.status} />
                        </p>
                        <StarRow value={myReview.rating} />
                    </div>
                    {myReview.comment && (
                        <p className="relative mt-2.5 text-sm text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                            {myReview.comment}
                        </p>
                    )}
                    <p className="relative mt-2 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        Submitted {formatDate(myReview.createdAt)}
                    </p>
                    <p className="relative mt-3 text-xs text-fg-subtle dark:text-fg-subtle-dark border-t border-border dark:border-border-dark pt-3 flex items-center gap-1.5">
                        <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                        One review per landlord — thank you for your feedback.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                    <div className="space-y-2">
                        <label className="form-label">Your rating <span className="text-danger">*</span></label>
                        <StarRow value={rating} onChange={setRating} interactive />
                        {rating === 0 && (
                            <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                Tap a star to rate
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="form-label !mb-0">Comment</label>
                            <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark font-mono-nums">{comment.length}/1000</span>
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What was it like renting from this landlord?"
                            className="form-input min-h-[96px] resize-y"
                            rows={3}
                            maxLength={1000}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={rating < 1 || mutation.isPending}
                            className="btn-primary"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Star className="h-4 w-4" strokeWidth={2} />
                                    Submit Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

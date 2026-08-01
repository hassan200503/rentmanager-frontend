// features/tenant-portal/components/tenant-review-card.tsx
"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2, MessageSquareHeart, Star } from "lucide-react";
import { toast } from "sonner";
import { tenantPortalApi } from "../api/tenant-portal-api";
import { tenantPortalKeys, useMyReviewQuery } from "../hooks/use-tenant-portal-queries";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

const StarRow = ({ value, onChange, interactive }: {
    value: number;
    onChange?: (v: number) => void;
    interactive?: boolean;
}) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => {
            const star = (
                <Star
                    key={i}
                    className={`h-6 w-6 transition-colors ${
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
                    className="transition-transform hover:scale-110"
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
        <div className="card-elevated p-6">
            <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                    <MessageSquareHeart className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">
                        Rate your landlord
                    </h3>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                        Only verified renters can review — your name shows as a first name publicly
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="skeleton h-24 w-full mt-4" />
            ) : myReview ? (
                <div className="mt-4 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">
                            Your review
                        </p>
                        <StarRow value={myReview.rating} />
                    </div>
                    {myReview.comment && (
                        <p className="mt-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                            {myReview.comment}
                        </p>
                    )}
                    <p className="mt-2 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        Submitted {formatDate(myReview.createdAt)}
                    </p>
                    <p className="mt-3 text-xs text-fg-subtle dark:text-fg-subtle-dark border-t border-border dark:border-border-dark pt-3">
                        One review per landlord — thank you for your feedback.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <label className="form-label">Your rating *</label>
                        <StarRow value={rating} onChange={setRating} interactive />
                        {rating === 0 && (
                            <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                Tap a star to rate
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="form-label">Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What was it like renting from this landlord?"
                            className="form-input min-h-[90px] resize-y"
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

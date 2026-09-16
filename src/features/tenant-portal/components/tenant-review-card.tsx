// features/tenant-portal/components/tenant-review-card.tsx
"use client";

import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
    BadgeCheck,
    Edit2,
    Loader2,
    MessageSquareHeart,
    Quote,
    Star,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { tenantPortalApi } from "../api/tenant-portal-api";
import { tenantPortalKeys, useMyReviewQuery } from "../hooks/use-tenant-portal-queries";
import { ReviewStatusBadge } from "@/features/reviews/components/review-status-badge";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"] as const;

function StarRow({
    value,
    onChange,
    interactive,
}: {
    value: number;
    onChange?: (v: number) => void;
    interactive?: boolean;
}) {
    const [hover, setHover] = useState(0);
    const displayValue = interactive ? (hover || value) : value;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => {
                    const filled = i <= displayValue;
                    const starEl = (
                        <Star
                            key={i}
                            className={`${interactive ? "h-7 w-7" : "h-6 w-6"} transition-all duration-200 ${
                                filled ? "fill-amber-400 text-amber-400" : "text-border dark:text-border-dark"
                            }`}
                            strokeWidth={1.5}
                        />
                    );
                    if (!interactive) return starEl;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onChange?.(i)}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(0)}
                            aria-label={`Rate ${i} star${i === 1 ? "" : "s"} — ${STAR_LABELS[i]}`}
                            className="rounded-md p-0.5 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                        >
                            {starEl}
                        </button>
                    );
                })}
            </div>
            {interactive && (
                <p
                    className={`h-4 text-xs ${
                        displayValue > 0
                            ? "font-medium text-amber-600 dark:text-amber-400"
                            : "text-fg-subtle dark:text-fg-subtle-dark"
                    }`}
                >
                    {displayValue > 0 ? STAR_LABELS[displayValue] : "Tap a star to rate"}
                </p>
            )}
        </div>
    );
}

export function TenantReviewCard() {
    const queryClient = useQueryClient();
    const { data: myReview, isLoading } = useMyReviewQuery();

    const [isEditing, setIsEditing] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const isUpdate = myReview != null;

    const mutation = useMutation({
        mutationFn: (payload: { rating: number; comment: string }) =>
            tenantPortalApi.submitReview(payload.rating, payload.comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.myReview() });
            toast.success(
                isUpdate ? "Review updated — it will be moderated before going live again" : "Review submitted — thank you for the feedback"
            );
            setIsEditing(false);
            setRating(0);
            setComment("");
        },
        onError: () => {
            toast.error("Failed to submit review. Please try again.");
        },
    });

    const startEdit = () => {
        if (myReview) {
            setRating(myReview.rating);
            setComment(myReview.comment ?? "");
        }
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setRating(0);
        setComment("");
    };

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
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Rate your landlord</h3>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                        Only verified renters can review
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="tenant-skeleton-premium h-24 w-full mt-4 rounded-xl" />
            ) : myReview && !isEditing ? (
                /* ── Existing review (read-only) ── */
                <div className="mt-5 relative rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4 sm:p-5 overflow-hidden">
                    <Quote
                        className="absolute -top-1 -right-1 h-14 w-14 text-brand/10 dark:text-brand/15 rotate-180 pointer-events-none"
                        strokeWidth={1.5}
                        aria-hidden
                    />
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm font-semibold text-fg dark:text-fg-dark">
                                Your review
                                <ReviewStatusBadge status={myReview.status} />
                            </p>
                            <StarRow value={myReview.rating} />
                        </div>
                        <button
                            type="button"
                            onClick={startEdit}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2.5 py-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark transition-colors hover:border-brand/40 hover:text-brand dark:hover:text-brand-300"
                        >
                            <Edit2 className="h-3 w-3" strokeWidth={2} />
                            Edit
                        </button>
                    </div>

                    {myReview.comment && (
                        <p className="relative mt-2.5 text-sm text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                            {myReview.comment}
                        </p>
                    )}

                    <p className="relative mt-2 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        Submitted {formatDate(myReview.createdAt)}
                    </p>

                    {myReview.status === "PENDING" && (
                        <p className="relative mt-3 rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                            Under review — your landlord will see this once it&apos;s approved, usually within 24 hours.
                        </p>
                    )}

                    {myReview.status === "HIDDEN" && (
                        <p className="relative mt-3 rounded-lg border border-red-200 dark:border-red-700/40 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                            This review wasn&apos;t approved. Contact support if you believe this is an error.
                        </p>
                    )}

                    {myReview.status === "APPROVED" && (
                        <p className="relative mt-3 flex items-center gap-1.5 border-t border-border dark:border-border-dark pt-3 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                            <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                            Approved and visible to other renters.
                        </p>
                    )}
                </div>
            ) : (
                /* ── Submit / edit form ── */
                <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                    {isEditing && (
                        <div className="flex items-center justify-between rounded-lg border border-brand-200/60 dark:border-brand-700/40 bg-brand-50 dark:bg-brand-900/20 px-3 py-2">
                            <p className="text-xs font-medium text-brand dark:text-brand-300">
                                Editing your review — changes go back through moderation
                            </p>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                aria-label="Cancel edit"
                                className="text-fg-subtle dark:text-fg-subtle-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                            >
                                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="form-label">
                            Your rating <span className="text-danger">*</span>
                        </label>
                        <StarRow value={rating} onChange={setRating} interactive />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="form-label !mb-0">Comment</label>
                            <span
                                className={`font-mono-nums text-[11px] ${
                                    comment.length > 900
                                        ? "text-warning"
                                        : "text-fg-subtle dark:text-fg-subtle-dark"
                                }`}
                            >
                                {comment.length}/1000
                            </span>
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
                        {isEditing && (
                            <button type="button" onClick={cancelEdit} className="btn-ghost text-sm">
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={rating < 1 || mutation.isPending}
                            className="btn-primary"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                    {isEditing ? "Updating..." : "Submitting..."}
                                </>
                            ) : (
                                <>
                                    <Star className="h-4 w-4" strokeWidth={2} />
                                    {isEditing ? "Update Review" : "Submit Review"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

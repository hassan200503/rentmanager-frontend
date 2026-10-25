// features/reviews/components/rate-renter-card.tsx
// "Rate your renter" — a premium write/edit surface for landlord → renter
// reviews, mirroring PlatformReviewCard. One review per renter; submitting
// again edits it in place and sends it back through moderation.
"use client";

import { useMemo, useState } from "react";
import {
    Loader2,
    MessageSquareHeart,
    ShieldCheck,
    Sparkles,
    Star,
    UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useLeaseSearchQuery } from "@/features/lease/queries/use-lease-search-query";
import type { LeaseStatus, LeaseSummaryResponse } from "@/features/lease/types/lease-response";
import { useRenterReviewsQuery } from "../hooks/use-review-query";
import { useSubmitRenterReviewMutation } from "../hooks/use-review-mutations";
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
            aria-label="Rate this renter out of 5 stars"
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

// Every lease the landlord has ever had, regardless of status — the
// eligibility filter below needs the full history (a renter can be
// reviewable from an EXPIRED/TERMINATED lease, not just an active one).
// Matches the "give me everything" safety-net size used elsewhere in this
// codebase (see dashboard/archive/page.tsx) rather than true pagination.
const RENTER_OPTIONS_PAGE_SIZE = 1000;

export function RateRenterCard() {
    const { data: leases, isLoading: leasesLoading } = useLeaseSearchQuery({ size: RENTER_OPTIONS_PAGE_SIZE });
    const { data: renterReviews, isLoading: reviewsLoading, refetch } = useRenterReviewsQuery();
    const submit = useSubmitRenterReviewMutation();

    const [profileId, setProfileId] = useState("");
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState("");

    const renterOptions = useMemo(() => {
        // Mirror the backend verification rule: a renter is only reviewable
        // when there is (or was) a real tenancy — ACTIVE / RENEWED / EXPIRED /
        // TERMINATED / SUSPENDED. Draft-ish statuses (DRAFT, PENDING_*,
        // AWAITING_DEPOSIT, CANCELLED) never qualify, so offering them here
        // would only produce a server-side rejection.
        const verifiedStatuses = new Set<LeaseStatus>([
            "ACTIVE",
            "RENEWED",
            "EXPIRED",
            "TERMINATED",
            "SUSPENDED",
        ]);
        const bestByProfile = new Map<string, LeaseSummaryResponse>();
        for (const lease of leases?.content ?? []) {
            if (!lease.tenantProfileId) continue;
            if (!verifiedStatuses.has(lease.status)) continue;
            const current = bestByProfile.get(lease.tenantProfileId);
            if (!current || (current.status !== "ACTIVE" && lease.status === "ACTIVE")) {
                bestByProfile.set(lease.tenantProfileId, lease);
            }
        }
        return [...bestByProfile.values()].map((lease) => ({
            tenantProfileId: lease.tenantProfileId!,
            label: lease.tenantFullName ?? "Renter",
        }));
    }, [leases]);

    const existing = useMemo(
        () => (renterReviews ?? []).find((r) => r.tenantProfileId === profileId) ?? null,
        [renterReviews, profileId]
    );
    const hasReview = existing != null;

    // Editing state resets when the renter changes, so an existing review
    // is never accidentally sent to the wrong renter.
    const selectedRating = rating > 0 ? rating : existing?.rating ?? 0;
    const defaultComment = comment !== "" ? comment : existing?.comment ?? "";
    const activeRating = hovered || selectedRating;
    const nearLimit = defaultComment.length >= MAX_COMMENT_LENGTH - 100;

    const handleSelectRenter = (value: string) => {
        setProfileId(value);
        setRating(0);
        setComment("");
        setHovered(0);
    };

    const handleSubmit = () => {
        if (!profileId) {
            toast.error("Pick a renter to review");
            return;
        }
        if (selectedRating < 1 || selectedRating > 5) {
            toast.error("Pick a rating between 1 and 5 stars");
            return;
        }
        submit.mutate(
            {
                tenantProfileId: profileId,
                rating: selectedRating,
                comment: defaultComment.trim() === "" ? null : defaultComment.trim(),
            },
            {
                onSuccess: (saved) => {
                    toast.success(
                        saved.status === "APPROVED" && hasReview
                            ? "Review updated — it will be moderated before it goes live again"
                            : hasReview
                              ? "Review updated — it will be moderated before it goes live again"
                              : "Review submitted — it will appear once approved"
                    );
                    setComment("");
                    setRating(0);
                    refetch();
                },
                onError: () => toast.error("Could not submit the review — please try again"),
            }
        );
    };

    const isLoading = leasesLoading || reviewsLoading;

    return (
        <section className="tenant-review-panel">
            {/* Premium hairline accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

            {/* Header */}
            <div className="relative flex items-center gap-2.5">
                <div className="tenant-review-mark">
                    <UserRound className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                    <h2 className="font-display text-sm font-bold text-fg dark:text-fg-dark">
                        Rate your renter
                    </h2>
                    <p className="truncate text-[11px] text-fg-muted dark:text-fg-muted-dark">
                        One review per renter — approved reviews help other landlords
                    </p>
                </div>
                {hasReview && (
                    <span className={`tenant-review-status inline-flex ${reviewStatusMeta[existing!.status].chip}`}>
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
                        <div className="skeleton h-9 w-full" />
                        <div className="skeleton h-7 w-44" />
                        <div className="skeleton h-16" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Renter picker */}
                        <div>
                            <label
                                htmlFor="renter-review-profile"
                                className="text-[11px] font-semibold uppercase text-fg-muted dark:text-fg-muted-dark"
                            >
                                Renter <span className="text-danger">*</span>
                            </label>
                            <select
                                id="renter-review-profile"
                                value={profileId}
                                onChange={(e) => handleSelectRenter(e.target.value)}
                                disabled={renterOptions.length === 0}
                                className="tenant-input"
                            >
                                <option value="">
                                    {renterOptions.length === 0
                                        ? "No reviewable renters yet"
                                        : "Select a renter…"}
                                </option>
                                {renterOptions.map((o) => (
                                    <option key={o.tenantProfileId} value={o.tenantProfileId}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {profileId && (
                            <>
                                {/* Current review — compact inline summary */}
                                {hasReview && (
                                    <div className="tenant-review-current">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <MessageSquareHeart className="h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
                                            <span className="truncate text-xs text-fg-muted dark:text-fg-muted-dark">
                                                {existing!.comment
                                                    ? `“${existing!.comment}”`
                                                    : "You rated this renter"}
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
                                              ? `${existing!.rating}/5 · ${RATING_LABELS[existing!.rating]}`
                                              : "Tap a star to rate"}
                                    </span>
                                </div>

                                {/* Comment */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="renter-review-comment"
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
                                        id="renter-review-comment"
                                        value={defaultComment}
                                        onChange={(e) => setComment(e.target.value)}
                                        maxLength={MAX_COMMENT_LENGTH}
                                        rows={2}
                                        placeholder="Timely payments, unit care, communication…"
                                        className="tenant-review-textarea"
                                    />
                                </div>
                            </>
                        )}

                        {!profileId && (
                            <div className="tenant-review-empty">
                                <Sparkles className="h-4 w-4 text-brand" strokeWidth={2} />
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    Pick a renter above to leave — or update — their review.
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        {profileId && (
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                                <p className="flex items-center gap-1.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2} />
                                    {hasReview
                                        ? "Updates are re-moderated before going live."
                                        : "Moderated before going live."}
                                    <span className="hidden text-fg-subtle/60 sm:inline">
                                        {hasReview ? "·" : ""} One review per renter — it&apos;s public once approved.
                                    </span>
                                </p>
                                <button
                                    type="button"
                                    disabled={submit.isPending}
                                    onClick={handleSubmit}
                                    className="tenant-primary-action tenant-review-submit"
                                >
                                    {submit.isPending ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Star className="h-3.5 w-3.5 fill-white" strokeWidth={2} />
                                            {hasReview ? "Update review" : "Submit review"}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

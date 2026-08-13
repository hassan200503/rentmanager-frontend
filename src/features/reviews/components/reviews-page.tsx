// features/reviews/components/reviews-page.tsx
// Landlord Reviews hub: ratings received, moderation state across BOTH
// review directions (renter reviews + the account's platform review),
// premium write cards for rating renters and RentManager, and the
// Received / Given lists.
"use client";

import { useState } from "react";
import {
    AlertTriangle,
    MessageSquarePlus,
    Quote,
    Sparkles,
    Star,
    UserRound,
    Users,
} from "lucide-react";
import {
    useMyPlatformReviewQuery,
    useReviewCountsQuery,
    useRenterReviewsQuery,
    useReviewsQuery,
    useReviewSummaryQuery,
} from "../hooks/use-review-query";
import { ReviewStatusBadge } from "./review-status-badge";
import { PlatformReviewCard } from "./platform-review-card";
import { RateRenterCard } from "./rate-renter-card";
import { reviewStatusOrder, type PlatformReviewResponse, type ReviewStatus } from "../types/review-response";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

type Tab = "received" | "given";
type Filter = "ALL" | ReviewStatus;

function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`${size} ${
                        i <= value ? "fill-amber-400 text-amber-400" : "text-border dark:text-border-dark"
                    }`}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}

interface RenterReviewCardProps {
    comment: string | null;
    rating: number;
    renterName: string | null;
    createdAt: string;
    status: ReviewStatus;
}

function RenterReviewCard({ comment, rating, renterName, createdAt, status }: RenterReviewCardProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
            <Quote className="pointer-events-none absolute -top-1 -right-1 h-14 w-14 rotate-180 text-brand/10 dark:text-brand/15" strokeWidth={1.5} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                        <UserRound className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <p className="truncate text-sm font-medium text-fg dark:text-fg-dark">
                        {renterName || "Verified renter"}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <Stars value={rating} />
                    <ReviewStatusBadge status={status} />
                </div>
            </div>
            {comment && (
                <p className="relative mt-2 text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                    {comment}
                </p>
            )}
            <p className="relative mt-2 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                {formatDate(createdAt)}
            </p>
        </div>
    );
}

/** The account's review of RentManager, rendered inside the Given list. */
function PlatformReviewRow({ review }: { review: PlatformReviewResponse }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-border dark:border-border-dark bg-gradient-to-br from-brand/[0.04] to-transparent dark:from-brand/[0.07] p-4">
            <Sparkles className="pointer-events-none absolute -top-1 -right-1 h-14 w-14 rotate-12 text-brand/10 dark:text-brand/15" strokeWidth={1.5} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-600 text-white shadow-sm shadow-brand/20">
                        <Sparkles className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <p className="truncate text-sm font-medium text-fg dark:text-fg-dark">
                        RentManager
                        <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand dark:text-brand-400">
                            The platform
                        </span>
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <Stars value={review.rating} />
                    <ReviewStatusBadge status={review.status} />
                </div>
            </div>
            {review.comment && (
                <p className="relative mt-2 text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                    {review.comment}
                </p>
            )}            <p className="relative mt-2 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                {formatDate(review.createdAt)}
            </p>
        </div>
    );
}

const FILTERS: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All" },
    ...reviewStatusOrder.map((s) => ({ key: s as Filter, label: reviewMetaLabel(s) })),
];

function reviewMetaLabel(status: ReviewStatus): string {
    switch (status) {
        case "APPROVED":
            return "Approved";
        case "PENDING":
            return "Pending";
        default:
            return "Hidden";
    }
}

/* ── Page ──────────────────────────────────────────────────── */

export function ReviewsPage() {
    const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useReviewSummaryQuery();
    const { data: counts, isLoading: countsLoading, isError: countsError, refetch: refetchCounts } = useReviewCountsQuery();
    const { data: reviews, isLoading: reviewsLoading, isError: reviewsError, refetch: refetchReviews } = useReviewsQuery();
    const { data: renterReviews, isLoading: renterLoading, isError: renterError, refetch: refetchRenter } = useRenterReviewsQuery();
    const { data: myPlatformReview } = useMyPlatformReviewQuery();

    const [tab, setTab] = useState<Tab>("received");
    const [filter, setFilter] = useState<Filter>("ALL");

    const loading = summaryLoading || countsLoading || reviewsLoading || renterLoading;
    const anyError = summaryError || countsError || reviewsError || renterError;
    const refetchAll = () => {
        refetchSummary();
        refetchCounts();
        refetchReviews();
        refetchRenter();
    };

    const showAverage = summary?.averageShown === true && summary.averageRating != null;

    // Moderation state spans BOTH review directions: renter reviews
    // (backend counts) plus this account's platform review.
    const platformStatus = myPlatformReview?.status ?? null;
    const moderationCounts = {
        approved: (counts?.approvedCount ?? 0) + (platformStatus === "APPROVED" ? 1 : 0),
        pending: (counts?.pendingCount ?? 0) + (platformStatus === "PENDING" ? 1 : 0),
        hidden: (counts?.hiddenCount ?? 0) + (platformStatus === "HIDDEN" ? 1 : 0),
    };

    const given = renterReviews ?? [];
    const givenFiltered = filter === "ALL" ? given : given.filter((r) => r.status === filter);
    const platformShown = myPlatformReview != null && (filter === "ALL" || myPlatformReview.status === filter);
    const givenTotal = given.length + (myPlatformReview ? 1 : 0);

    return (
        <div className="space-y-6">
            {/* Error / loading banner */}
            {anyError ? (
                <div className="card p-6 text-center">
                    <AlertTriangle className="mx-auto h-10 w-10 text-danger" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-medium text-fg dark:text-fg-dark">Failed to load reviews</p>
                    <button onClick={refetchAll} className="mt-2 btn-outline btn-sm">
                        Retry
                    </button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="skeleton h-28" />
                    <div className="skeleton h-28" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Ratings received */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                                    Ratings received
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-3xl font-semibold text-fg dark:text-fg-dark">
                                    {showAverage ? summary!.averageRating!.toFixed(1) : "—"}
                                    <Stars value={showAverage ? summary!.averageRating! : 0} size="h-4 w-4" />
                                </div>
                            </div>
                            <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 px-3 py-2 text-brand-700 dark:text-brand-300">
                                <p className="flex items-center gap-1.5 text-2xl font-semibold">
                                    <Users className="h-5 w-5" strokeWidth={2} />
                                    {summary?.reviewCount ?? 0}
                                </p>
                                <p className="text-[10px] font-medium uppercase tracking-wider">
                                    {summary?.reviewCount === 1 ? "review" : "reviews"}
                                </p>
                            </div>
                        </div>
                        {!showAverage && (summary?.reviewCount ?? 0) >= 1 && (summary?.reviewCount ?? 0) < 3 && (
                            <p className="mt-3 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                Your average is revealed once you reach 3 approved reviews.
                            </p>
                        )}
                    </div>

                    {/* Moderation state — both directions */}
                    <div className="card p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                            Moderation state
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                            {reviewStatusOrder.map((status) => (
                                <div key={status} className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-center">
                                    <p className="text-2xl font-semibold text-fg dark:text-fg-dark">
                                        {status === "APPROVED" ? moderationCounts.approved : status === "PENDING" ? moderationCounts.pending : moderationCounts.hidden}
                                    </p>
                                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                        {reviewMetaLabel(status)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle dark:text-fg-subtle-dark">
                            Covers your renter reviews and your RentManager review. Reviews go live only after platform approval.
                        </p>
                    </div>
                </div>
            )}

            {/* Write surfaces — rate a renter, rate the platform */}
            <section className="pt-1">
                <div className="mb-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border dark:via-border-dark dark:to-border-dark" aria-hidden="true" />
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle dark:text-fg-subtle-dark">
                        <Sparkles className="h-3 w-3 text-brand" strokeWidth={2.5} aria-hidden="true" />
                        Rate &amp; review
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border dark:via-border-dark dark:to-border-dark" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <RateRenterCard />
                    <PlatformReviewCard />
                </div>
            </section>

            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-1">
                    {(
                        [
                            { key: "received" as Tab, label: `Received (${(reviews ?? []).length})` },
                            { key: "given" as Tab, label: `Given (${givenTotal})` },
                        ]
                    ).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                tab === t.key
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {tab === "given" && (
                    <div className="flex items-center gap-1 rounded-xl bg-surface dark:bg-surface-dark p-1">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                    filter === f.key
                                        ? "bg-brand text-white shadow-sm"
                                        : "text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lists */}
            {tab === "received" ? (
                <div className="space-y-3">
                    {(reviews ?? []).length === 0 ? (
                        <div className="card p-8 text-center">
                            <Quote className="mx-auto h-8 w-8 text-fg-subtle opacity-60" strokeWidth={1.5} />
                            <p className="mt-3 text-sm font-medium text-fg dark:text-fg-dark">No reviews yet</p>
                            <p className="mt-1 text-sm text-fg-muted dark:text-fg-muted-dark">
                                Verified renters can review you from the tenant portal.
                            </p>
                        </div>
                    ) : (
                        (reviews ?? []).map((review) => (
                            <RenterReviewCard
                                key={review.id}
                                renterName={review.renterName}
                                rating={review.rating}
                                comment={review.comment}
                                status={review.status}
                                createdAt={review.createdAt}
                            />
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {myPlatformReview && platformShown && (
                        <PlatformReviewRow review={myPlatformReview} />
                    )}
                    {givenFiltered.map((review) => (
                        <RenterReviewCard
                            key={review.id}
                            renterName={review.renterName}
                            rating={review.rating}
                            comment={review.comment}
                            status={review.status}
                            createdAt={review.createdAt}
                        />
                    ))}
                    {givenFiltered.length === 0 && !platformShown && (
                        <div className="card p-8 text-center">
                            <MessageSquarePlus className="mx-auto h-8 w-8 text-fg-subtle opacity-60" strokeWidth={1.5} />
                            <p className="mt-3 text-sm font-medium text-fg dark:text-fg-dark">
                                {filter === "ALL" ? "You haven't reviewed anyone yet" : `No ${reviewMetaLabel(filter).toLowerCase()} reviews`}
                            </p>
                            <p className="mt-1 text-sm text-fg-muted dark:text-fg-muted-dark">
                                Rate a renter — or RentManager — from the cards above.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

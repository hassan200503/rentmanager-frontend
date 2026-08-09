// features/reviews/components/reviews-page.tsx
"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    Loader2,
    MessageSquarePlus,
    Quote,
    Star,
    UserRound,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import { useLeaseSearchQuery } from "@/features/lease/queries/use-lease-search-query";
import {
    useReviewCountsQuery,
    useRenterReviewsQuery,
    useReviewsQuery,
    useReviewSummaryQuery,
} from "../hooks/use-review-query";
import { useSubmitRenterReviewMutation } from "../hooks/use-review-mutations";
import { ReviewStatusBadge } from "./review-status-badge";
import { reviewStatusOrder, type ReviewStatus } from "../types/review-response";

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

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i)}
                    aria-label={`Rate ${i} star${i === 1 ? "" : "s"}`}
                    className="rounded-md p-0.5 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                >
                    <Star
                        className={`h-7 w-7 transition-all duration-200 ${
                            i <= value ? "fill-amber-400 text-amber-400" : "text-border dark:text-border-dark"
                        }`}
                        strokeWidth={1.5}
                    />
                </button>
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

/* ── Review a renter form ──────────────────────────────────── */

function ReviewRenterForm({ onDone }: { onDone: () => void }) {
    const { data: leases, isLoading: leasesLoading } = useLeaseSearchQuery({ size: 100 });
    const submit = useSubmitRenterReviewMutation();

    const renterOptions = useMemo(() => {
        const seen = new Set<string>();
        const out: { tenantProfileId: string; label: string }[] = [];
        for (const lease of leases?.content ?? []) {
            if (!lease.tenantProfileId) continue;
            const label = lease.tenantFullName ?? "Renter";
            const key = lease.tenantProfileId;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ tenantProfileId: key, label });
        }
        return out;
    }, [leases]);

    const [profileId, setProfileId] = useState("");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileId || rating < 1) return;
        submit.mutate(
            { tenantProfileId: profileId, rating, comment: comment.trim() || null },
            {
                onSuccess: () => {
                    toast.success("Review submitted — it will appear once approved");
                    setProfileId("");
                    setRating(0);
                    setComment("");
                    onDone();
                },
                onError: () => {
                    toast.error("Failed to submit review. Please try again.");
                },
            }
        );
    };

    return (
        <div className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
                <MessageSquarePlus className="h-4 w-4 text-brand" strokeWidth={2} />
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Review a renter</h3>
            </div>

            {leasesLoading ? (
                <div className="skeleton h-24 w-full" />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="form-label" htmlFor="review-renter">
                            Renter <span className="text-danger">*</span>
                        </label>
                        <select
                            id="review-renter"
                            value={profileId}
                            onChange={(e) => setProfileId(e.target.value)}
                            className="form-input w-full"
                            disabled={renterOptions.length === 0}
                        >
                            <option value="">
                                {renterOptions.length === 0
                                    ? "No renters found on your leases"
                                    : "Select a renter…"}
                            </option>
                            {renterOptions.map((o) => (
                                <option key={o.tenantProfileId} value={o.tenantProfileId}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="form-label">Your rating <span className="text-danger">*</span></label>
                        <StarInput value={rating} onChange={setRating} />
                        {rating === 0 && (
                            <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark">Tap a star to rate</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="form-label !mb-0">Comment</label>
                            <span className="text-[11px] font-mono-nums text-fg-subtle dark:text-fg-subtle-dark">
                                {comment.length}/1000
                            </span>
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="How was this renter? Timely payments, unit care, communication…"
                            className="form-input min-h-[96px] resize-y"
                            rows={3}
                            maxLength={1000}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark">
                            One review per renter — it&apos;s public once approved.
                        </p>
                        <button
                            type="submit"
                            disabled={!profileId || rating < 1 || submit.isPending}
                            className="btn-primary"
                        >
                            {submit.isPending ? (
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

/* ── Page ──────────────────────────────────────────────────── */

export function ReviewsPage() {
    const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useReviewSummaryQuery();
    const { data: counts, isLoading: countsLoading, isError: countsError, refetch: refetchCounts } = useReviewCountsQuery();
    const { data: reviews, isLoading: reviewsLoading, isError: reviewsError, refetch: refetchReviews } = useReviewsQuery();
    const { data: renterReviews, isLoading: renterLoading, isError: renterError, refetch: refetchRenter } = useRenterReviewsQuery();

    const [tab, setTab] = useState<Tab>("received");
    const [filter, setFilter] = useState<Filter>("ALL");
    const [formOpen, setFormOpen] = useState(false);

    const loading = summaryLoading || countsLoading || reviewsLoading || renterLoading;
    const anyError = summaryError || countsError || reviewsError || renterError;
    const refetchAll = () => {
        refetchSummary();
        refetchCounts();
        refetchReviews();
        refetchRenter();
    };

    const showAverage = summary?.averageShown === true && summary.averageRating != null;

    const given = renterReviews ?? [];
    const givenFiltered = filter === "ALL" ? given : given.filter((r) => r.status === filter);

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

                    {/* Moderation state */}
                    <div className="card p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                            Moderation state
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                            {reviewStatusOrder.map((status) => (
                                <div key={status} className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-center">
                                    <p className="text-2xl font-semibold text-fg dark:text-fg-dark">
                                        {status === "APPROVED" ? counts?.approvedCount ?? 0 : status === "PENDING" ? counts?.pendingCount ?? 0 : counts?.hiddenCount ?? 0}
                                    </p>
                                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                        {reviewMetaLabel(status)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle dark:text-fg-subtle-dark">
                            Reviews go live only after platform approval.
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-1">
                    {(
                        [
                            { key: "received" as Tab, label: `Received (${(reviews ?? []).length})` },
                            { key: "given" as Tab, label: `Given (${given.length})` },
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
                <div className="flex items-center gap-2.5">
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
                    {tab === "given" && !formOpen && (
                        <button type="button" onClick={() => setFormOpen(true)} className="btn-primary btn-sm">
                            <Star className="h-3.5 w-3.5" strokeWidth={2} />
                            Review a renter
                        </button>
                    )}
                </div>
            </div>

            {/* Review a renter form */}
            {tab === "given" && formOpen && (
                <ReviewRenterForm onDone={() => setFormOpen(false)} />
            )}

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
                    {givenFiltered.length === 0 ? (
                        <div className="card p-8 text-center">
                            <MessageSquarePlus className="mx-auto h-8 w-8 text-fg-subtle opacity-60" strokeWidth={1.5} />
                            <p className="mt-3 text-sm font-medium text-fg dark:text-fg-dark">
                                {filter === "ALL" ? "You haven't reviewed anyone yet" : `No ${reviewMetaLabel(filter).toLowerCase()} reviews`}
                            </p>
                            <p className="mt-1 text-sm text-fg-muted dark:text-fg-muted-dark">
                                Review a renter after a recorded tenancy so other landlords know what to expect.
                            </p>
                            {filter === "ALL" && (
                                <button type="button" onClick={() => setFormOpen(true)} className="mt-4 btn-outline btn-sm">
                                    <Star className="h-3.5 w-3.5" strokeWidth={2} />
                                    Review a renter
                                </button>
                            )}
                        </div>
                    ) : (
                        givenFiltered.map((review) => (
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
            )}
        </div>
    );
}

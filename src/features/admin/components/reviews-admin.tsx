// features/admin/components/reviews-admin.tsx
"use client";

import { useState } from "react";
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle2,
    EyeOff,
    Loader2,
    MessageSquareQuote,
    Sparkles,
    Star,
    UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
    useAdminReviewsQuery,
    useAdminReviewStatsQuery,
} from "@/features/admin/hooks/use-admin-queries";
import { useReviewModerationMutation } from "@/features/admin/hooks/use-admin-mutations";
import type { PlatformReviewResponse, PlatformReviewType } from "@/features/admin/types/admin-types";
import { EmptyState, formatDate } from "./admin-ui";

type QueueStatus = "PENDING" | "APPROVED" | "HIDDEN";

const QUEUE_TABS: { key: QueueStatus; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "HIDDEN", label: "Hidden" },
];

const DIRECTION_META: Record<
    PlatformReviewType,
    { label: string; chip: string; icon: typeof UserRound }
> = {
    LANDLORD: { label: "Renter → Landlord", chip: "bg-brand-50 text-brand-700 border-brand/20", icon: UserRound },
    RENTER: { label: "Landlord → Renter", chip: "bg-success/10 text-success-dark border-success/20", icon: Star },
    PLATFORM: { label: "User → RentManager", chip: "bg-amber-50 text-amber-700 border-amber-300/40", icon: Sparkles },
};

const REVIEWER_ROLE_META: Record<"LANDLORD" | "RENTER", string> = {
    LANDLORD: "Landlord",
    RENTER: "Renter",
};

function StatsPanel() {
    const { data, isPending, isError } = useAdminReviewStatsQuery();

    if (isPending) {
        return (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="skeleton h-32" />
                <div className="skeleton h-32" />
                <div className="skeleton h-32" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card p-5 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-warning" strokeWidth={2} />
                <p className="mt-2 text-sm text-fg-muted dark:text-fg-muted-dark">Couldn&#39;t load moderation stats.</p>
            </div>
        );
    }

    const directions = [
        {
            title: "Renters on landlords",
            icon: UserRound,
            approved: data.landlordApproved,
            pending: data.landlordPending,
            hidden: data.landlordHidden,
            average: data.landlordAverageRating,
        },
        {
            title: "Landlords on renters",
            icon: Star,
            approved: data.renterApproved,
            pending: data.renterPending,
            hidden: data.renterHidden,
            average: data.renterAverageRating,
        },
        {
            title: "Users on RentManager",
            icon: Sparkles,
            approved: data.platformApproved,
            pending: data.platformPending,
            hidden: data.platformHidden,
            average: data.platformAverageRating,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {directions.map((d) => (
                <div key={d.title} className="card p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <d.icon className="h-4 w-4 text-brand" strokeWidth={2} />
                            <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">{d.title}</h3>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                            {d.average > 0 ? d.average.toFixed(1) : "—"}
                        </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        {(
                            [
                                { label: "Approved", value: d.approved, chip: "text-success-dark dark:text-success" },
                                { label: "Pending", value: d.pending, chip: "text-warning-dark dark:text-warning" },
                                { label: "Hidden", value: d.hidden, chip: "text-fg-muted dark:text-fg-muted-dark" },
                            ] as { label: string; value: number; chip: string }[]
                        ).map((s) => (
                            <div key={s.label} className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 text-center">
                                <p className={`text-2xl font-semibold ${s.chip}`}>{s.value}</p>
                                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                    {s.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function ReviewRow({ review }: { review: PlatformReviewResponse }) {
    const { approve, hide } = useReviewModerationMutation();
    const direction = DIRECTION_META[review.type] ?? DIRECTION_META.LANDLORD;
    const DirectionIcon = direction.icon;

    // Platform reviews carry the author's side (LANDLORD/RENTER); never
    // render an email-lookalike snapshot (e.g. "unknown@clerk.user") on
    // the admin surface — fall back to the neutral label.
    const isPlatformReview = review.type === "PLATFORM";
    const roleChip = isPlatformReview && review.reviewerType
        ? { label: `${REVIEWER_ROLE_META[review.reviewerType]} → RentManager`, chip: direction.chip }
        : null;
    const displayName =
        review.reviewerName && !review.reviewerName.includes("@")
            ? review.reviewerName
            : "Verified user";

    const isPending = approve.isPending || hide.isPending;

    const handleApprove = () => {
        approve.mutate(
            { type: review.type, reviewId: review.reviewId },
            {
                onSuccess: () => toast.success("Review approved — now public"),
                onError: () => toast.error("Failed to approve review"),
            }
        );
    };

    const handleHide = () => {
        if (!window.confirm("Hide this review? It will no longer be public.")) return;
        hide.mutate(
            { type: review.type, reviewId: review.reviewId },
            {
                onSuccess: () => toast.success("Review hidden"),
                onError: () => toast.error("Failed to hide review"),
            }
        );
    };

    const canApprove = review.status === "PENDING" || review.status === "HIDDEN";
    const canHide = review.status === "PENDING" || review.status === "APPROVED";

    return (
        <div className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark text-fg-muted dark:text-fg-muted-dark">
                        <DirectionIcon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-fg dark:text-fg-dark">
                            {displayName}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleChip?.chip ?? direction.chip}`}>
                                {roleChip?.label ?? direction.label}
                            </span>
                            <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                {formatDate(review.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                    i <= review.rating ? "fill-amber-400 text-amber-400" : "text-border dark:text-border-dark"
                                }`}
                                strokeWidth={1.5}
                            />
                        ))}
                    </div>
                    {canApprove && (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={handleApprove}
                            className="inline-flex items-center gap-1 rounded-lg border border-success/30 px-2.5 py-1.5 text-xs font-medium text-success-dark dark:text-success hover:bg-success/10 disabled:opacity-50 transition-colors"
                        >
                            {approve.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                            ) : (
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                            )}
                            Approve
                        </button>
                    )}
                    {canHide && (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={handleHide}
                            className="inline-flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
                        >
                            {hide.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                            ) : (
                                <EyeOff className="h-3 w-3" strokeWidth={2} />
                            )}
                            Hide
                        </button>
                    )}
                </div>
            </div>
            {review.comment && (
                <p className="mt-2.5 rounded-lg bg-border-subtle/40 dark:bg-border-subtle-dark/40 px-3 py-2 text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                    &ldquo;{review.comment}&rdquo;
                </p>
            )}
            {review.status === "APPROVED" && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-success-dark dark:text-success">
                    <BadgeCheck className="h-3 w-3" strokeWidth={2} />
                    Live on public surfaces
                </p>
            )}
        </div>
    );
}

export function ReviewsAdmin() {
    const [queue, setQueue] = useState<QueueStatus>("PENDING");
    const { data: reviews, isPending, isError, refetch } = useAdminReviewsQuery(queue, 50);

    const showApproveQueue = queue === "PENDING" || queue === "HIDDEN";

    return (
        <div className="space-y-6">
            <StatsPanel />

            <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Moderation queue</h3>
                    <div className="flex items-center gap-1 rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-1">
                        {QUEUE_TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setQueue(t.key)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    queue === t.key
                                        ? "bg-brand text-white shadow-sm"
                                        : "text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isPending ? (
                    <div className="space-y-3">
                        <div className="skeleton h-24" />
                        <div className="skeleton h-24" />
                        <div className="skeleton h-24" />
                    </div>
                ) : isError ? (
                    <div className="card max-w-lg mx-auto py-8 text-center">
                        <AlertTriangle className="mx-auto h-6 w-6 text-warning" strokeWidth={2} />
                        <p className="mt-2 text-sm text-fg-muted dark:text-fg-muted-dark">Couldn&#39;t load the queue.</p>
                        <button onClick={() => refetch()} className="mt-3 btn-outline btn-sm">
                            Retry
                        </button>
                    </div>
                ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-3">
                        {reviews.map((review) => (
                            <ReviewRow key={`${review.type}-${review.reviewId}`} review={review} />
                        ))}
                    </div>
                ) : (
                    <div className="card">
                        <EmptyState
                            icon={showApproveQueue ? MessageSquareQuote : BadgeCheck}
                            title={queue === "PENDING" ? "Queue is clear" : queue === "APPROVED" ? "No approved reviews" : "Nothing hidden"}
                            description={
                                queue === "PENDING"
                                    ? "All caught up — new reviews appear here for moderation."
                                    : "No reviews in this state right now."
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
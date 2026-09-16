// features/tenant-portal/components/tenant-reviews.tsx
// Unified review center — ratings received from landlords, reviewing your
// landlord, and rating RentManager all live in one place.
"use client";

import { BadgeCheck, ShieldCheck, Star } from "lucide-react";
import { useReviewsAboutMeSummaryQuery } from "../hooks/use-tenant-portal-queries";
import { TenantRatingsReceived } from "./tenant-ratings-received";
import { TenantReviewCard } from "./tenant-review-card";
import { PlatformReviewCard } from "@/features/reviews/components/platform-review-card";
import { PortalPage } from "./portal-chrome";

export function TenantReviewsPage() {
    const { data: summary, isLoading: summaryLoading } = useReviewsAboutMeSummaryQuery();

    const showAverage = summary?.averageShown === true && summary.averageRating != null;
    const count = summary?.reviewCount ?? 0;

    return (
        <PortalPage>
            {/* Hero */}
            <div className="tenant-hero-panel relative overflow-hidden !p-6 sm:!p-8">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 60%)",
                    }}
                    aria-hidden
                />
                <div
                    className="absolute -top-24 -right-16 h-64 w-64 rounded-full pointer-events-none opacity-70 blur-3xl"
                    style={{
                        background:
                            "radial-gradient(circle, color-mix(in srgb, var(--color-brand) 16%, transparent), transparent 70%)",
                    }}
                    aria-hidden
                />
                <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                                <Star className="h-[18px] w-[18px] fill-amber-400 text-amber-400" strokeWidth={1.5} />
                            </div>
                            <p className="tenant-eyebrow !mt-0">Review center</p>
                        </div>
                        <h1 className="tenant-hero-title">Reviews</h1>
                        <p className="tenant-hero-subtitle">
                            See what your landlord says about you, rate your landlord, and tell us how RentManager
                            is doing — all in one place.
                        </p>
                        <div className="tenant-hero-chips">
                            <span className="tenant-context-chip inline-flex">
                                <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.9} />
                                Verified renters only
                            </span>
                            <span className="tenant-context-chip inline-flex">
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.9} />
                                Moderated before going live
                            </span>
                        </div>
                    </div>

                    {/* Premium score block */}
                    <div className="shrink-0 lg:min-w-[15rem]">
                        {summaryLoading ? (
                            <div className="rounded-2xl border border-border dark:border-border-dark bg-surface/70 dark:bg-surface-dark/60 p-5">
                                <div className="tenant-skeleton-premium h-3 w-24" />
                                <div className="tenant-skeleton-premium h-10 w-16 mt-3" />
                                <div className="tenant-skeleton-premium h-4 w-28 mt-3" />
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-brand-200/70 dark:border-brand-700/40 bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-sm shadow-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted dark:text-fg-muted-dark">
                                    Your renter rating
                                </p>
                                {showAverage ? (
                                    <>
                                        <div className="mt-1.5 flex items-end gap-1.5">
                                            <span className="font-data text-4xl font-bold leading-none text-fg dark:text-fg-dark">
                                                {summary!.averageRating!.toFixed(1)}
                                            </span>
                                            <span className="mb-0.5 text-xs text-fg-subtle dark:text-fg-subtle-dark">/ 5</span>
                                        </div>
                                        <div className="mt-2.5 flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${
                                                        i <= Math.round(summary!.averageRating!)
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-border dark:text-border-dark"
                                                    }`}
                                                    strokeWidth={1.5}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-2.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                            From {count} landlord{count === 1 ? "" : "s"}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <Star className="h-8 w-8 text-border dark:text-border-dark" strokeWidth={1.5} />
                                            <span className="font-data text-4xl font-bold leading-none text-fg-subtle dark:text-fg-subtle-dark">
                                                —
                                            </span>
                                        </div>
                                        {/* This branch covers two different situations and used to
                                            conflate them: genuinely no reviews, versus reviews existing
                                            but the average deliberately withheld until there are enough
                                            of them to be meaningful. Saying "No landlord reviews yet"
                                            while the section directly below listed a real review read
                                            as a broken page. */}
                                        <p className="mt-2.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {count > 0
                                                ? `${count} review${count === 1 ? "" : "s"} — your average appears once a few more landlords have rated you`
                                                : "No landlord reviews yet"}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ratings received from landlords */}
            <TenantRatingsReceived />

            {/* Rate your landlord + rate RentManager */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <TenantReviewCard />
                <PlatformReviewCard />
            </div>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-fg-subtle dark:text-fg-subtle-dark pb-2">
                Reviews are shared with verified landlords and renters only — your name always shows as a first name publicly.
            </p>
        </PortalPage>
    );
}
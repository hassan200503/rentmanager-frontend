// features/public-listings/components/reviews-section.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, MessageSquareHeart, ShieldCheck, Star } from "lucide-react";
import {
    usePublicPropertyReviewsQuery,
    usePublicUnitReviewsQuery,
} from "../queries/use-public-reviews-query";
import { ScrollReveal } from "@/shared/components/motion/MotionComponents";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

const RatingStars = ({ value, size = "h-3 w-3" }: { value: number; size?: string }) => (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
            <Star
                key={i}
                className={`${size} ${
                    i <= Math.round(value)
                        ? "fill-amber-400 text-amber-400"
                        : "text-border dark:text-border-dark"
                }`}
                strokeWidth={1.5}
                aria-hidden="true"
            />
        ))}
    </span>
);

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "RM";

export function ReviewsSection({ unitId, propertyId }: { unitId?: string; propertyId?: string }) {
    const unitReviews = usePublicUnitReviewsQuery(unitId ?? "");
    const propertyReviews = usePublicPropertyReviewsQuery(propertyId ?? "");

    const { data, isLoading, isError } = unitId ? unitReviews : propertyReviews;
    const reduceMotion = useReducedMotion();

    const showAverage = data?.averageShown === true && data.averageRating != null;
    const reviewCount = data?.reviewCount ?? 0;

    /* Distribution 5 → 1, computed from the returned reviews */
    const distribution = (data?.reviews ?? []).reduce<Record<number, number>>((acc, r) => {
        const key = Math.min(5, Math.max(1, Math.round(r.rating)));
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <section className="relative">
            {/* Premium background with depth */}
            <div className="absolute -inset-8 bg-gradient-to-br from-brand-50/30 via-transparent to-accent/10 dark:from-brand-900/10 dark:to-accent/10 rounded-[3rem] blur-3xl -z-10 opacity-60" aria-hidden="true" />
            
            <div className="relative rounded-3xl border-2 border-border/50 dark:border-border-dark/50 bg-gradient-to-br from-white via-white to-brand-50/10 dark:from-surface-dark dark:via-surface-dark dark:to-brand-900/5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden backdrop-blur-sm">
                {/* Decorative gradient overlay */}
                <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-gradient-to-br from-brand-500/5 via-transparent to-accent/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
                
                <div className="relative z-10 p-8 md:p-12">
                    {/* ═══════════ HEADER ═══════════ */}
                    <div className="flex items-start gap-5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white ring-4 ring-brand-100/50 dark:ring-brand-800/40 shadow-[0_8px_24px_-6px_rgba(5,150,105,0.5)]">
                            <MessageSquareHeart className="h-7 w-7" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-3xl font-display font-black text-ink dark:text-white tracking-tight leading-tight">
                                Renter Reviews
                            </h2>
                            <p className="mt-2 text-sm font-semibold text-ink-muted/80 dark:text-white/60 leading-relaxed">
                                Reviews from verified renters of this landlord
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="mt-8 space-y-4">
                            <div className="skeleton h-32 w-full rounded-3xl" />
                            <div className="skeleton h-24 w-full rounded-3xl" />
                        </div>
                    ) : isError || !data ? (
                        <div className="mt-8 rounded-2xl border-2 border-dashed border-border/60 dark:border-border-dark/60 bg-surface/40 dark:bg-surface-dark/40 px-8 py-12 text-center">
                            <p className="text-sm font-medium text-ink-muted dark:text-white/60">
                                Reviews are not available for this listing.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ═══════════ RATING HERO CARD ═══════════ */}
                            <div className="mt-8 relative rounded-3xl border-2 border-brand-200/50 dark:border-brand-800/50 bg-gradient-to-br from-brand-50/80 via-white/80 to-accent/10 dark:from-brand-900/30 dark:via-surface-dark/80 dark:to-accent/20 shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_4px_24px_-4px_rgba(5,150,105,0.15)] dark:shadow-[0_4px_24px_-4px_rgba(5,150,105,0.2)] overflow-hidden backdrop-blur-md">
                                {/* Layered premium background effects */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08)_0%,transparent_60%)] pointer-events-none" aria-hidden="true" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(94,234,212,0.06)_0%,transparent_60%)] pointer-events-none" aria-hidden="true" />
                                
                                <div className="relative z-10 px-8 py-10 md:px-12 md:py-12">
                                    <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16 items-center">
                                        {/* ──── Score Display ──── */}
                                        <div className="flex md:flex-col items-center md:items-start justify-center gap-8 md:gap-6 shrink-0">
                                            <div className="text-center md:text-left">
                                                <div className="relative inline-block">
                                                    <p
                                                        className={`font-data leading-none tracking-tighter ${
                                                            showAverage 
                                                                ? "text-7xl md:text-8xl font-black bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 bg-clip-text text-transparent dark:from-brand-400 dark:via-brand-300 dark:to-brand-500 drop-shadow-[0_2px_8px_rgba(5,150,105,0.2)]" 
                                                                : "text-7xl md:text-8xl font-black text-ink-muted/30 dark:text-white/20"
                                                        }`}
                                                    >
                                                        {showAverage ? data.averageRating!.toFixed(1) : "—"}
                                                    </p>
                                                    {showAverage && (
                                                        <>
                                                            <div className="absolute -inset-4 bg-brand-500/15 dark:bg-brand-400/15 rounded-3xl blur-2xl -z-10" aria-hidden="true" />
                                                            <div className="absolute -inset-1 bg-gradient-to-br from-brand-400/5 to-brand-600/5 rounded-2xl -z-10" aria-hidden="true" />
                                                        </>
                                                    )}
                                                </div>
                                                <div className="mt-4 flex justify-center md:justify-start">
                                                    {showAverage ? (
                                                        <RatingStars value={data.averageRating!} size="h-5 w-5" />
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink/[0.04] dark:bg-white/[0.06] border border-ink/[0.08] dark:border-white/[0.08]">
                                                            <span className="text-xs font-bold text-ink-muted dark:text-white/60 uppercase tracking-wider">
                                                                No score yet
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Meta info */}
                                            <div className="text-center md:text-left">
                                                <div className="inline-flex items-baseline gap-2 px-4 py-2 rounded-xl bg-white/60 dark:bg-white/[0.08] backdrop-blur-sm border border-brand-200/40 dark:border-brand-800/40 shadow-sm">
                                                    <p className="text-2xl font-black text-ink dark:text-white tabular-nums">
                                                        {reviewCount}
                                                    </p>
                                                    <p className="text-sm font-bold text-ink-muted dark:text-white/70">
                                                        review{reviewCount === 1 ? "" : "s"}
                                                    </p>
                                                </div>
                                                <p className="mt-3 text-xs font-semibold text-ink-muted/80 dark:text-white/60 leading-relaxed max-w-[16rem]">
                                                    {showAverage
                                                        ? `Rated by verified renters of this ${unitId ? "unit" : "property"}`
                                                        : reviewCount > 0 && reviewCount < 3
                                                          ? "Average shown once 3 reviews are received"
                                                          : "This landlord is new to the platform"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* ──── Distribution Bars ──── */}
                                        {reviewCount > 0 && (
                                            <div className="space-y-3 w-full" aria-label="Rating distribution">
                                                {[5, 4, 3, 2, 1].map((star, i) => {
                                                    const count = distribution[star] ?? 0;
                                                    const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                                                    return (
                                                        <div
                                                            key={star}
                                                            className="flex items-center gap-4 group/bar"
                                                            aria-label={`${star} star reviews: ${count}`}
                                                        >
                                                            <div className="flex items-center gap-1.5 w-8 shrink-0">
                                                                <span className="text-sm font-bold tabular-nums text-ink-muted dark:text-white/70">
                                                                    {star}
                                                                </span>
                                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" strokeWidth={1.5} />
                                                            </div>
                                                            
                                                            <div className="relative flex-1 h-3 rounded-full bg-ink/[0.06] dark:bg-white/[0.06] overflow-hidden shadow-inner border border-ink/[0.06] dark:border-white/[0.06]">
                                                                <motion.div
                                                                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                                                                    initial={{ width: 0 }}
                                                                    whileInView={{ width: `${pct}%` }}
                                                                    viewport={{ once: true, margin: "-60px" }}
                                                                    transition={{
                                                                        duration: reduceMotion ? 0 : 1,
                                                                        ease: EASE,
                                                                        delay: i * 0.08,
                                                                    }}
                                                                />
                                                            </div>
                                                            
                                                            <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-ink dark:text-white">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ═══════════ TRUST INDICATORS ═══════════ */}
                            <div className="mt-8 flex flex-wrap items-center gap-4 px-2">
                                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/60 shadow-sm">
                                    <BadgeCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                                    <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                                        Verified Renters Only
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-900/30 dark:to-brand-900/20 border border-brand-200/60 dark:border-brand-700/60 shadow-sm">
                                    <ShieldCheck className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
                                    <span className="text-xs font-extrabold text-brand-900 dark:text-brand-300 uppercase tracking-wider">
                                        Independently Verified
                                    </span>
                                </div>
                            </div>

                            {/* ═══════════ REVIEW CARDS ═══════════ */}
                            {data.reviews.length > 0 ? (
                                <div className="mt-8 space-y-4">
                                    {data.reviews.map((review, index) => {
                                        const name = review.renterName || "Verified renter";
                                        const rating = review.rating;
                                        const ratingLabel = rating >= 4 ? "Excellent" : rating >= 3 ? "Good" : rating >= 2 ? "Fair" : "Poor";
                                        
                                        return (
                                            <ScrollReveal key={index} delay={index * 80}>
                                                <article className="group relative overflow-hidden rounded-2xl border-2 border-border/50 dark:border-border-dark/50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(5,150,105,0.08)] hover:border-brand-200/70 dark:hover:border-brand-800/70 hover:-translate-y-1 transition-all duration-400">
                                                    {/* Premium gradient accent */}
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-400 via-brand-500 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-400 shadow-[2px_0_12px_rgba(5,150,105,0.3)]" />
                                                    
                                                    <div className="relative z-10 p-6">
                                                        {/* Header: Avatar + Name + Stars */}
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex items-start gap-4 min-w-0 flex-1">
                                                                {/* Avatar with gradient */}
                                                                <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-400">
                                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white text-base font-black shadow-[0_4px_16px_-4px_rgba(5,150,105,0.4)] ring-2 ring-white/30 dark:ring-white/20">
                                                                        {initials(name)}
                                                                    </div>
                                                                    {/* Verified checkmark badge */}
                                                                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-lg bg-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.4)] ring-2 ring-white dark:ring-surface-dark">
                                                                        <BadgeCheck className="w-3 h-3 text-white" strokeWidth={3} />
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-base font-bold text-ink dark:text-white truncate">
                                                                        {name}
                                                                    </p>
                                                                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-800/60">
                                                                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                                                            Verified Renter
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Rating display */}
                                                            <div className="shrink-0 text-right">
                                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-800/60 shadow-sm">
                                                                    <RatingStars value={rating} size="h-4 w-4" />
                                                                </div>
                                                                <p className="mt-1.5 text-xs font-bold text-ink-muted dark:text-white/70">
                                                                    {ratingLabel}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Review comment */}
                                                        {review.comment && (
                                                            <blockquote className="mt-5 pl-0.5">
                                                                <p className="text-[15px] text-ink-muted dark:text-white/70 leading-relaxed font-medium">
                                                                    &ldquo;{review.comment}&rdquo;
                                                                </p>
                                                            </blockquote>
                                                        )}
                                                        
                                                        {/* Date */}
                                                        <p className="mt-4 text-xs font-bold text-ink-muted/60 dark:text-white/50 uppercase tracking-wider pl-0.5">
                                                            {formatDate(review.createdAt)}
                                                        </p>
                                                    </div>
                                                </article>
                                            </ScrollReveal>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mt-8 rounded-3xl border-2 border-dashed border-border/60 dark:border-border-dark/60 bg-gradient-to-br from-surface/40 to-brand-50/20 dark:from-surface-dark/40 dark:to-brand-900/10 px-8 py-16 text-center backdrop-blur-sm">
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-brand-200/50 dark:from-brand-900/40 dark:to-brand-800/30 ring-4 ring-brand-200/30 dark:ring-brand-800/30 shadow-[0_8px_24px_-6px_rgba(5,150,105,0.2)]">
                                        <Star className="h-9 w-9 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
                                    </div>
                                    <p className="mt-6 text-lg font-bold text-ink dark:text-white">
                                        No reviews yet
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-ink-muted dark:text-white/60 max-w-sm mx-auto leading-relaxed">
                                        This landlord is new to RentManager. Be the first verified renter to leave a review.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
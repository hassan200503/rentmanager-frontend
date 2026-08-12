"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    ChevronRight,
    Home,
    MapPin,
    RefreshCw,
    Share2,
    ShieldCheck,
} from "lucide-react";
import { MotionConfig } from "framer-motion";
import { toast } from "sonner";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { usePropertyUnitsQuery } from "@/features/public-listings/queries/use-property-units-query";
import { UnitCard } from "@/features/public-listings/components/unit-card";
import { ReviewsSection } from "@/features/public-listings/components/reviews-section";
import { PropertyGallery } from "@/features/public-listings/components/property-gallery";
import { SummaryRail } from "@/features/public-listings/components/summary-rail";
import { NotifyForm } from "@/features/public-listings/components/notify-form";
import { EmptyState } from "@/features/public-listings/components/empty-state";
import { ScrollReveal } from "@/shared/components/motion/MotionComponents";

export default function PropertyDetailPage() {
    const params = useParams<{ propertyId: string }>();
    const propertyId = params.propertyId;

    const {
        data: property,
        isLoading: propertyLoading,
        isError: propertyError,
    } = usePublicPropertyQuery(propertyId);

    const {
        data: units,
        isLoading: unitsLoading,
        isError: unitsError,
        refetch: refetchUnits,
    } = usePropertyUnitsQuery(propertyId);

    const [copied, setCopied] = useState(false);

    if (propertyLoading) {
        return <PropertyDetailSkeleton />;
    }

    if (propertyError || !property) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
                <EmptyState
                    title="Property not found"
                    description="This listing may have been removed or is no longer available."
                />
            </div>
        );
    }

    const rents = (units?.content ?? []).map((u) => u.rentAmount).filter(Boolean);
    const priceRange =
        rents.length > 0 ? { min: Math.min(...rents), max: Math.max(...rents) } : null;
    const hasUnits = !!units && !units.empty && !unitsLoading && !unitsError;
    const unitsLoaded = !unitsLoading && !unitsError && !!units;

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast.success("Link copied to clipboard");
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy the link — copy the URL from the address bar");
        }
    };

    return (
        <MotionConfig reducedMotion="user">
            <div className="min-h-screen bg-canvas pb-28 lg:pb-0">
                {/* ═══════════════ PREMIUM HERO HEADER ═══════════════ */}
                <header className="relative bg-gradient-to-b from-white via-brand-50/10 to-white dark:from-surface-dark dark:via-brand-900/5 dark:to-surface-dark border-b border-border/40 overflow-hidden">
                    {/* Luxury background effects */}
                    <div className="absolute inset-0 opacity-40 dark:opacity-20" aria-hidden="true">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08)_0%,transparent_60%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(94,234,212,0.06)_0%,transparent_60%)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
                    </div>

                    <div className="relative container mx-auto px-6 pt-6 pb-16 max-w-6xl">
                        {/* Refined breadcrumb with better affordance */}
                        <nav className="flex items-center gap-1.5 text-[13px] mb-8 animate-fade-in-up" aria-label="Breadcrumb">
                            <Link
                                href="/listings"
                                className="group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 -ml-3.5 hover:bg-white dark:hover:bg-white/[0.06] hover:text-ink hover:shadow-sm backdrop-blur-sm transition-all duration-200 border border-transparent hover:border-border/50"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand transition-all group-hover:-translate-x-0.5" strokeWidth={2.5} />
                                <span className="font-semibold text-ink-muted group-hover:text-ink">All Listings</span>
                            </Link>
                            <ChevronRight className="w-4 h-4 text-border" strokeWidth={2} />
                            <span className="text-ink dark:text-white font-bold truncate max-w-[280px] px-2">
                                {property.name}
                            </span>
                        </nav>

                        {/* Property type & status badges - elevated design */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Property type badge with icon */}
                                <div className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-white to-brand-50/40 dark:from-white/[0.1] dark:to-brand-900/20 backdrop-blur-xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-brand-200/40 dark:border-brand-800/40 ring-1 ring-white/40 dark:ring-white/10">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
                                        <Building2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-sm font-bold text-ink dark:text-white">
                                        {property.propertyType}
                                    </span>
                                </div>

                                {/* Availability status badge */}
                                {unitsLoaded && (
                                    <div
                                        className={`inline-flex items-center gap-2.5 rounded-2xl backdrop-blur-xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border ring-1 ${
                                            hasUnits 
                                                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-900/30 dark:to-emerald-900/20 border-emerald-300/50 dark:border-emerald-700/50 ring-emerald-200/40 dark:ring-emerald-800/40" 
                                                : "bg-gradient-to-br from-slate-50 to-slate-100/40 dark:from-white/[0.08] dark:to-white/[0.04] border-slate-300/50 dark:border-white/[0.12] ring-slate-200/40 dark:ring-white/10"
                                        }`}
                                    >
                                        <div
                                            className={`w-2 h-2 rounded-full shadow-[0_0_12px_currentColor] ${
                                                hasUnits ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-400 dark:bg-slate-500"
                                            }`}
                                        />
                                        <span className={`text-sm font-extrabold ${hasUnits ? "text-emerald-900 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>
                                            {hasUnits
                                                ? `${units.content.length} Vacant Unit${units.content.length !== 1 ? "s" : ""}`
                                                : "Fully Occupied"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Share button - refined interaction */}
                            <button
                                type="button"
                                onClick={handleShare}
                                className="group inline-flex items-center gap-2.5 rounded-2xl border-2 border-border/60 hover:border-brand-400 dark:hover:border-brand-500 bg-white/90 dark:bg-white/[0.08] backdrop-blur-xl px-5 py-2.5 text-sm font-bold text-ink-muted hover:text-brand dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/30 hover:shadow-[0_4px_16px_-2px_rgba(5,150,105,0.2)] transition-all duration-300 shadow-sm"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50" strokeWidth={2.5} />
                                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Link Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:rotate-6" strokeWidth={2.5} />
                                        <span>Share Listing</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Property name - premium display typography */}
                        <h1 className="mt-2 font-display text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-ink via-ink to-ink/70 dark:from-white dark:via-white dark:to-white/80 tracking-[-0.03em] leading-[1.05] animate-fade-in-up drop-shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                            style={{ animationDelay: '160ms' }}
                        >
                            {property.name}
                        </h1>

                        {/* Location & availability - luxury presentation */}
                        <div className="mt-8 flex flex-wrap items-start gap-6 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
                            {property.address?.city && (
                                <div className="group/loc inline-flex items-center gap-3 text-base hover:scale-[1.02] transition-transform duration-300 cursor-default">
                                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 shadow-[0_4px_16px_-4px_rgba(5,150,105,0.5)] group-hover/loc:shadow-[0_8px_24px_-6px_rgba(5,150,105,0.6)] transition-all duration-300 ring-2 ring-brand-200/40 dark:ring-brand-800/40">
                                        <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} fill="rgba(255,255,255,0.25)" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-ink-muted/60 dark:text-white/50 mb-0.5">
                                            Location
                                        </span>
                                        <span className="text-base font-bold text-ink dark:text-white leading-tight">
                                            {property.address.city}
                                            {property.address.state && `, ${property.address.state}`}
                                        </span>
                                        {property.address.country && (
                                            <span className="text-xs font-semibold text-ink-muted/70 dark:text-white/60 leading-tight">
                                                {property.address.country}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {hasUnits && (
                                <div className="inline-flex items-center gap-3 text-base">
                                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.5)] ring-2 ring-emerald-200/40 dark:ring-emerald-800/40">
                                        <Home className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-ink-muted/60 dark:text-white/50 mb-0.5">
                                            Availability
                                        </span>
                                        <span className="text-base font-bold text-ink dark:text-white leading-tight">
                                            {units.content.length} Unit{units.content.length !== 1 ? "s" : ""} Available
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Property description - refined typography */}
                        {property.description && (
                            <div className="mt-8 animate-fade-in-up max-w-3xl" style={{ animationDelay: '320ms' }}>
                                <p className="text-base leading-[1.7] text-ink-muted dark:text-white/70 font-medium">
                                    {property.description}
                                </p>
                            </div>
                        )}

                        {/* Premium trust badges - refined visual design */}
                        <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                            {/* Secure listing badge */}
                            <div className="group/badge inline-flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50 to-brand-50 dark:from-emerald-900/25 dark:to-brand-900/25 backdrop-blur-sm px-5 py-3 border-2 border-emerald-200/60 dark:border-emerald-700/60 shadow-[0_2px_12px_rgba(16,185,129,0.12)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.2)] transition-all duration-300 hover:scale-105 cursor-default">
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)] group-hover/badge:shadow-[0_6px_16px_-2px_rgba(16,185,129,0.5)] transition-shadow">
                                    <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 leading-tight">
                                        Verified Listing
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider leading-tight">
                                        Secure & Trusted
                                    </span>
                                </div>
                            </div>
                            
                            {/* No fees badge */}
                            <div className="group/badge inline-flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-50 via-brand-50 to-accent/20 dark:from-brand-900/25 dark:to-accent/25 backdrop-blur-sm px-5 py-3 border-2 border-brand-200/60 dark:border-brand-700/60 shadow-[0_2px_12px_rgba(5,150,105,0.12)] hover:shadow-[0_8px_24px_rgba(5,150,105,0.2)] transition-all duration-300 hover:scale-105 cursor-default">
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_4px_12px_-2px_rgba(5,150,105,0.4)] group-hover/badge:shadow-[0_6px_16px_-2px_rgba(5,150,105,0.5)] transition-shadow">
                                    <Check className="w-4.5 h-4.5 text-white" strokeWidth={3} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-extrabold text-brand-900 dark:text-brand-200 leading-tight">
                                        No Agent Fees
                                    </span>
                                    <span className="text-[10px] font-bold text-brand-700/70 dark:text-brand-400/70 uppercase tracking-wider leading-tight">
                                        Direct Booking
                                    </span>
                                </div>
                            </div>
                            
                            {/* Real-time updates badge */}
                            <div className="group/badge inline-flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-blue-900/25 dark:to-indigo-900/25 backdrop-blur-sm px-5 py-3 border-2 border-blue-200/60 dark:border-blue-700/60 shadow-[0_2px_12px_rgba(59,130,246,0.12)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)] transition-all duration-300 hover:scale-105 cursor-default">
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.4)] group-hover/badge:shadow-[0_6px_16px_-2px_rgba(59,130,246,0.5)] transition-shadow">
                                    <RefreshCw className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-extrabold text-blue-900 dark:text-blue-200 leading-tight">
                                        Live Updates
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-700/70 dark:text-blue-400/70 uppercase tracking-wider leading-tight">
                                        Real-time Status
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ═══════════════ CONTENT BODY ═══════════════ */}
                <div className="container mx-auto px-6 py-16 max-w-6xl">
                    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-12 items-start">
                        <div className="min-w-0 space-y-16">
                            {/* Photo gallery */}
                            <section aria-label={`Photos of ${property.name}`}>
                                <ScrollReveal>
                                    <PropertyGallery
                                        propertyName={property.name}
                                        images={property.images ?? []}
                                    />
                                </ScrollReveal>
                            </section>

                            {/* Available units */}
                            <section id="available-units" aria-label="Available units">
                                <ScrollReveal>
                                    <div className="flex items-baseline justify-between pb-6 mb-8 border-b-2 border-border/60">
                                        <div>
                                            <h2 className="flex items-center gap-3 font-display text-3xl font-bold text-ink dark:text-white tracking-tight">
                                                Available units
                                                <span
                                                    className={`pill !gap-2 shadow-md font-bold text-sm ${
                                                        hasUnits 
                                                            ? "pill-success bg-success-bg dark:bg-success-bg-dark border-2 border-success/20" 
                                                            : "pill-neutral border-2 border-border/60"
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${
                                                            hasUnits ? "bg-current shadow-[0_0_8px_currentColor]" : "bg-ink-muted/40"
                                                        }`}
                                                    />
                                                    {hasUnits ? units.content.length : 0}
                                                </span>
                                            </h2>
                                            <p className="text-sm font-semibold text-ink-muted dark:text-white/70 mt-2">
                                                {hasUnits
                                                    ? `Available rental units at ${property.name}`
                                                    : unitsLoaded
                                                      ? "No vacancies at this time"
                                                      : "Checking availability…"}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollReveal>

                                {unitsLoading ? (
                                    <UnitSkeletonGrid />
                                ) : unitsError ? (
                                    <div className="animate-fade-in-up">
                                        <EmptyState
                                            title="Couldn't load units"
                                            description="Something went wrong fetching vacancies for this property."
                                            icon={AlertTriangle}
                                            tone="danger"
                                        />
                                        <div className="flex justify-center -mt-4">
                                            <button
                                                onClick={() => refetchUnits()}
                                                className="btn btn-secondary inline-flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Try again
                                            </button>
                                        </div>
                                    </div>
                                ) : units?.empty ? (
                                    <NotifyPanel propertyName={property.name} />
                                ) : units ? (
                                    <div
                                        key={units.content.length}
                                        className="grid gap-8 md:grid-cols-2 animate-fade-in-up"
                                    >
                                        {units.content.map((unit, idx) => (
                                            <div
                                                key={unit.id}
                                                className="animate-fade-in-up"
                                                style={{ animationDelay: `${idx * 80}ms` }}
                                            >
                                                <UnitCard propertyId={propertyId} unit={unit} />
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </section>

                            {/* Renter reviews */}
                            <section id="reviews" aria-label="Renter reviews">
                                <ScrollReveal>
                                    <ReviewsSection propertyId={propertyId} />
                                </ScrollReveal>
                            </section>
                        </div>

                        {/* Sticky summary rail (desktop) + mobile action bar */}
                        <SummaryRail
                            propertyName={property.name}
                            available={hasUnits}
                            unitCount={hasUnits ? units.content.length : 0}
                            priceRange={priceRange}
                            loading={unitsLoading}
                        />
                    </div>
                </div>
            </div>
        </MotionConfig>
    );
}

/* ═══════════════════════ Sub-components ═══════════════════════ */

function NotifyPanel({ propertyName }: { propertyName: string }) {
    return (
        <div className="relative overflow-hidden notify-panel rounded-3xl border-2 border-border/60 bg-gradient-to-br from-white via-surface to-brand-50/20 dark:from-surface-dark dark:via-surface-dark dark:to-brand-900/10 px-6 py-16 sm:px-12 animate-fade-in-up shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            {/* Premium background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 via-transparent to-accent/10 dark:from-brand-900/20 dark:to-accent/20 -z-10" aria-hidden="true" />
            
            <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
                <div className="relative h-28 w-28" aria-hidden="true">
                    <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-brand-400/20 to-accent/20 blur-3xl animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-brand-300/40 animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-5 rounded-full bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex items-center justify-center shadow-xl shadow-brand/30 ring-4 ring-brand-100/50 dark:ring-brand-900/50">
                        <Home className="h-9 w-9 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <h3 className="mt-7 text-2xl font-bold text-ink dark:text-white">No vacant units</h3>
                <p className="mt-3 text-[15px] font-medium text-ink-muted dark:text-white/70 leading-relaxed">
                    Every unit at {propertyName} is currently let. Join the waitlist and
                    we&apos;ll email you the moment a vacancy opens.
                </p>

                <div className="mt-8 w-full max-w-sm">
                    <NotifyForm propertyName={propertyName} id="notify-form" />
                </div>

                <Link
                    href="/listings"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-700 dark:hover:text-brand-400 transition-colors group"
                >
                    <span>Browse other listings</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </Link>
            </div>
        </div>
    );
}

function UnitSkeletonGrid() {
    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-surface rounded-2xl border border-border overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${i * 90}ms` }}
                >
                    <div className="skeleton h-48 w-full rounded-none" />
                    <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="skeleton h-5 w-2/3" />
                            <div className="skeleton h-5 w-14 rounded-full" />
                        </div>
                        <div className="flex gap-2">
                            <div className="skeleton h-6 w-20 rounded-lg" />
                            <div className="skeleton h-6 w-28 rounded-lg" />
                        </div>
                        <div className="skeleton h-4 w-full" />
                        <div className="skeleton h-4 w-2/3" />
                        <div className="skeleton h-9 w-full rounded-xl mt-1" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function PropertyDetailSkeleton() {
    return (
        <div className="min-h-screen bg-canvas pb-28 lg:pb-0" aria-busy="true" aria-label="Loading property">
            {/* Header skeleton */}
            <div className="bg-surface border-b border-border">
                <div className="container mx-auto px-6 pt-8 pb-10 max-w-5xl space-y-4">
                    <div className="skeleton h-6 w-32" />
                    <div className="flex items-center gap-2">
                        <div className="skeleton h-6 w-28 rounded-full" />
                        <div className="skeleton h-6 w-24 rounded-full" />
                    </div>
                    <div className="skeleton h-11 w-2/3" />
                    <div className="skeleton h-4 w-64" />
                    <div className="skeleton h-4 w-full max-w-2xl" />
                </div>
            </div>

            {/* Body skeleton */}
            <div className="container mx-auto px-6 py-10 max-w-5xl">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
                    <div className="min-w-0 space-y-14">
                        <div className="skeleton h-[440px] rounded-3xl" />
                        <div>
                            <div className="skeleton h-7 w-48" />
                            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-surface rounded-2xl border border-border overflow-hidden">
                                        <div className="skeleton h-44 w-full rounded-none" />
                                        <div className="p-5 space-y-3">
                                            <div className="skeleton h-5 w-1/2" />
                                            <div className="skeleton h-4 w-2/3" />
                                            <div className="skeleton h-9 w-full rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:block">
                        <div className="sticky top-24">
                            <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
                                <div className="skeleton h-5 w-24 rounded-full" />
                                <div className="skeleton h-8 w-3/4" />
                                <div className="skeleton h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
// app/listings/[propertyId]/[unitId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronRight, ChevronLeft, X, ImageOff, ShieldCheck, MapPin, Building2, Layers } from "lucide-react";
import { usePublicUnitQuery } from "@/features/public-listings/queries/use-public-unit-query";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { ReviewsSection } from "@/features/public-listings/components/reviews-section";
import { VerifiedBadge } from "@/features/public-listings/components/verified-badge";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";
import { toMoneyNumber } from "@/shared/utils/money";

const occupancyBadge = (occupancyStatus: string): { label: string; className: string } => {
    switch (occupancyStatus) {
        case "VACANT":
            return { label: "Vacant", className: "pill-success" };
        default:
            return { label: occupancyStatus, className: "pill-neutral" };
    }
};

export default function UnitDetailPage() {
    const params = useParams<{ propertyId: string; unitId: string }>();

    const { data: unit, isLoading: unitLoading, isError: unitError } =
        usePublicUnitQuery(params.unitId);

    // Property is only needed for the breadcrumb label, which already has a
    // "Property" fallback — so it no longer blocks the page. The unit is the
    // only data required to render.
    const { data: property } = usePublicPropertyQuery(params.propertyId);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const images = unit?.images ?? [];

    useEffect(() => {
        if (lightboxIndex === null || images.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowRight") {
                setLightboxIndex((i) => (i === null ? i : (i + 1) % images.length));
            }
            if (e.key === "ArrowLeft") {
                setLightboxIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, images.length]);

    if (unitLoading) {
        return <LoadingState message="Loading unit…" />;
    }

    if (unitError || !unit) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
                <EmptyState
                    title="Unit not found"
                    description="This unit may no longer be available."
                />
            </div>
        );
    }

    const badge = occupancyBadge(unit.occupancyStatus);
    const isVacant = unit.occupancyStatus === "VACANT";
    const [heroImage, ...restImages] = images;
    const visibleThumbs = restImages.slice(0, 2);
    const remainingCount = restImages.length - visibleThumbs.length;

    return (
        <div className="min-h-screen bg-canvas pb-24 lg:pb-0">

            {/* Header */}
            <div className="relative bg-surface border-b border-border">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-brand-50/70 via-transparent to-transparent dark:from-brand-900/10" />
                <div className="relative container mx-auto px-6 py-8 max-w-5xl">
                    <nav className="flex items-center gap-1.5 text-xs text-ink-muted mb-7" aria-label="Breadcrumb">
                        <Link href="/listings" className="hover:text-ink transition-colors hover:underline underline-offset-2">
                            Listings
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link
                            href={`/listings/${params.propertyId}`}
                            className="flex items-center gap-1 hover:text-ink transition-colors hover:underline underline-offset-2"
                        >
                            {property?.name ?? "Property"}
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-ink font-medium">{unit.label || `Unit ${unit.unitNumber}`}</span>
                    </nav>

                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight leading-tight">
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </h1>
                        <span className={`${badge.className} !px-2.5 !py-1`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            {badge.label}
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                        {unit.label && (
                            <span className="inline-flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-brand" strokeWidth={1.5} />
                                Unit {unit.unitNumber}
                            </span>
                        )}
                        {unit.floor && (
                            <span className="inline-flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {unit.floor}
                            </span>
                        )}
                        {property?.address?.city && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-brand" strokeWidth={1.5} />
                                {property.address.city}
                                {property.address.state ? `, ${property.address.state}` : ""}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Two-column: content left, sticky reserve panel right — CTA stays
                on-screen instead of scrolling away under a long description. */}
            <div className="container mx-auto px-6 py-10 max-w-5xl grid lg:grid-cols-[1fr_360px] gap-10 items-start">

                <div className="space-y-8">
                    {heroImage ? (
                        <section>
                            <div className="grid gap-3 grid-cols-3 grid-rows-2 h-[340px]">
                                <button
                                    type="button"
                                    onClick={() => setLightboxIndex(0)}
                                    className="col-span-3 row-span-2 md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl shadow-card transition-all duration-300 group hover:shadow-elevated hover:ring-2 hover:ring-brand/30"
                                >
                                    <Image
                                        src={heroImage}
                                        alt={`Unit ${unit.unitNumber} main photo`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    />
                                </button>
                                {visibleThumbs.map((url, index) => {
                                    const isLastVisible = index === visibleThumbs.length - 1;
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setLightboxIndex(index + 1)}
                                            className="hidden md:block relative overflow-hidden rounded-2xl shadow-sm group hover:ring-2 hover:ring-brand/30 transition-all duration-300"
                                        >
                                            <Image
                                                src={url}
                                                alt={`Unit ${unit.unitNumber} photo ${index + 2}`}
                                                fill
                                                sizes="25vw"
                                                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                            />
                                            {isLastVisible && remainingCount > 0 && (
                                                <span className="absolute inset-0 bg-ink/60 flex items-center justify-center text-white text-sm font-semibold">
                                                    +{remainingCount} more
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ) : (
                        <div className="h-56 rounded-2xl border border-dashed border-ink/15 bg-surface flex flex-col items-center justify-center gap-2 text-ink-muted">
                            <ImageOff className="w-6 h-6" strokeWidth={1.5} />
                            <p className="text-xs">No photos available yet</p>
                        </div>
                    )}

                    {unit.description && (
                        <section className="card p-6">
                            <h2 className="section-header !text-base">About this unit</h2>
                            <p className="text-sm text-ink-muted leading-relaxed">
                                {unit.description}
                            </p>
                        </section>
                    )}

                    <section className="card p-6">
                        <h2 className="section-header !text-base">Unit details</h2>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {toMoneyNumber(unit.rentAmount) > 0 && (
                                <div className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.05] border border-border/70 dark:border-border-dark/70 px-4 py-3.5">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                                        Monthly rent
                                    </p>
                                    <p className="mt-1 font-data text-base font-semibold text-ink">
                                        KES {toMoneyNumber(unit.rentAmount).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {unit.depositAmount ? (
                                <div className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.05] border border-border/70 dark:border-border-dark/70 px-4 py-3.5">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                                        Refundable deposit
                                    </p>
                                    <p className="mt-1 font-data text-base font-semibold text-ink">
                                        KES {toMoneyNumber(unit.depositAmount).toLocaleString()}
                                    </p>
                                </div>
                            ) : null}
                            {unit.floor && (
                                <div className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.05] border border-border/70 dark:border-border-dark/70 px-4 py-3.5">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                                        Floor
                                    </p>
                                    <p className="mt-1 font-data text-base font-semibold text-ink flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-brand" strokeWidth={1.5} />
                                        {unit.floor}
                                    </p>
                                </div>
                            )}
                            {unit.landlordVerified && (
                                <div className="col-span-2 sm:col-span-1 rounded-xl bg-gradient-to-br from-amber-50 to-surface dark:from-amber-500/10 dark:to-surface-dark border border-amber-200/60 dark:border-amber-400/20 px-4 py-3.5">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                                        Landlord
                                    </p>
                                    <div className="mt-1.5">
                                        <VerifiedBadge size="sm" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <ReviewsSection unitId={unit.id} />
                </div>

                {/* Sticky reserve panel — desktop only */}
                <aside className="hidden lg:block sticky top-8">
                    <div className="card p-6 space-y-5">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted mb-1.5">
                                Monthly rent
                            </p>
                            <p className="font-data text-3xl font-semibold text-ink">
                                KES {toMoneyNumber(unit.rentAmount).toLocaleString()}
                                <span className="font-sans text-base font-normal text-ink-muted"> /month</span>
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-y-1.5 items-center gap-x-3 text-xs text-ink-muted">
                            {unit.landlordVerified && <VerifiedBadge size="sm" />}
                            {unit.depositAmount ? (
                                <span>
                                    {toMoneyNumber(unit.depositAmount).toLocaleString()} KES deposit
                                </span>
                            ) : null}
                        </div>

                        {isVacant ? (
                            <>
                                <Link
                                    href={`/reserve/${unit.id}`}
                                    className="btn-primary block w-full text-center"
                                >
                                    Reserve this unit
                                </Link>
                                <div className="flex items-start gap-2 pt-4 border-t border-ink/[0.08]">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10">
                                        <ShieldCheck className="w-4 h-4 text-success" strokeWidth={2} />
                                    </div>
                                    <p className="text-xs text-ink-muted leading-relaxed">
                                        <span className="font-medium text-ink">Secure hold.</span>{" "}
                                        Refundable deposit, paid securely via M-Pesa. Held until your
                                        move-in is confirmed.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="w-full text-center py-3 rounded-xl border border-ink/[0.08] bg-ink/[0.06] text-ink-muted text-sm font-medium"
                                    aria-disabled="true"
                                >
                                    Not currently available
                                </div>
                                <p className="text-xs text-ink-muted leading-relaxed pt-1 border-t border-ink/[0.08]">
                                    This unit is {badge.label.toLowerCase()}. Check back later or
                                    browse other vacant units on this property.
                                </p>
                            </>
                        )}
                    </div>
                </aside>
            </div>

            {/* Mobile sticky action bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-border px-6 py-4 flex items-center justify-between gap-4 shadow-[0_-4px_24px_rgba(20,33,61,0.1)]">
                <div>
                    <p className="font-data text-xl font-semibold text-ink leading-none">
                        KES {toMoneyNumber(unit.rentAmount).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-1">per month</p>
                </div>
                {isVacant ? (
                    <Link href={`/reserve/${unit.id}`} className="btn-primary px-6 py-3">
                        Reserve
                    </Link>
                ) : (
                    <span
                        className="px-6 py-3 rounded-xl bg-ink/[0.06] text-ink-muted text-sm font-medium"
                        aria-disabled="true"
                    >
                        Unavailable
                    </span>
                )}
            </div>

            {/* Photo lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center px-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Unit ${unit.unitNumber} photos`}
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((i) =>
                                        i === null ? i : (i - 1 + images.length) % images.length
                                    );
                                }}
                                className="absolute left-4 md:left-8 text-white/80 hover:text-white transition-colors"
                                aria-label="Previous photo"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIndex((i) => (i === null ? i : (i + 1) % images.length));
                                }}
                                className="absolute right-4 md:right-8 text-white/80 hover:text-white transition-colors"
                                aria-label="Next photo"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </>
                    )}

                    <Image
                        src={images[lightboxIndex]}
                        alt={`Unit ${unit.unitNumber} photo ${lightboxIndex + 1}`}
                        width={1600}
                        height={1200}
                        sizes="100vw"
                        className="max-h-[85vh] max-w-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <span className="absolute bottom-6 text-white/70 text-sm">
                        {lightboxIndex + 1} / {images.length}
                    </span>
                </div>
            )}
        </div>
    );
}
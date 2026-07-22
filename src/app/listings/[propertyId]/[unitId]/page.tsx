// app/listings/[propertyId]/[unitId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ChevronLeft, X, ImageOff, ShieldCheck } from "lucide-react";
import { usePublicUnitQuery } from "@/features/public-listings/queries/use-public-unit-query";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

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
            <div className="bg-surface border-b border-ink/[0.08]">
                <div className="container mx-auto px-6 py-8 max-w-5xl">
                    <nav className="flex items-center gap-1.5 text-xs text-ink-muted mb-5">
                        <Link href="/listings" className="hover:text-ink transition-colors">
                            Listings
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link
                            href={`/listings/${params.propertyId}`}
                            className="hover:text-ink transition-colors"
                        >
                            {property?.name ?? "Property"}
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-ink font-medium">{unit.label || `Unit ${unit.unitNumber}`}</span>
                    </nav>

                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </h1>
                        <span className={badge.className}>{badge.label}</span>
                    </div>
                    {unit.label && (
                        <p className="mt-1 text-sm text-ink-muted font-normal">{unit.unitNumber}</p>
                    )}
                    {unit.floor && (
                        <p className="mt-1 text-xs text-ink-muted flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {unit.floor}
                        </p>
                    )}
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
                                    className="col-span-3 row-span-2 md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl shadow-sm group"
                                >
                                    <img
                                        src={heroImage}
                                        alt={`Unit ${unit.unitNumber} main photo`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    />
                                </button>
                                {visibleThumbs.map((url, index) => {
                                    const isLastVisible = index === visibleThumbs.length - 1;
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setLightboxIndex(index + 1)}
                                            className="hidden md:block relative overflow-hidden rounded-2xl shadow-sm group"
                                        >
                                            <img
                                                src={url}
                                                alt={`Unit ${unit.unitNumber} photo ${index + 2}`}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
                            <h2 className="text-lg font-semibold text-ink mb-3">
                                About this unit
                            </h2>
                            <p className="text-sm text-ink-muted leading-relaxed">
                                {unit.description}
                            </p>
                        </section>
                    )}
                </div>

                {/* Sticky reserve panel — desktop only */}
                <aside className="hidden lg:block sticky top-8">
                    <div className="card p-6 space-y-4">
                        <p className="font-data text-3xl font-semibold text-ink">
                            KES {unit.rentAmount.toLocaleString()}
                            <span className="font-sans text-base font-normal text-ink-muted"> / month</span>
                        </p>

                        {isVacant ? (
                            <>
                                <Link
                                    href={`/reserve/${unit.id}`}
                                    className="btn-primary block w-full text-center py-3"
                                >
                                    Reserve this unit
                                </Link>
                                <div className="flex items-start gap-2 pt-2 border-t border-ink/[0.08]">
                                    <ShieldCheck className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-ink-muted leading-relaxed">
                                        Refundable deposit, paid securely via M-Pesa. Held until your
                                        move-in is confirmed.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="w-full text-center py-3 rounded-lg bg-ink/[0.06] text-ink-muted text-sm font-medium"
                                    aria-disabled="true"
                                >
                                    Not currently available
                                </div>
                                <p className="text-xs text-ink-muted leading-relaxed pt-2 border-t border-ink/[0.08]">
                                    This unit is {badge.label.toLowerCase()}. Check back later or
                                    browse other vacant units on this property.
                                </p>
                            </>
                        )}
                    </div>
                </aside>
            </div>

            {/* Mobile sticky action bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-ink/[0.08] px-6 py-4 flex items-center justify-between gap-4 shadow-[0_-4px_16px_rgba(20,33,61,0.08)]">
                <div>
                    <p className="font-data text-lg font-semibold text-ink leading-none">
                        KES {unit.rentAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-ink-muted mt-1">/ month</p>
                </div>
                {isVacant ? (
                    <Link href={`/reserve/${unit.id}`} className="btn-primary px-6 py-3">
                        Reserve
                    </Link>
                ) : (
                    <span
                        className="px-6 py-3 rounded-lg bg-ink/[0.06] text-ink-muted text-sm font-medium"
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

                    <img
                        src={images[lightboxIndex]}
                        alt={`Unit ${unit.unitNumber} photo ${lightboxIndex + 1}`}
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
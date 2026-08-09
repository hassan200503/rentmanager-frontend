"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ChevronRight, ChevronLeft, X, ImageOff, AlertTriangle, Home, ArrowLeft, Building2, MapPin } from "lucide-react";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { usePropertyUnitsQuery } from "@/features/public-listings/queries/use-property-units-query";
import { UnitCard } from "@/features/public-listings/components/unit-card";
import { ReviewsSection } from "@/features/public-listings/components/reviews-section";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

export default function PropertyDetailPage() {
    const params = useParams<{ propertyId: string }>();
    const propertyId = params.propertyId;

    const { data: property, isLoading: propertyLoading, isError: propertyError } =
        usePublicPropertyQuery(propertyId);

    const { data: units, isLoading: unitsLoading, isError: unitsError } =
        usePropertyUnitsQuery(propertyId);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const images = property?.images ?? [];

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

    if (propertyLoading) {
        return <LoadingState message="Loading property…" />;
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

    const [heroImage, ...restImages] = images;
    const visibleThumbs = restImages.slice(0, 3);
    const remainingCount = restImages.length - visibleThumbs.length;

    return (
        <div className="min-h-screen bg-canvas">
            {/* Header */}
            <div className="relative bg-surface border-b border-border">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-brand-50/70 via-transparent to-transparent dark:from-brand-900/10" />
                <div className="relative container mx-auto px-6 py-12 max-w-5xl">
                    <nav className="flex items-center gap-2 text-xs text-ink-muted mb-8" aria-label="Breadcrumb">
                        <Link
                            href="/listings"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 hover:bg-ink/[0.05] hover:text-ink transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Listings
                        </Link>
                        <ChevronRight className="w-3 h-3 text-ink-muted/40" />
                        <span className="text-ink font-medium truncate max-w-[220px]">
                            {property.name}
                        </span>
                    </nav>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="pill pill-neutral inline-flex items-center gap-1.5 bg-ink/[0.05] dark:bg-white/[0.06]">
                            <Building2 className="w-3 h-3" strokeWidth={1.5} />
                            {property.propertyType}
                        </span>
                        {!unitsLoading && !unitsError && units && (
                            <span className={`pill ${units.empty ? "pill-neutral" : "pill-success"} inline-flex items-center gap-1.5`}>
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        units.empty ? "bg-ink-muted/40" : "bg-success"
                                    } ${units.empty ? "" : "status-dot-live"}`}
                                />
                                {units.empty ? "No vacancies" : `${units.content.length} vacant`}
                            </span>
                        )}
                    </div>

                    <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold text-ink tracking-tight leading-[1.08]">
                        {property.name}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        {property.address?.city && (
                            <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                                <MapPin className="w-4 h-4 text-brand" strokeWidth={1.5} />
                                {property.address.city}
                                {property.address.state ? `, ${property.address.state}` : ""}
                                {property.address.country ? `, ${property.address.country}` : ""}
                            </p>
                        )}
                        {!unitsLoading && !unitsError && units && !units.empty && (
                            <p className="text-sm text-ink-muted">
                                {units.content.length} available unit
                                {units.content.length !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>

                    {property.description && (
                        <p className="mt-5 max-w-2xl text-ink-muted text-sm leading-relaxed">
                            {property.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-5xl space-y-14">
                {/* Photo gallery */}
                <section>
                    {heroImage ? (
                        <div className="grid gap-2 grid-cols-4 grid-rows-2 h-[420px]">
                            <button
                                type="button"
                                onClick={() => setLightboxIndex(0)}
                                className="col-span-4 row-span-2 md:col-span-2 md:row-span-2 relative overflow-hidden rounded-3xl shadow-card transition-all duration-300 group hover:shadow-elevated hover:ring-2 hover:ring-brand/30"
                            >
                                <Image
                                    src={heroImage}
                                    alt={`${property.name} main photo`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-300" />
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
                                            alt={`${property.name} photo ${index + 2}`}
                                            fill
                                            sizes="25vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-300" />
                                        {isLastVisible && remainingCount > 0 && (
                                            <span className="absolute inset-0 bg-ink/50 flex items-center justify-center text-white text-sm font-semibold backdrop-blur-sm">
                                                +{remainingCount} more
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-[240px] rounded-2xl border border-dashed border-ink/15 bg-surface flex flex-col items-center justify-center gap-2 text-ink-muted">
                            <ImageOff className="w-6 h-6" strokeWidth={1.5} />
                            <p className="text-sm">No photos available yet</p>
                        </div>
                    )}
                </section>

                {/* Vacant units */}
                <section>
                    <div className="flex items-baseline justify-between pb-5 mb-8 border-b border-border">
                        <div>
                            <h2 className="section-title flex items-center gap-2.5">
                                Available units
                                <span className="pill-success !gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                    {units && !units.empty ? units.content.length : 0}
                                </span>
                            </h2>
                            <p className="text-sm text-ink-muted mt-1">
                                {units && !units.empty && !unitsLoading
                                    ? `Available rental units at ${property.name}`
                                    : "No vacancies at this time"}
                            </p>
                        </div>
                    </div>

                    {unitsLoading ? (
                        <UnitSkeletonGrid />
                    ) : unitsError ? (
                        <EmptyState
                            title="Couldn't load units"
                            description="Something went wrong fetching vacancies for this property. Try refreshing the page."
                            icon={AlertTriangle}
                            tone="danger"
                        />
                    ) : units?.empty ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-ink/[0.05] flex items-center justify-center">
                                <Home className="w-6 h-6 text-ink-muted" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-ink">No vacant units</h3>
                                <p className="mt-1 text-sm text-ink-muted">
                                    Check back soon — this property has no vacancies right now.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
                            {units?.content.map((unit) => (
                                <UnitCard key={unit.id} propertyId={propertyId} unit={unit} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Landlord reviews (Phase 4b) */}
                <ReviewsSection propertyId={propertyId} />
            </div>

            {/* Photo lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center px-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${property.name} photos`}
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
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
                                className="absolute left-4 md:left-8 text-white/60 hover:text-white transition-colors z-10"
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
                                className="absolute right-4 md:right-8 text-white/60 hover:text-white transition-colors z-10"
                                aria-label="Next photo"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </>
                    )}

                    <Image
                        src={images[lightboxIndex]}
                        alt={`${property.name} photo ${lightboxIndex + 1}`}
                        width={1600}
                        height={1200}
                        sizes="100vw"
                        className="max-h-[85vh] max-w-full object-contain rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <span className="absolute bottom-6 text-white/50 text-sm font-medium">
                        {lightboxIndex + 1} / {images.length}
                    </span>
                </div>
            )}
        </div>
    );
}

function UnitSkeletonGrid() {
    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-border overflow-hidden">
                    <div className="skeleton h-44 w-full rounded-none" />
                    <div className="p-5 space-y-3">
                        <div className="skeleton h-5 w-1/2" />
                        <div className="skeleton h-4 w-1/3" />
                        <div className="skeleton h-4 w-2/3" />
                        <div className="skeleton h-8 w-full rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

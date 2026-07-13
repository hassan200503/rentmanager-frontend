// app/listings/[propertyId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ChevronLeft, X, ImageOff, AlertTriangle } from "lucide-react";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { usePropertyUnitsQuery } from "@/features/public-listings/queries/use-property-units-query";
import { UnitCard } from "@/features/public-listings/components/unit-card";
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

    // Lightbox keyboard controls — a real Effect (subscribing to an external
    // event source), not a state-sync Effect, so it's exempt from the
    // set-state-in-effect concern from the listings page. setState here only
    // ever runs inside the event-handler callback, never synchronously in
    // the Effect body.
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

    // Only the property itself blocks the page — it's required to render
    // anything at all. Units load independently below, so a slow units
    // request never holds up the header, photos, or description.
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
            <div className="bg-surface border-b border-ink/[0.08]">
                <div className="container mx-auto px-6 py-10 max-w-5xl">
                    <nav className="flex items-center gap-1.5 text-xs text-ink-muted mb-6">
                        <Link href="/listings" className="hover:text-ink transition-colors">
                            Listings
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-ink font-medium truncate max-w-[240px]">
                            {property.name}
                        </span>
                    </nav>

                    <div className="flex items-center gap-2 mb-4">
                        <span className="pill pill-neutral">{property.propertyType}</span>
                        {!unitsLoading && !unitsError && units && (
                            <span className={`pill ${units.empty ? "pill-neutral" : "pill-success"}`}>
                                {units.empty ? "No vacancies" : `${units.content.length} vacant`}
                            </span>
                        )}
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
                        {property.name}
                    </h1>
                    {property.description && (
                        <p className="mt-3 max-w-2xl text-ink-muted text-sm leading-relaxed">
                            {property.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-5xl space-y-12">
                {/* Photo gallery */}
                <section>
                    {heroImage ? (
                        <div className="grid gap-3 grid-cols-4 grid-rows-2 h-[420px]">
                            <button
                                type="button"
                                onClick={() => setLightboxIndex(0)}
                                className="col-span-4 row-span-2 md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl shadow-sm group"
                            >
                                <img
                                    src={heroImage}
                                    alt={`${property.name} main photo`}
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
                                            alt={`${property.name} photo ${index + 2}`}
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
                    ) : (
                        <div className="h-[240px] rounded-2xl border border-dashed border-ink/15 bg-surface flex flex-col items-center justify-center gap-2 text-ink-muted">
                            <ImageOff className="w-6 h-6" strokeWidth={1.5} />
                            <p className="text-sm">No photos available yet</p>
                        </div>
                    )}
                </section>

                {/* Vacant units */}
                <section>
                    <div className="flex items-baseline justify-between border-b border-ink/[0.08] pb-4 mb-6">
                        <h2 className="text-xl font-semibold text-ink">Vacant units</h2>
                        {units && !units.empty && !unitsLoading && (
                            <span className="text-sm text-ink-muted">
                                {units.content.length} available
                            </span>
                        )}
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
                        <EmptyState
                            title="No vacant units"
                            description="Check back soon — this property has no vacancies right now."
                        />
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
                            {units?.content.map((unit) => (
                                <UnitCard key={unit.id} propertyId={propertyId} unit={unit} />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Photo lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center px-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${property.name} photos`}
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
                        alt={`${property.name} photo ${lightboxIndex + 1}`}
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

function UnitSkeletonGrid() {
    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card space-y-3">
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                    <div className="skeleton h-8 w-full" />
                </div>
            ))}
        </div>
    );
}
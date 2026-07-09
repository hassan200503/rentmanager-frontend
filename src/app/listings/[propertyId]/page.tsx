// app/listings/[propertyId]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
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

    if (propertyLoading || unitsLoading) {
        return <LoadingState />;
    }

    if (propertyError || !property) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <EmptyState
                    title="Property not found"
                    description="This listing may have been removed."
                />
            </div>
        );
    }

    const [heroImage, ...restImages] = property.images ?? [];

    return (
        <div className="min-h-screen bg-canvas">

            {/* Header */}
            <div className="bg-white border-b border-ink/[0.08]">
                <div className="container mx-auto px-6 py-10 max-w-5xl">
                    <nav className="flex items-center gap-1.5 text-xs text-ink-muted mb-6">
                        <Link href="/listings" className="hover:text-ink transition-colors">
                            Listings
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-ink font-medium">{property.name}</span>
                    </nav>

                    <span className="pill pill-neutral mb-4">
                        {property.propertyType}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">
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

                {heroImage && (
                    <section>
                        <div className="grid gap-3 grid-cols-4 grid-rows-2 h-[420px]">
                            <img
                                src={heroImage}
                                alt={`${property.name} main photo`}
                                className="col-span-4 row-span-2 md:col-span-2 md:row-span-2 w-full h-full object-cover rounded-2xl shadow-sm"
                            />
                            {restImages.slice(0, 4).map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`${property.name} photo ${index + 2}`}
                                    className="hidden md:block w-full h-full object-cover rounded-2xl shadow-sm"
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-baseline justify-between border-b border-ink/[0.08] pb-4 mb-6">
                        <h2 className="text-xl font-semibold text-ink">
                            Vacant units
                        </h2>
                        {units && !units.empty && (
                            <span className="text-sm text-ink-muted">
                                {units.content.length} available
                            </span>
                        )}
                    </div>

                    {unitsError ? (
                        <EmptyState
                            title="Couldn't load units"
                            description="Something went wrong fetching vacancies for this property. Try refreshing the page."
                        />
                    ) : units?.empty ? (
                        <EmptyState
                            title="No vacant units"
                            description="Check back soon — this property has no vacancies right now."
                        />
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {units?.content.map((unit) => (
                                <UnitCard
                                    key={unit.id}
                                    propertyId={propertyId}
                                    unit={unit}
                                />
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
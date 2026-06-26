"use client";

import { useParams } from "next/navigation";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { usePropertyUnitsQuery } from "@/features/public-listings/queries/use-property-units-query";
import { UnitCard } from "@/features/public-listings/components/unit-card";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";
import { Home } from "lucide-react";

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
            <EmptyState
                title="Property not found"
                description="This listing may have been removed."
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-10">
                    <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 mb-3">
                        {property.propertyType}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
                    {property.description && (
                        <p className="mt-3 max-w-2xl text-gray-500 text-sm leading-relaxed">
                            {property.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 space-y-10">

                {/* Image gallery */}
                {property.images && property.images.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Photos</h2>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                            {property.images.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`${property.name} image ${index + 1}`}
                                    className="w-full h-56 object-cover rounded-xl shadow-sm"
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Vacant units */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Vacant units</h2>

                    {unitsError || units?.empty ? (
                        <EmptyState
                            title="No vacant units"
                            description="Check back soon — this property has no vacancies right now."
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
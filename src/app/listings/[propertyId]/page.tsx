"use client";

import { useParams } from "next/navigation";
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
            <EmptyState
                title="Property not found"
                description="This listing may have been removed."
            />
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{property.name}</h1>
                <p className="text-muted-foreground">{property.propertyType}</p>
                {property.description && (
                    <p className="mt-3 max-w-2xl">{property.description}</p>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Vacant units</h2>

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
            </div>
        </div>
    );
}
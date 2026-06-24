"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { usePublicProperty } from "@/features/public-listings/hooks/use-public-property";
import { usePropertyUnits } from "@/features/public-listings/hooks/use-property-units";

import { UnitGrid } from "@/features/public-listings/components/unit-grid";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

export default function PublicPropertyPage() {
    const { propertyId } =
        useParams<{ propertyId: string }>();

    const {
        data: property,
        isLoading,
        error,
    } = usePublicProperty(propertyId);

    const {
        data: units,
    } = usePropertyUnits(propertyId);

    if (isLoading) {
        return (
            <LoadingState message="Loading property..." />
        );
    }

    if (error || !property) {
        return (
            <EmptyState
                title="Property not found"
                description="The requested property does not exist."
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <Link
                href="/listings"
                className="text-sm underline"
            >
                Back to listings
            </Link>

            <div className="bg-white rounded-lg border p-6">
                <h1 className="text-3xl font-semibold">
                    {property.name}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    {property.propertyType}
                </p>

                {property.description && (
                    <p className="mt-4">
                        {property.description}
                    </p>
                )}
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">
                    Available Units
                </h2>

                {(units?.content?.length ?? 0) === 0 ? (
                    <EmptyState
                        title="No vacant units"
                        description="There are currently no available units."
                    />
                ) : (
                    <UnitGrid
                        units={units?.content ?? []}
                    />
                )}
            </section>
        </div>
    );
}
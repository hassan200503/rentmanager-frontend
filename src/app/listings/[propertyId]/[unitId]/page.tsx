"use client";

import { useParams } from "next/navigation";
import { usePublicUnitQuery } from "@/features/public-listings/queries/use-public-unit-query";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

export default function UnitDetailPage() {
    const params = useParams<{ propertyId: string; unitId: string }>();

    const { data: unit, isLoading: unitLoading, isError: unitError } =
        usePublicUnitQuery(params.unitId);

    const { data: property, isLoading: propertyLoading } =
        usePublicPropertyQuery(params.propertyId);

    if (unitLoading || propertyLoading) {
        return <LoadingState />;
    }

    if (unitError || !unit) {
        return (
            <EmptyState
                title="Unit not found"
                description="This unit may no longer be available."
            />
        );
    }

    const handleReserve = () => {
        // Stub — wired to the reservation/deposit module once it's built.
        // Keeping this isolated means nothing else changes when that's ready.
        alert("Reservation flow coming soon.");
    };

    return (
        <div className="container mx-auto py-8 max-w-2xl space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">
                    {property?.name ?? "Property"}
                </p>
                <h1 className="text-3xl font-bold">Unit {unit.unitNumber}</h1>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
                <p className="text-2xl font-semibold">
                    KES {unit.rentAmount.toLocaleString()}
                    <span className="text-base font-normal text-gray-500"> / month</span>
                </p>

                {unit.description && (
                    <p className="text-gray-700">{unit.description}</p>
                )}

                <button
                    onClick={handleReserve}
                    className="w-full px-6 py-3 rounded-md font-semibold bg-[#E8A33D] text-[#14213D] hover:bg-[#DC9530] transition-colors"
                >
                    Reserve this unit
                </button>
            </div>
        </div>
    );
}
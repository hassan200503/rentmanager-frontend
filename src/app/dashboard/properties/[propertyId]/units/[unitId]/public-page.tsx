"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { usePublicUnit } from "@/features/public-listings/hooks/use-public-unit";

import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";

export default function PublicUnitPage() {
    const { unitId } =
        useParams<{ unitId: string }>();

    const {
        data: unit,
        isLoading,
        error,
    } = usePublicUnit(unitId);

    if (isLoading) {
        return (
            <LoadingState message="Loading unit..." />
        );
    }

    if (error || !unit) {
        return (
            <EmptyState
                title="Unit not found"
                description="The requested unit does not exist."
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Link
                href={`/properties/${unit.propertyId}`}
                className="text-sm underline"
            >
                Back to property
            </Link>

            <div className="bg-white rounded-lg border p-6">
                <h1 className="text-3xl font-semibold">
                    {unit.unitNumber}
                </h1>

                <div className="mt-4 space-y-2">
                    <p>
                        <strong>Rent:</strong>{" "}
                        {unit.rentAmount}
                    </p>

                    <p>
                        <strong>Status:</strong>{" "}
                        {unit.occupancyStatus}
                    </p>
                </div>

                {unit.description && (
                    <div className="mt-6">
                        <h2 className="font-medium mb-2">
                            Description
                        </h2>

                        <p>{unit.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
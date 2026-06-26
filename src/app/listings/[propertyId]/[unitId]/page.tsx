"use client";

import { useParams } from "next/navigation";
import { usePublicUnitQuery } from "@/features/public-listings/queries/use-public-unit-query";
import { usePublicPropertyQuery } from "@/features/public-listings/queries/use-public-property-query";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";
import { Home } from "lucide-react";

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
        alert("Reservation flow coming soon.");
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-10 max-w-2xl">
                    <p className="text-sm text-gray-400 mb-1">
                        {property?.name ?? "Property"}
                    </p>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Unit {unit.unitNumber}
                        </h1>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                            Vacant
                        </span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 max-w-2xl space-y-8">

                {/* Image gallery */}
                {unit.images && unit.images.length > 0 ? (
                    <section>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Photos</h2>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                            {unit.images.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`Unit ${unit.unitNumber} image ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-xl shadow-sm"
                                />
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="w-full h-56 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-300 gap-2">
                        <Home className="w-8 h-8" />
                        <span className="text-xs">No images available</span>
                    </div>
                )}

                {/* Details card */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
                    <p className="text-2xl font-semibold text-gray-900">
                        KES {unit.rentAmount.toLocaleString()}
                        <span className="text-base font-normal text-gray-400"> / month</span>
                    </p>

                    {unit.description && (
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {unit.description}
                        </p>
                    )}

                    <button
                        onClick={handleReserve}
                        className="w-full px-6 py-3 rounded-lg font-semibold bg-[#E8A33D] text-[#14213D] hover:bg-[#DC9530] transition-colors"
                    >
                        Reserve this unit
                    </button>
                </div>

            </div>
        </div>
    );
}
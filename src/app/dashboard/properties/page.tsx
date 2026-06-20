"use client";

import { useRouter } from "next/navigation";

import { PropertyTable } from "@/features/property/components/property-table";
import { PropertyFilters } from "@/features/property/components/property-filters";

import {
    PropertyFilterState,
    usePropertyFilters,
} from "@/features/property/hooks/use-property-filters";

export default function PropertiesPage() {
    const router = useRouter();

    const { filters, updateFilter } = usePropertyFilters();

    return (
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold">Properties</h1>
                    <p className="text-sm text-gray-500">
                        Manage your property portfolio
                    </p>
                </div>

                <button
                    onClick={() => router.push("/dashboard/properties/create")}
                    className="px-4 py-2 bg-black text-white rounded"
                >
                    New Property
                </button>
            </div>

            {/* FILTERS */}
            <PropertyFilters
                onChange={(patch: Partial<PropertyFilterState>) => updateFilter(patch)}
            />

            {/* TABLE */}
            <PropertyTable params={filters} />

        </div>
    );
}

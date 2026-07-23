"use client";

import { useRouter } from "next/navigation";
import { Building2, Plus, SlidersHorizontal } from "lucide-react";

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
        <div className="page-container space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                        <Building2 className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="page-title mb-1">Properties</h1>
                        <p className="page-subtitle mb-0">Manage your property portfolio</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/dashboard/properties/create")}
                    className="btn-primary"
                >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    New property
                </button>
            </div>

            <div className="card-sm animate-fade-in-up">
                <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                    <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                    Filters
                </div>
                <PropertyFilters
                    onChange={(patch: Partial<PropertyFilterState>) =>
                        updateFilter(patch)
                    }
                />
            </div>

            <div className="animate-fade-in-up">
                <PropertyTable params={filters} onFilterChange={updateFilter} />
            </div>
        </div>
    );
}
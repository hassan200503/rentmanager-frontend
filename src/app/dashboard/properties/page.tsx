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
        <div className="page-container space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center animate-fade-in-up">
                <div>
                    <h1 className="page-title mb-1">Properties</h1>
                    <p className="page-subtitle mb-0">Manage your property portfolio</p>
                </div>

                <button
                    onClick={() => router.push("/dashboard/properties/create")}
                    className="btn-primary inline-flex items-center gap-2"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New Property
                </button>
            </div>

            {/* Filters — PropertyFilters has no self-styling of its own (plain flex row),
                so it genuinely needs this card-sm shell. */}
            <div className="card-sm animate-fade-in-up">
                <PropertyFilters
                    onChange={(patch: Partial<PropertyFilterState>) =>
                        updateFilter(patch)
                    }
                />
            </div>

            {/*
              FIXED: was wrapped in an extra `.card` div. PropertyTable already self-wraps
              with its own border/shadow-sm/rounded-lg shell (confirmed against its source,
              same as UnitTable was earlier) — the outer `.card` produced a card-in-card
              double border/shadow. Kept the fade-in animation on a plain wrapper instead.
            */}
            <div className="animate-fade-in-up">
                <PropertyTable params={filters} />
            </div>
        </div>
    );
}
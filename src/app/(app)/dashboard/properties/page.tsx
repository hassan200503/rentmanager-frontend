"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Download, Lock, Plus, SlidersHorizontal } from "lucide-react";

import { PropertyTable } from "@/features/property/components/property-table";
import { PropertyFilters } from "@/features/property/components/property-filters";
import { useHasRole } from "@/features/user/hooks/use-has-role";
import { WRITE_ROLES } from "@/features/user/lib/roles";
import { propertyApi } from "@/features/property/api/property-api";
import { usePropertyOccupancyQuery } from "@/features/unit/hooks/use-unit-summary-query";
import { buildPropertiesCsv, downloadCsv } from "@/features/property/utils/export-properties-csv";

import {
    PropertyFilterState,
    usePropertyFilters,
} from "@/features/property/hooks/use-property-filters";

// Hard ceiling on one export call — matches the safety-net size used
// elsewhere in this codebase (see dashboard/archive/page.tsx) for "give me
// everything matching these filters" queries where true pagination isn't
// worth the complexity yet.
const EXPORT_PAGE_SIZE = 1000;

export default function PropertiesPage() {
    const router = useRouter();
    const canWrite = useHasRole(WRITE_ROLES);
    const [isExporting, setIsExporting] = useState(false);

    const { filters, updateFilter } = usePropertyFilters();
    const { data: occupancyData } = usePropertyOccupancyQuery();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await propertyApi.list({
                search: filters.search,
                status: filters.status,
                propertyType: filters.propertyType,
                sort: filters.sort,
                page: 0,
                size: EXPORT_PAGE_SIZE,
            });

            if (result.totalElements > result.content.length) {
                toast.error(
                    `Exported the first ${result.content.length} of ${result.totalElements} properties — narrow the filters to export the rest.`
                );
            }

            const occupancyByProperty = new Map(
                (occupancyData ?? []).map((entry) => [entry.propertyId, entry])
            );
            const csv = buildPropertiesCsv(result.content, occupancyByProperty);
            downloadCsv(`properties-${new Date().toISOString().slice(0, 10)}.csv`, csv);
        } catch {
            toast.error("Failed to export properties.");
        } finally {
            setIsExporting(false);
        }
    };

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

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="btn-secondary"
                    >
                        <Download className="h-4 w-4" strokeWidth={2} />
                        {isExporting ? "Exporting…" : "Export CSV"}
                    </button>

                    {canWrite ? (
                        <button
                            onClick={() => router.push("/dashboard/properties/create")}
                            className="btn-primary"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            New property
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink/[0.04] border border-border text-xs text-ink-muted">
                            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            Only owners and managers can add properties
                        </div>
                    )}
                </div>
            </div>

            <div className="card-sm animate-fade-in-up">
                <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-ink-muted">
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
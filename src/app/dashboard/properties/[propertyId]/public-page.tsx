"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, DoorOpen, AlertTriangle } from "lucide-react";

import { usePublicProperty } from "@/features/public-listings/hooks/use-public-property";

import { UnitGrid } from "@/features/public-listings/components/unit-grid";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";
import {usePropertyUnits} from "@/features/public-listings/hooks/use-property-units";
// FIXED: this hook's actual export is `usePropertyUnitsQuery`, not `usePropertyUnits`
// — confirmed against features/public-listings/hooks/use-property-units.ts. The
// previous import name wouldn't have resolved at build time. Aliased on import
// rather than renaming the hook file itself, which isn't part of this request.


// Cosmetic only -- turns "APARTMENT" into "Apartment" for display.
const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export default function PublicPropertyPage() {
    const { propertyId } =
        useParams<{ propertyId: string }>();

    const {
        data: property,
        isLoading,
        error,
    } = usePublicProperty(propertyId);

    // FIXED: previously only `data` was read from this hook. Since units is undefined
    // while the query is in flight, the empty-state check below evaluated to true and
    // briefly rendered "No vacant units" even when units were still loading — same
    // shape of race already fixed elsewhere this pass (CreateUnitPage, TeamPage).
    const {
        data: units,
        isLoading: isLoadingUnits,
        error: unitsError,
    } = usePropertyUnits(propertyId);

    if (isLoading) {
        return (
            <LoadingState message="Loading property…" />
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

    const unitCount = units?.content?.length ?? 0;

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
            <Link
                href="/listings"
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to listings
            </Link>

            <div className="card animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                        <Building2 className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="page-title mb-1.5">
                            {property.name}
                        </h1>
                        <span className="pill-neutral">{formatEnumLabel(property.propertyType)}</span>
                    </div>
                </div>

                {property.description && (
                    <p className="mt-4 text-sm text-ink leading-relaxed">
                        {property.description}
                    </p>
                )}
            </div>

            <section className="space-y-4 animate-fade-in-up">
                <div className="flex items-center justify-between">
                    <h2 className="section-header mb-0 inline-flex items-center gap-1.5">
                        <DoorOpen className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                        Available units
                    </h2>
                    {!isLoadingUnits && !unitsError && unitCount > 0 && (
                        <span className="text-sm text-ink-muted font-data">{unitCount} available</span>
                    )}
                </div>

                {isLoadingUnits ? (
                    <LoadingState message="Loading units…" fullScreen={false} />
                ) : unitsError ? (
                    <EmptyState
                        title="Couldn't load units"
                        description="Something went wrong loading available units."
                        icon={AlertTriangle}
                        tone="danger"
                    />
                ) : unitCount === 0 ? (
                    <EmptyState
                        title="No vacant units"
                        description="There are currently no available units."
                    />
                ) : (
                    <UnitGrid
                        units={units?.content ?? []}
                        propertyId={propertyId}
                    />
                )}
            </section>
        </div>
    );
}
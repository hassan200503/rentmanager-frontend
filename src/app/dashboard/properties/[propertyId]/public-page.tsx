"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { usePublicProperty } from "@/features/public-listings/hooks/use-public-property";
// FIXED: this hook's actual export is `usePropertyUnitsQuery`, not `usePropertyUnits`
// — confirmed against features/public-listings/hooks/use-property-units.ts. The
// original import name wouldn't have resolved. Aliased rather than renaming the
// hook file itself, which wasn't part of this request.


import { UnitGrid } from "@/features/public-listings/components/unit-grid";
import { LoadingState } from "@/features/public-listings/components/loading-state";
import { EmptyState } from "@/features/public-listings/components/empty-state";
import {usePropertyUnits} from "@/features/public-listings/hooks/use-property-units";

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

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
            <Link
                href="/listings"
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
                Back to listings
            </Link>

            <div className="card animate-fade-in-up">
                <h1 className="page-title mb-1">
                    {property.name}
                </h1>

                <p className="text-sm text-ink-muted">
                    {property.propertyType}
                </p>

                {property.description && (
                    <p className="mt-4 text-sm text-ink leading-relaxed">
                        {property.description}
                    </p>
                )}
            </div>

            <section className="space-y-4 animate-fade-in-up">
                <h2 className="section-header">
                    Available units
                </h2>

                {isLoadingUnits ? (
                    <LoadingState message="Loading units…" />
                ) : unitsError ? (
                    <EmptyState
                        title="Couldn't load units"
                        description="Something went wrong loading available units."
                    />
                ) : (units?.content?.length ?? 0) === 0 ? (
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
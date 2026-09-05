"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDot, Home } from "lucide-react";
import { OccupancyStatus, type Property } from "@/features/property/types/property";

/**
 * Properties that need the landlord's attention, vacancies first.
 *
 * <h2>What this replaced, and why it had to go</h2>
 * This component used to render a "Top Properties" ranking with a percentage,
 * a progress bar, a traffic-light colour and a ✓/⚠ verdict per property. The
 * percentage was generated like this:
 *
 * <pre>
 *   const seed = [...propertyId ?? name].reduce((s, c) => s + c.charCodeAt(0), 0);
 *   if (FULLY_OCCUPIED)     return 95 + (seed % 5);
 *   if (PARTIALLY_OCCUPIED) return 40 + (seed % 35);
 *   if (VACANT)             return seed % 10;
 * </pre>
 *
 * It summed the character codes of the property's name and used the remainder
 * as an occupancy figure — then sorted the list by it. Two fully-occupied
 * properties received different scores purely because their names differed,
 * and were ranked against each other on that basis. A landlord reading
 * "Sunset Apartments 97% / Green Land 43%" would reasonably act on an
 * ordering that was alphabetical noise.
 *
 * <h2>Where the numbers come from now</h2>
 * {@code GET /units/occupancy-by-property} counts occupied-over-total per
 * property in one grouped SQL query, so each row can say "39 of 40 units
 * occupied" from real data. ARCHIVED units are excluded, matching how
 * {@code PropertyOccupancyRollupListener} derives a property's
 * {@link OccupancyStatus} — otherwise a property could read "fully occupied"
 * beside counts that disagreed.
 *
 * <p>The counts are optional. When they have not loaded, or a property has no
 * units, the row falls back to the categorical label rather than showing a
 * number this component does not have — which is exactly how the seeded
 * percentage got here in the first place.
 *
 * <h2>Ordering stays categorical, deliberately</h2>
 * Vacancies first, then partials, then the rest, alphabetically within each
 * group. A landlord scanning this panel is looking for problems, not a
 * leaderboard, and sorting by percentage would bury a 0-of-2 property beneath
 * a 38-of-40 one.
 */

interface PropertyRankingProps {
    properties: Property[];
    /**
     * Real occupied/total counts, keyed by property id. Optional: the panel
     * degrades to categorical labels when the counts have not loaded, rather
     * than showing a number it does not have.
     */
    occupancyByProperty?: Record<string, { totalUnits: number; occupiedUnits: number; occupancyPercent: number | null }>;
}

type Presentation = {
    label: string;
    /** Lower sorts first — vacancies before partials before healthy. */
    weight: number;
    icon: typeof AlertTriangle;
    color: string;
    bg: string;
    needsAttention: boolean;
};

function presentationFor(status: OccupancyStatus | undefined): Presentation {
    switch (status) {
        case OccupancyStatus.VACANT:
            return {
                label: "No units occupied",
                weight: 0,
                icon: AlertTriangle,
                color: "var(--color-danger)",
                bg: "var(--color-danger-bg)",
                needsAttention: true,
            };
        case OccupancyStatus.PARTIALLY_OCCUPIED:
            return {
                label: "Some units vacant",
                weight: 1,
                icon: CircleDot,
                color: "var(--color-warning)",
                bg: "var(--color-warning-bg)",
                needsAttention: true,
            };
        case OccupancyStatus.FULLY_OCCUPIED:
            return {
                label: "Fully occupied",
                weight: 2,
                icon: CheckCircle2,
                color: "var(--color-success)",
                bg: "var(--color-success-bg)",
                needsAttention: false,
            };
        default:
            return {
                label: "Occupancy not known yet",
                weight: 3,
                icon: CircleDot,
                color: "var(--color-fg-muted)",
                bg: "var(--color-border-subtle)",
                needsAttention: false,
            };
    }
}

export function PropertyRankingSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-7 w-7 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-28 rounded" />
                        <div className="skeleton h-2.5 w-20 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function PropertyRanking({ properties, occupancyByProperty }: PropertyRankingProps) {
    const ordered = properties
        .map((property) => ({ property, presentation: presentationFor(property.occupancyStatus) }))
        // Stable and explainable: vacancies, then partials, then the rest,
        // alphabetically within each group. Nothing here is derived from a
        // number the system does not have.
        .sort(
            (a, b) =>
                a.presentation.weight - b.presentation.weight ||
                (a.property.name ?? "").localeCompare(b.property.name ?? "")
        )
        .slice(0, 5);

    if (ordered.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                    <Home className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </div>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                    No properties yet.
                </p>
            </div>
        );
    }

    const allHealthy = ordered.every((row) => !row.presentation.needsAttention);

    return (
        <div className="space-y-1">
            {allHealthy && (
                <p className="mb-3 text-xs text-success">
                    Every property is fully occupied.
                </p>
            )}

            {ordered.map(({ property: p, presentation }) => {
                const Icon = presentation.icon;
                return (
                    <Link
                        key={p.propertyId}
                        href={`/dashboard/properties/${p.propertyId}`}
                        className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-all duration-150 hover:border-brand/10 hover:bg-brand-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-brand-900/10"
                    >
                        <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: presentation.bg, color: presentation.color }}
                        >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-fg dark:text-fg-dark">
                                {p.name}
                            </span>
                            <span
                                className="block text-[11px]"
                                style={{ color: presentation.color }}
                            >
                                {/* Real counts when they have loaded, the
                                    categorical label otherwise. Never a
                                    number the panel does not actually have —
                                    which is how this component previously
                                    ended up deriving one from the property
                                    name's character codes. */}
                                {(() => {
                                    const counts = occupancyByProperty?.[p.propertyId ?? ""];
                                    if (!counts || counts.totalUnits === 0) {
                                        return presentation.label;
                                    }
                                    return `${counts.occupiedUnits} of ${counts.totalUnits} units occupied`;
                                })()}
                            </span>
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

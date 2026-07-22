"use client";

import Link from "next/link";
import { PublicUnitResponse } from "../types/public-unit";

interface UnitCardProps {
    propertyId: string;
    unit: PublicUnitResponse;
}

// FIXED (2026-07-08): previously the badge always rendered the literal
// string "Vacant", regardless of unit.occupancyStatus. Today every unit
// reaching this card is guaranteed VACANT server-side (public listing
// endpoints filter on UnitOccupancyStatus.VACANT), so this was never
// visibly wrong — but it was silently ignoring the actual field, which
// would mislead a viewer the moment that contract ever changes. This
// reads the real value instead, with a neutral fallback for any value
// this component doesn't have specific styling for.
const occupancyBadge = (occupancyStatus: string): { label: string; className: string } => {
    switch (occupancyStatus) {
        case "VACANT":
            return { label: "Vacant", className: "pill-success" };
        default:
            // Unexpected value for a public listing card — show the raw
            // status rather than silently mislabeling it as "Vacant".
            return { label: occupancyStatus, className: "pill-neutral" };
    }
};

export function UnitCard({ propertyId, unit }: UnitCardProps) {
    const badge = occupancyBadge(unit.occupancyStatus);

    return (
        <div className="card-interactive p-0 overflow-hidden">
            <Link href={`/listings/${propertyId}/${unit.id}`}>
                {unit.images?.[0] ? (
                    <img
                        src={unit.images[0]}
                        alt={`Unit ${unit.unitNumber}`}
                        className="w-full h-40 object-cover"
                    />
                ) : (
                    <div className="w-full h-40 bg-ink/[0.04] flex items-center justify-center text-ink-muted text-sm">
                        No image
                    </div>
                )}

                <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h4 className="font-semibold text-ink truncate">
                                {unit.label || `Unit ${unit.unitNumber}`}
                            </h4>
                            {unit.label && (
                                <p className="text-xs text-ink-muted font-normal mt-0.5 tracking-tight">
                                    {unit.unitNumber}
                                </p>
                            )}
                        </div>
                        <span className={badge.className + " flex-shrink-0"}>
                            {badge.label}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                        {unit.floor && (
                            <span className="inline-flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {unit.floor}
                            </span>
                        )}
                        {unit.depositAmount ? (
                            <span>{unit.depositAmount.toLocaleString()} KES deposit</span>
                        ) : null}
                    </div>

                    <p className="mt-2 font-data text-lg font-semibold text-ink">
                        KES {unit.rentAmount.toLocaleString()}
                        <span className="text-sm font-normal text-ink-muted"> / month</span>
                    </p>

                    {unit.description && (
                        <p className="mt-1 text-sm text-ink-muted line-clamp-2">{unit.description}</p>
                    )}
                </div>
            </Link>

            {/* Reserve button — outside the Link to avoid nested anchor */}
            <div className="px-4 pb-4">
                <Link
                    href={`/reserve/${unit.id}`}
                    className="btn-primary block w-full text-center"
                >
                    Reserve this unit
                </Link>
            </div>
        </div>
    );
}
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicUnitResponse } from "../types/public-unit";

interface UnitCardProps {
    propertyId: string;
    unit: PublicUnitResponse;
}

const occupancyBadge = (occupancyStatus: string): { label: string; className: string } => {
    switch (occupancyStatus) {
        case "VACANT":
            return { label: "Vacant", className: "pill-success" };
        default:
            return { label: occupancyStatus, className: "pill-neutral" };
    }
};

export function UnitCard({ propertyId, unit }: UnitCardProps) {
    const badge = occupancyBadge(unit.occupancyStatus);

    return (
        <div className="group bg-surface rounded-2xl border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:border-brand-200 hover:-translate-y-0.5 overflow-hidden">
            {unit.images?.[0] ? (
                <div className="relative overflow-hidden h-44">
                    <img
                        src={unit.images[0]}
                        alt={`Unit ${unit.unitNumber}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            ) : (
                <div className="h-44 bg-ink/[0.03] flex items-center justify-center text-ink-muted text-sm group-hover:bg-ink/[0.06] transition-colors">
                    No image
                </div>
            )}

            <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="font-semibold text-ink truncate group-hover:text-brand transition-colors duration-200">
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </h4>
                        {unit.label && (
                            <p className="text-xs text-ink-muted font-normal mt-0.5">
                                {unit.unitNumber}
                            </p>
                        )}
                    </div>
                    <span className={badge.className + " flex-shrink-0 mt-0.5"}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {badge.label}
                    </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                    {unit.floor && (
                        <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Floor {unit.floor}
                        </span>
                    )}
                    {unit.depositAmount ? (
                        <span>{unit.depositAmount.toLocaleString()} KES deposit</span>
                    ) : null}
                </div>

                <p className="mt-3 font-data text-lg font-semibold text-ink">
                    KES {unit.rentAmount.toLocaleString()}
                    <span className="text-sm font-normal text-ink-muted"> /month</span>
                </p>

                {unit.description && (
                    <p className="mt-2 text-sm text-ink-muted/80 line-clamp-2 leading-relaxed">{unit.description}</p>
                )}

                <div className="mt-4 flex items-center gap-3">
                    <Link
                        href={`/reserve/${unit.id}`}
                        className="btn-primary flex-1 text-center text-sm"
                    >
                        Reserve this unit
                    </Link>
                    <Link
                        href={`/listings/${propertyId}/${unit.id}`}
                        className="btn-secondary px-3 py-2 text-sm"
                        aria-label="View details"
                    >
                        <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

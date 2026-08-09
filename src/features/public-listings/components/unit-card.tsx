import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Banknote, Layers } from "lucide-react";
import { PublicUnitResponse } from "../types/public-unit";
import { VerifiedBadge } from "./verified-badge";

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
        <div className="group bg-surface rounded-2xl border border-border shadow-card transition-all duration-300 hover:shadow-elevated hover:border-brand-200/80 hover:-translate-y-1 overflow-hidden flex flex-col">
            {unit.images?.[0] ? (
                <Link
                    href={`/listings/${propertyId}/${unit.id}`}
                    aria-label={`View details for ${unit.label || `Unit ${unit.unitNumber}`}`}
                    className="relative overflow-hidden h-48 block"
                >
                    <Image
                        src={unit.images[0]}
                        alt={`Unit ${unit.unitNumber}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

                    {unit.landlordVerified && (
                        <div className="absolute top-3 left-3">
                            <VerifiedBadge size="sm" />
                        </div>
                    )}

                    <span className={`${badge.className} absolute top-3 right-3 backdrop-blur-sm`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {badge.label}
                    </span>

                    <span className="absolute bottom-3 left-3 inline-flex items-end gap-1 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-[var(--shadow-button)] dark:bg-white/10 dark:ring-1 dark:ring-white/15">
                        <span className="font-data text-lg font-semibold text-ink leading-none dark:text-fg-dark">
                            KES {unit.rentAmount.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-medium text-ink-muted leading-none pb-0.5">
                            /month
                        </span>
                    </span>
                </Link>
            ) : (
                <div className="relative h-48 bg-gradient-to-br from-brand-50 to-surface dark:from-brand-900/30 dark:to-surface-dark flex items-center justify-center">
                    <span className="absolute top-3 left-3">
                        {unit.landlordVerified && <VerifiedBadge size="sm" />}
                    </span>
                    <div className="flex flex-col items-center gap-1.5 text-ink-muted">
                        <Layers className="w-5 h-5" strokeWidth={1.5} />
                        <p className="text-xs font-medium">No photo available</p>
                    </div>
                    <span className="absolute bottom-3 left-3 inline-flex items-end gap-1 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-[var(--shadow-button)] dark:bg-white/10 dark:ring-1 dark:ring-white/15">
                        <span className="font-data text-lg font-semibold text-ink leading-none dark:text-fg-dark">
                            KES {unit.rentAmount.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-medium text-ink-muted leading-none pb-0.5">
                            /month
                        </span>
                    </span>
                </div>
            )}

            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <Link
                            href={`/listings/${propertyId}/${unit.id}`}
                            className="font-semibold text-ink truncate group-hover:text-brand transition-colors duration-200 block"
                        >
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </Link>
                        {unit.label && (
                            <p className="text-xs text-ink-muted font-normal mt-0.5">
                                {unit.unitNumber}
                            </p>
                        )}
                    </div>
                    <span className={badge.className}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {badge.label}
                    </span>
                </div>

                {unit.images?.[0] ? (
                    unit.floor || unit.depositAmount ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {unit.floor && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink/[0.04] dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                                    <Layers className="w-3 h-3" strokeWidth={1.5} />
                                    {unit.floor}
                                </span>
                            )}
                            {unit.depositAmount ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink/[0.04] dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                                    <Banknote className="w-3 h-3" strokeWidth={1.5} />
                                    {unit.depositAmount.toLocaleString()} KES deposit
                                </span>
                            ) : null}
                        </div>
                    ) : null
                ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                        {unit.floor && <span>{unit.floor}</span>}
                        {unit.depositAmount ? (
                            <span>{unit.depositAmount.toLocaleString()} KES deposit</span>
                        ) : null}
                    </div>
                )}

                {unit.description && (
                    <p className="mt-3 text-sm text-ink-muted/90 line-clamp-2 leading-relaxed">
                        {unit.description}
                    </p>
                )}

                <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">
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
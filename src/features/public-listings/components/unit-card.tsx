import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Banknote, Layers } from "lucide-react";
import { PublicUnitResponse } from "../types/public-unit";
import { LandlordStatusBadge } from "./landlord-status-badge";

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
        <article className="group relative bg-gradient-to-br from-white via-white to-brand-50/20 dark:from-surface-dark dark:via-surface-dark dark:to-brand-900/10 rounded-3xl border border-border/60 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.18),0_12px_24px_-8px_rgba(5,150,105,0.12)] hover:border-brand-300/80 hover:-translate-y-3 overflow-hidden flex flex-col before:absolute before:inset-0 before:rounded-3xl before:ring-[2px] before:ring-inset before:ring-transparent hover:before:ring-brand-200/50 dark:hover:before:ring-brand-400/30 before:transition-all before:duration-500 before:pointer-events-none after:absolute after:inset-[1px] after:rounded-[calc(1.5rem-1px)] after:bg-gradient-to-b after:from-white/60 after:via-transparent after:to-transparent dark:after:from-white/[0.03] after:pointer-events-none after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500">
            {/* Premium square image section */}
            {unit.images?.[0] ? (
                <Link
                    href={`/listings/${propertyId}/${unit.id}`}
                    aria-label={`View details for ${unit.label || `Unit ${unit.unitNumber}`}`}
                    className="relative overflow-hidden aspect-square block"
                >
                    <Image
                        src={unit.images[0]}
                        alt={`${unit.label || `Unit ${unit.unitNumber}`} interior`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-all duration-[900ms] ease-out group-hover:scale-[1.12]"
                        priority={false}
                    />
                    
                    {/* Sophisticated overlay with gradient depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Landlord account is active -- not an identity check. */}
                    {unit.landlordVerified && (
                        <div className="absolute top-4 left-4 transition-all duration-500 group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <LandlordStatusBadge size="sm" />
                        </div>
                    )}

                    {/* Elevated status badge */}
                    <span className={`${badge.className} absolute top-4 right-4 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] ring-1 ring-white/30 dark:ring-white/20 font-bold text-xs px-3.5 py-2 transition-all duration-500 group-hover:scale-110 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
                        {badge.label}
                    </span>

                    {/* Premium pricing badge with luxury styling */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between transition-all duration-500 group-hover:translate-y-[-4px]">
                        <div className="inline-flex items-end gap-1.5 rounded-2xl bg-white/98 backdrop-blur-2xl px-4 py-3 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.4)] dark:bg-white/[0.15] dark:ring-1 dark:ring-white/30 transition-all duration-500 group-hover:shadow-[0_16px_40px_-4px_rgba(0,0,0,0.5)] group-hover:bg-white">
                            <span className="font-data text-2xl font-extrabold text-ink leading-none dark:text-white tracking-tight">
                                {unit.rentAmount.toLocaleString()}
                            </span>
                            <div className="flex flex-col pb-0.5">
                                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider leading-none">
                                    KES
                                </span>
                                <span className="text-[10px] font-bold text-ink-muted/70 leading-none mt-0.5">
                                    /month
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            ) : (
                <div className="relative aspect-square bg-gradient-to-br from-brand-50/80 via-white to-brand-50/40 dark:from-brand-900/30 dark:via-surface-dark dark:to-brand-800/20 flex items-center justify-center">
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
                    
                    {unit.landlordVerified && (
                        <div className="absolute top-4 left-4">
                            <LandlordStatusBadge size="sm" />
                        </div>
                    )}
                    
                    <div className="flex flex-col items-center gap-3 text-ink-muted z-10">
                        <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 dark:bg-white/[0.1] ring-1 ring-ink/[0.08] dark:ring-white/[0.1] shadow-lg">
                            <Layers className="w-9 h-9" strokeWidth={2} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider">No Image</p>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="inline-flex items-end gap-1.5 rounded-2xl bg-white/98 backdrop-blur-2xl px-4 py-3 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.3)] dark:bg-white/[0.15] dark:ring-1 dark:ring-white/30">
                            <span className="font-data text-2xl font-extrabold text-ink leading-none dark:text-white tracking-tight">
                                {unit.rentAmount.toLocaleString()}
                            </span>
                            <div className="flex flex-col pb-0.5">
                                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider leading-none">
                                    KES
                                </span>
                                <span className="text-[10px] font-bold text-ink-muted/70 leading-none mt-0.5">
                                    /month
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium content section with refined spacing */}
            <div className="relative z-10 p-6 flex flex-col flex-1 bg-gradient-to-b from-transparent to-white/40 dark:to-white/[0.02]">
                {/* Unit identifier with luxury typography */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/listings/${propertyId}/${unit.id}`}
                            className="font-display text-lg font-bold text-ink dark:text-white truncate group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors duration-300 block tracking-tight"
                        >
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </Link>
                        {unit.label && (
                            <p className="text-[11px] text-ink-muted/70 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                                {unit.unitNumber}
                            </p>
                        )}
                    </div>
                </div>

                {/* Premium metadata chips */}
                {(unit.floor || unit.depositAmount) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {unit.floor && (
                            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-ink/[0.06] to-ink/[0.03] dark:from-white/[0.1] dark:to-white/[0.05] px-3.5 py-2 text-xs font-bold text-ink-muted dark:text-white/80 border border-ink/[0.08] dark:border-white/[0.1] shadow-sm transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-brand-50 group-hover:to-brand-50/50 group-hover:border-brand-200/60 group-hover:text-brand-800 group-hover:shadow-md">
                                <Layers className="w-3.5 h-3.5" strokeWidth={2.5} />
                                <span>{unit.floor}</span>
                            </span>
                        )}
                        {unit.depositAmount && (
                            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/40 dark:from-emerald-900/20 dark:to-emerald-900/10 px-3.5 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                                <Banknote className="w-3.5 h-3.5" strokeWidth={2.5} />
                                <span>{unit.depositAmount.toLocaleString()} KES</span>
                            </span>
                        )}
                    </div>
                )}

                {/* Refined description with better typography */}
                {unit.description && (
                    <p className="text-[13px] text-ink-muted/80 dark:text-white/60 line-clamp-2 leading-relaxed font-medium mb-5">
                        {unit.description}
                    </p>
                )}

                {/* Premium action buttons with sophisticated styling */}
                <div className="mt-auto pt-5 border-t border-border/40 dark:border-white/[0.08] flex items-stretch gap-3">
                    <Link
                        href={`/reserve/${unit.id}`}
                        className="flex-1 group/btn relative overflow-hidden text-center text-sm font-bold py-3.5 px-5 rounded-[14px] bg-gradient-to-b from-brand-500 via-brand-600 to-brand-700 hover:from-brand-600 hover:via-brand-700 hover:to-brand-800 text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-6px_rgba(5,150,105,0.5)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_16px_32px_-8px_rgba(5,150,105,0.6),0_0_0_4px_rgba(5,150,105,0.1)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_-4px_rgba(5,150,105,0.4)] before:absolute before:inset-0 before:bg-gradient-to-t before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                    >
                        <span className="relative z-10">Reserve Unit</span>
                    </Link>
                    <Link
                        href={`/listings/${propertyId}/${unit.id}`}
                        className="flex items-center justify-center w-12 h-auto rounded-[14px] border-2 border-border/80 dark:border-white/[0.15] bg-white/80 dark:bg-white/[0.06] hover:border-brand-400 dark:hover:border-brand-400 hover:bg-gradient-to-br hover:from-brand-50 hover:to-brand-100/50 dark:hover:bg-brand-900/40 text-ink-muted hover:text-brand transition-all duration-300 hover:scale-110 hover:-translate-y-1 active:scale-100 active:translate-y-0 shadow-sm hover:shadow-md"
                        aria-label="View unit details"
                    >
                        <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
                    </Link>
                </div>
            </div>
        </article>
    );
}
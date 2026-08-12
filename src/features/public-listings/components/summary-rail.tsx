// features/public-listings/components/summary-rail.tsx
// Desktop sticky availability rail + mobile fixed action bar.
"use client";

import { BellRing, ShieldCheck, Sparkles } from "lucide-react";

interface SummaryRailProps {
    propertyName: string;
    available: boolean;
    unitCount: number;
    priceRange: { min: number; max: number } | null;
    loading?: boolean;
}

const ksh = (value: number) => `KES ${value.toLocaleString()}`;

export function SummaryRail({ propertyName, available, unitCount, priceRange, loading }: SummaryRailProps) {
    const ctaHref = available ? "#available-units" : "#notify-form";

    return (
        <>
            {/* ── Desktop sticky rail ── */}
            <aside className="hidden lg:block animate-fade-in-up" aria-label="Listing summary" style={{ animationDelay: '200ms' }}>
                <div className="sticky top-24 space-y-4">
                    {/* Main summary card */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-border/60 bg-gradient-to-br from-white via-white to-brand-50/20 dark:from-surface-dark dark:via-surface-dark dark:to-brand-900/10 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-500">
                        {/* Premium gradient accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-400/10 to-accent/10 rounded-full blur-3xl -z-10" aria-hidden="true" />
                        
                        <div className="flex items-center justify-between gap-3 relative z-10">
                            <span className="text-xs uppercase tracking-[0.1em] font-bold text-brand-700 dark:text-brand-400">
                                Availability
                            </span>
                            {loading ? (
                                <span className="skeleton h-6 w-28 rounded-full" />
                            ) : (
                                <span
                                    className={`pill !gap-2 shadow-sm font-bold ${
                                        available 
                                            ? "pill-success bg-success-bg dark:bg-success-bg-dark border-2 border-success/20" 
                                            : "pill-neutral border-2 border-border/60"
                                    }`}
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            available ? "bg-success status-dot-live shadow-[0_0_8px_rgba(22,163,74,0.6)]" : "bg-ink-muted/40"
                                        }`}
                                    />
                                    {available ? `${unitCount} available` : "No vacancies"}
                                </span>
                            )}
                        </div>

                        <div className="mt-5 pt-5 border-t-2 border-border/40">
                            {loading ? (
                                <div className="space-y-3">
                                    <div className="skeleton h-8 w-3/4" />
                                    <div className="skeleton h-4 w-1/2" />
                                </div>
                            ) : available && priceRange ? (
                                <>
                                    <p className="font-data text-3xl font-bold text-ink dark:text-white leading-none tracking-tight bg-gradient-to-br from-ink via-ink to-ink/80 dark:from-white dark:to-white/90 bg-clip-text">
                                        {ksh(priceRange.min)}
                                        {priceRange.max !== priceRange.min && (
                                            <span className="text-2xl text-ink-muted dark:text-white/70"> – {ksh(priceRange.max)}</span>
                                        )}
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-ink-muted dark:text-white/70">
                                        per month · {unitCount} unit{unitCount === 1 ? "" : "s"}
                                    </p>
                                </>
                            ) : available ? (
                                <>
                                    <p className="text-base font-bold text-ink dark:text-white">
                                        Rent from
                                    </p>
                                    <p className="mt-2 text-sm text-ink-muted dark:text-white/70 leading-relaxed">
                                        Reserve your next home directly — no agents, no fees.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-base font-bold text-ink dark:text-white">
                                        Waitlist open
                                    </p>
                                    <p className="mt-2 text-sm text-ink-muted dark:text-white/70 leading-relaxed">
                                        New units are let quickly. Be first to know when one opens.
                                    </p>
                                </>
                            )}
                        </div>

                        <a 
                            href={ctaHref} 
                            className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 shadow-[0_4px_16px_-2px_rgba(5,150,105,0.4)] hover:shadow-[0_8px_24px_-4px_rgba(5,150,105,0.5)] transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <BellRing className="w-4.5 h-4.5" strokeWidth={2.5} />
                            {available ? "View available units" : "Get notified"}
                        </a>

                        <div className="mt-4 pt-4 border-t-2 border-border/40 flex items-center gap-2.5 text-sm text-ink-muted dark:text-white/70">
                            <ShieldCheck className="w-5 h-5 text-brand shrink-0" strokeWidth={2.5} />
                            <span className="font-semibold">Secure listing · managed on RentManager</span>
                        </div>
                    </div>

                    {/* Trust hint card */}
                    <div className="rounded-2xl border-2 border-dashed border-brand-200/60 dark:border-brand-800/60 bg-gradient-to-br from-brand-50/40 to-accent/5 dark:from-brand-900/20 dark:to-accent/10 px-5 py-4 flex items-start gap-3 animate-fade-in-up shadow-sm" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-brass to-brass-dark text-white shadow-lg shadow-brass/25">
                            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <p className="text-sm font-semibold text-ink-muted dark:text-white/80 leading-relaxed">
                            Vacancy status updates in real time the moment a unit is let.
                        </p>
                    </div>
                </div>
            </aside>

            {/* ── Mobile fixed action bar ── */}
            <div className="mobile-cta-bar lg:hidden border-t-2 border-border/80 shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink dark:text-white">{propertyName}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-ink-muted dark:text-white/70">
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    available ? "bg-success status-dot-live shadow-[0_0_6px_rgba(22,163,74,0.6)]" : "bg-ink-muted/40"
                                }`}
                            />
                            {available ? `${unitCount} units available` : "No vacancies"}
                        </p>
                    </div>
                    <a 
                        href={ctaHref} 
                        className="flex items-center gap-2 shrink-0 px-5 py-3 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-sm shadow-[0_4px_16px_-2px_rgba(5,150,105,0.4)] transition-all duration-300 active:scale-95"
                    >
                        {available ? (
                            <>View units</>
                        ) : (
                            <>
                                <BellRing className="w-4 h-4" strokeWidth={2.5} />
                                Get notified
                            </>
                        )}
                    </a>
                </div>
            </div>
        </>
    );
}
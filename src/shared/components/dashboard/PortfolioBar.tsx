"use client";

interface PortfolioBarProps {
    active: number;
    underMaintenance: number;
    draft: number;
    archived: number;
}

interface Segment {
    label: string;
    value: number;
    barClass: string;
    dotClass: string;
}

export default function PortfolioBar({ active, underMaintenance, draft, archived }: PortfolioBarProps) {
    const total = active + underMaintenance + draft + archived;

    const segments: Segment[] = [
        { label: "Active", value: active, barClass: "bg-brand", dotClass: "bg-brand" },
        { label: "Under maintenance", value: underMaintenance, barClass: "bg-warning dark:bg-warning", dotClass: "bg-warning" },
        { label: "Draft", value: draft, barClass: "bg-fg-subtle dark:bg-fg-subtle-dark", dotClass: "bg-fg-subtle dark:bg-fg-subtle-dark" },
        { label: "Archived", value: archived, barClass: "bg-border dark:bg-border-dark", dotClass: "bg-border dark:bg-border-dark" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-border-subtle shadow-inner ring-1 ring-black/5 dark:bg-border-subtle-dark dark:ring-white/10">
                {total > 0 ?
                    segments.map((seg) =>
                        seg.value > 0 ? (
                            <div
                                key={seg.label}
                                className={`${seg.barClass} transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]`}
                                style={{ width: `${(seg.value / total) * 100}%` }}
                                title={`${seg.label}: ${seg.value}`}
                            />
                        ) : null
                    ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {total === 0 ? (
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">No properties yet.</p>
                ) : (
                    segments.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface/60 px-3 py-2 text-xs shadow-sm dark:border-border-dark/60 dark:bg-surface-dark/60">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${seg.dotClass}`} aria-hidden />
                            <span className="min-w-0 flex-1 truncate text-fg-muted dark:text-fg-muted-dark">{seg.label}</span>
                            <span className="font-mono-nums font-semibold text-fg dark:text-fg-dark">{seg.value}</span>
                            <span className="font-mono-nums text-fg-subtle dark:text-fg-subtle-dark">({Math.round((seg.value / total) * 100)}%)</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

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
        <div className="space-y-3">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                {total > 0 ?
                    segments.map((seg) =>
                        seg.value > 0 ? (
                            <div
                                key={seg.label}
                                className={seg.barClass}
                                style={{ width: `${(seg.value / total) * 100}%` }}
                                title={`${seg.label}: ${seg.value}`}
                            />
                        ) : null
                    ) : null}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
                {total === 0 ? (
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">No properties yet.</p>
                ) : (
                    segments.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${seg.dotClass}`} aria-hidden />
                            <span className="text-fg-muted dark:text-fg-muted-dark">{seg.label}</span>
                            <span className="font-mono-nums font-medium text-fg dark:text-fg-dark">{seg.value}</span>
                            <span className="text-fg-muted dark:text-fg-muted-dark">({Math.round((seg.value / total) * 100)}%)</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
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
        { label: "Active", value: active, barClass: "bg-primary", dotClass: "bg-primary" },
        { label: "Under maintenance", value: underMaintenance, barClass: "bg-warning-dark", dotClass: "bg-warning-dark" },
        { label: "Draft", value: draft, barClass: "bg-ink/25", dotClass: "bg-ink/25" },
        { label: "Archived", value: archived, barClass: "bg-ink/10", dotClass: "bg-ink/10" },
    ];

    return (
        <div className="space-y-3">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink/[0.06]">
                {total > 0 &&
                    segments.map((seg) =>
                        seg.value > 0 ? (
                            <div
                                key={seg.label}
                                className={seg.barClass}
                                style={{ width: `${(seg.value / total) * 100}%` }}
                                title={`${seg.label}: ${seg.value}`}
                            />
                        ) : null
                    )}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
                {total === 0 ? (
                    <p className="text-xs text-ink-muted">No properties yet.</p>
                ) : (
                    segments.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${seg.dotClass}`} aria-hidden />
                            <span className="text-ink-muted">{seg.label}</span>
                            <span className="font-data font-medium text-ink">{seg.value}</span>
                            <span className="text-ink-muted">({Math.round((seg.value / total) * 100)}%)</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
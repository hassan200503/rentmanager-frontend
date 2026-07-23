"use client";

interface OccupancyDonutProps {
    fullyOccupied: number;
    vacant: number;
    activeProperties: number;
}

const SIZE = 128;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Segment {
    label: string;
    value: number;
    colorClass: string;
}

export default function OccupancyDonut({ fullyOccupied, vacant, activeProperties }: OccupancyDonutProps) {
    const other = Math.max(activeProperties - fullyOccupied - vacant, 0);
    const total = activeProperties;

    const segments: Segment[] = [
        { label: "Fully occupied", value: fullyOccupied, colorClass: "text-brand" },
        { label: "Partially occupied", value: other, colorClass: "text-warning-dark dark:text-warning" },
        { label: "Vacant", value: vacant, colorClass: "text-danger" },
    ];

    const occupancyRate = total > 0 ? Math.round((fullyOccupied / total) * 100) : null;

    let cumulative = 0;

    return (
        <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        strokeWidth={STROKE}
                        className="stroke-border dark:stroke-border-dark"
                    />
                    {total > 0 &&
                        segments.map((seg) => {
                            if (seg.value <= 0) return null;
                            const length = (seg.value / total) * CIRCUMFERENCE;
                            const dashArray = `${length} ${CIRCUMFERENCE - length}`;
                            const offset = -cumulative;
                            cumulative += length;
                            return (
                                <circle
                                    key={seg.label}
                                    cx={SIZE / 2}
                                    cy={SIZE / 2}
                                    r={RADIUS}
                                    fill="none"
                                    strokeWidth={STROKE}
                                    strokeDasharray={dashArray}
                                    strokeDashoffset={offset}
                                    strokeLinecap="butt"
                                    stroke="currentColor"
                                    className={seg.colorClass}
                                />
                            );
                        })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono-nums text-xl font-semibold text-fg dark:text-fg-dark">
                        {occupancyRate !== null ? `${occupancyRate}%` : "—"}
                    </span>
                    <span className="text-[10px] text-fg-muted dark:text-fg-muted-dark">occupied</span>
                </div>
            </div>

            <div className="space-y-2">
                {total === 0 ? (
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">No active properties yet.</p>
                ) : (
                    segments.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-2 text-xs">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${seg.colorClass.replace("text-", "bg-")}`} aria-hidden />
                            <span className="text-fg-muted dark:text-fg-muted-dark">{seg.label}</span>
                            <span className="font-mono-nums font-medium text-fg dark:text-fg-dark">{seg.value}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
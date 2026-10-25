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
    gradientId: string;
    dotClass: string;
}

export default function OccupancyDonut({ fullyOccupied, vacant, activeProperties }: OccupancyDonutProps) {
    const other = Math.max(activeProperties - fullyOccupied - vacant, 0);
    const total = activeProperties;

    const segments: Segment[] = [
        { label: "Fully occupied", value: fullyOccupied, gradientId: "occFully", dotClass: "bg-success" },
        { label: "Partially occupied", value: other, gradientId: "occPartial", dotClass: "bg-warning" },
        { label: "Vacant", value: vacant, gradientId: "occVacant", dotClass: "bg-danger" },
    ];

    const occupancyRate = total > 0 ? Math.round((fullyOccupied / total) * 100) : null;

    let cumulative = 0;

    return (
        <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90 drop-shadow-sm">
                    <defs>
                        <linearGradient id="occFully" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#4ADE80" }} />
                            <stop offset="100%" style={{ stopColor: "#059669" }} />
                        </linearGradient>
                        <linearGradient id="occPartial" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#FBBF24" }} />
                            <stop offset="100%" style={{ stopColor: "#D97706" }} />
                        </linearGradient>
                        <linearGradient id="occVacant" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#FB7185" }} />
                            <stop offset="100%" style={{ stopColor: "#E11D48" }} />
                        </linearGradient>
                    </defs>
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        strokeWidth={STROKE}
                        className="stroke-border-subtle dark:stroke-border-subtle-dark"
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
                                    strokeLinecap="round"
                                    stroke={`url(#${seg.gradientId})`}
                                    className="animate-donut-fill"
                                />
                            );
                        })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono-nums text-2xl font-bold leading-none text-fg dark:text-fg-dark">
                        {occupancyRate !== null ? `${occupancyRate}%` : "—"}
                    </span>
                    <span className="mt-1 text-[10px] font-medium text-fg-muted dark:text-fg-muted-dark">occupied</span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                        {total} active
                    </span>
                </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
                {total === 0 ? (
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">No active properties yet.</p>
                ) : (
                    segments.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-2 text-xs">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${seg.dotClass}`} aria-hidden />
                            <span className="min-w-0 flex-1 truncate text-fg-muted dark:text-fg-muted-dark">{seg.label}</span>
                            <span className="font-mono-nums font-semibold text-fg dark:text-fg-dark">{seg.value}</span>
                            <span className="w-8 text-right font-mono-nums text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                                {Math.round((seg.value / total) * 100)}%
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
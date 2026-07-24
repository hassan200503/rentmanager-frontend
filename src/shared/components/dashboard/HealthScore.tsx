"use client";

interface HealthScoreProps {
  score: number | null;
  breakdown?: {
    occupancy: number;
    collections: number;
    maintenance: number;
    revenue: number;
  };
}

function ProgressSegment({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg-muted dark:text-fg-muted-dark">{label}</span>
        <span className="text-xs font-semibold font-mono-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="progress-bar-sm">
        <div className="progress-bar-fill" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function HealthScore({ score, breakdown }: HealthScoreProps) {
  const s = score ?? 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (s / 100) * circumference;
  const empty = circumference - filled;

  const color = s >= 80 ? "var(--color-success)" : s >= 60 ? "var(--color-warning)" : "var(--color-danger)";
  const label = s >= 80 ? "Healthy" : s >= 60 ? "Fair" : "Needs attention";
  const bgClass = s >= 80 ? "bg-success-bg dark:bg-success-bg-dark" : s >= 60 ? "bg-warning-bg dark:bg-warning-bg-dark" : "bg-danger-bg dark:bg-danger-bg-dark";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden>
            <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--color-border-subtle)" strokeWidth="8" />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${empty}`}
              strokeDashoffset={circumference * 0.25}
              transform="rotate(-90 64 64)"
              style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono-nums text-2xl font-bold tracking-tight" style={{ color }}>
              {s}%
            </span>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${bgClass}`} style={{ color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </div>
      </div>

      {breakdown && (
        <div className="space-y-3 pt-2 border-t border-border dark:border-border-dark">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
            Breakdown
          </p>
          <ProgressSegment label="Occupancy" value={breakdown.occupancy} color="var(--color-brand)" />
          <ProgressSegment label="Collections" value={breakdown.collections} color="var(--color-success)" />
          <ProgressSegment label="Maintenance" value={breakdown.maintenance} color="var(--color-warning)" />
          <ProgressSegment label="Revenue" value={breakdown.revenue} color="var(--color-info)" />
        </div>
      )}
    </div>
  );
}
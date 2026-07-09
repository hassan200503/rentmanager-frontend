"use client";

interface MetricCardProps {
    label: string;
    value: number | string;
    tone?: "success" | "warning" | "danger" | "neutral";
    hint?: string;
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
    success: "text-primary",
    warning: "text-warning-dark",
    danger: "text-danger",
    neutral: "text-ink",
};

export default function MetricCard({ label, value, tone = "neutral", hint }: MetricCardProps) {
    return (
        <div className="card-sm animate-fade-in-up">
            <p className="text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wide">
                {label}
            </p>
            <p className={`font-data text-2xl font-semibold ${toneClasses[tone]}`}>
                {value}
            </p>
            {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
        </div>
    );
}

export function MetricCardSkeleton() {
    return (
        <div className="card-sm">
            <div className="skeleton h-3 w-20 mb-2" />
            <div className="skeleton h-7 w-14" />
        </div>
    );
}
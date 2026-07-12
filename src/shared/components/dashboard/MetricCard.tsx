// shared/components/dashboard/MetricCard.tsx
"use client";

import type { ElementType } from "react";

interface MetricCardProps {
    label: string;
    value: number | string;
    tone?: "success" | "warning" | "danger" | "neutral";
    hint?: string;
    icon?: ElementType;
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
    success: "text-primary",
    warning: "text-warning-dark",
    danger: "text-danger",
    neutral: "text-ink",
};

// Matches the existing pill-* light-bg/dark-text pairing so icon badges
// feel like the same design language, not a new accent system.
const iconToneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
    success: "bg-primary-light text-primary-dark",
    warning: "bg-brass-light text-warning-dark",
    danger: "bg-danger/10 text-danger-dark",
    neutral: "bg-ink/[0.05] text-ink-muted",
};

export default function MetricCard({
                                       label,
                                       value,
                                       tone = "neutral",
                                       hint,
                                       icon: Icon,
                                   }: MetricCardProps) {
    return (
        <div className="card-sm animate-fade-in-up">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wide">
                        {label}
                    </p>
                    <p className={`font-data text-2xl font-semibold ${toneClasses[tone]}`}>
                        {value}
                    </p>
                    {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
                </div>
                {Icon && (
                    <div className={`shrink-0 rounded-lg p-2 ${iconToneClasses[tone]}`}>
                        <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                )}
            </div>
        </div>
    );
}

export function MetricCardSkeleton() {
    return (
        <div className="card-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 w-full">
                    <div className="skeleton h-3 w-20 mb-2" />
                    <div className="skeleton h-7 w-14" />
                </div>
                <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
            </div>
        </div>
    );
}
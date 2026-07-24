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
    success: "text-brand dark:text-brand-300",
    warning: "text-warning-dark dark:text-warning",
    danger: "text-danger dark:text-danger",
    neutral: "text-fg dark:text-fg-dark",
};

const iconToneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
    success: "bg-brand-50 dark:bg-brand-800 text-brand-dark dark:text-brand-200",
    warning: "bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning",
    danger: "bg-danger-bg dark:bg-danger-bg-dark text-danger-dark dark:text-danger",
    neutral: "bg-border-subtle dark:bg-border-subtle-dark text-fg-muted dark:text-fg-muted-dark",
};

export default function MetricCard({
                                       label,
                                       value,
                                       tone = "neutral",
                                       hint,
                                       icon: Icon,
                                   }: MetricCardProps) {
    return (
        <div className="card animate-fade-in-up">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium text-fg-muted dark:text-fg-muted-dark mb-2 uppercase tracking-widest">
                        {label}
                    </p>
                    <p className={`font-mono-nums text-3xl font-semibold tracking-tight ${toneClasses[tone]}`}>
                        {value}
                    </p>
                    {hint && <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1.5">{hint}</p>}
                </div>
                {Icon && (
                    <div className={`shrink-0 rounded-xl p-2.5 ${iconToneClasses[tone]}`}>
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                )}
            </div>
        </div>
    );
}

export function MetricCardSkeleton() {
    return (
        <div className="card">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 w-full">
                    <div className="skeleton h-3 w-24 mb-2" />
                    <div className="skeleton h-8 w-20" />
                </div>
                <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
            </div>
        </div>
    );
}
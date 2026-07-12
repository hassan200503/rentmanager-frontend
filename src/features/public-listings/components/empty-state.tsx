"use client";

import { SearchX, LucideIcon } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    description?: string;
    // NEW: both optional and backward-compatible -- existing callers that
    // don't pass these get the exact same SearchX / neutral look as before.
    icon?: LucideIcon;
    tone?: "neutral" | "danger";
}

export function EmptyState({
                               title = "No results found",
                               description = "Try adjusting your search criteria.",
                               icon: Icon = SearchX,
                               tone = "neutral",
                           }: EmptyStateProps) {
    const circleClass = tone === "danger" ? "bg-danger/10" : "bg-ink/[0.05]";
    const iconClass = tone === "danger" ? "text-danger" : "text-ink-muted";

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${circleClass}`}>
                <Icon className={`w-6 h-6 ${iconClass}`} strokeWidth={1.75} />
            </div>
            <div>
                <h3 className="text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{description}</p>
            </div>
        </div>
    );
}
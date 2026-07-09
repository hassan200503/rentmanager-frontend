"use client";

import { SearchX } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    description?: string;
}

export function EmptyState({
                               title = "No results found",
                               description = "Try adjusting your search criteria.",
                           }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-ink/[0.05] flex items-center justify-center">
                <SearchX className="w-6 h-6 text-ink-muted" strokeWidth={1.75} />
            </div>
            <div>
                <h3 className="text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{description}</p>
            </div>
        </div>
    );
}
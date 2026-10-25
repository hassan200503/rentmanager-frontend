import { SearchX, LucideIcon } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    description?: string;
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
        <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${circleClass}`}>
                <Icon className={`w-7 h-7 ${iconClass}`} strokeWidth={1.5} />
            </div>
            <div className="max-w-xs">
                <h3 className="text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

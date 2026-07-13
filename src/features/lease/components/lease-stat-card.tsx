// src/features/lease/components/lease-stat-card.tsx
import { LucideIcon } from "lucide-react";

interface LeaseStatCardProps {
    label: string;
    value: string;
    caption?: string;
    icon: LucideIcon;
    tone?: "default" | "warning";
}

export function LeaseStatCard({ label, value, caption, icon: Icon, tone = "default" }: LeaseStatCardProps) {
    return (
        <div className="card-sm flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-medium text-ink-muted mb-1.5 truncate">{label}</p>
                <p className="text-xl font-semibold text-ink font-data truncate">{value}</p>
                {caption && <p className="text-[11px] text-ink-muted mt-0.5 truncate">{caption}</p>}
            </div>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                tone === "warning" ? "bg-warning/10" : "bg-primary-light"
            }`}>
                <Icon className={`h-4 w-4 ${tone === "warning" ? "text-warning-dark" : "text-primary-dark"}`} strokeWidth={2} />
            </div>
        </div>
    );
}
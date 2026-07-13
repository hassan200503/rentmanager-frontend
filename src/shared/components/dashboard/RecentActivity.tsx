"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import type { Property } from "@/features/property/types/property";

/**
 * There is no dedicated activity/audit-log endpoint yet (status changes,
 * payments, logins, etc). Until one exists, this panel is honestly scoped to
 * "recently added properties" — derived from a small dedicated fetch — rather
 * than pretending to be a full event feed. Swap the data source here once a
 * real activity endpoint ships.
 */
type PropertyWithTimestamps = Property & { createdAt?: string; updatedAt?: string };

function timeAgo(dateString?: string): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    const diffMonths = Math.round(diffDays / 30);
    return `${diffMonths}mo ago`;
}

export default function RecentActivity({ properties }: { properties: PropertyWithTimestamps[] }) {
    const sorted = [...properties].sort((a, b) => {
        const aDate = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
        const bDate = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
        return bDate - aDate;
    });

    if (sorted.length === 0) {
        return <p className="text-xs text-ink-muted">No recent activity yet.</p>;
    }

    return (
        <ul className="space-y-0.5">
            {sorted.slice(0, 5).map((p) => {
                const label = timeAgo(p.createdAt ?? p.updatedAt);
                return (
                    <li key={p.propertyId}>
                        <Link
                            href={`/dashboard/properties/${p.propertyId}`}
                            className="group flex items-center gap-2.5 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-ink/[0.03]"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light">
                                <Building2 className="h-3.5 w-3.5 text-primary-dark" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-ink group-hover:underline">
                                    {p.name}
                                </p>
                                <p className="text-[11px] text-ink-muted">Added to portfolio</p>
                            </div>
                            {label && <span className="shrink-0 text-[11px] text-ink-muted">{label}</span>}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
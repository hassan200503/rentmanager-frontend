"use client";

import Link from "next/link";
import { Building2, Home, FileText, Activity as ActivityIcon } from "lucide-react";
import type { Activity } from "@/features/activity/types/activity";

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

// entityType will grow beyond these three (spec §5) — anything not in this
// map falls back to a generic icon rather than throwing or rendering blank.
const ENTITY_ICON: Record<string, typeof Building2> = {
    Property: Building2,
    Unit: Home,
    Lease: FileText,
};

const ENTITY_HREF_PREFIX: Record<string, string> = {
    Property: "/dashboard/properties",
    Unit: "/dashboard/units",
    Lease: "/dashboard/leases",
};

// Maps the action half of an eventType (e.g. "CREATED" in "PROPERTY_CREATED")
// to a short verb, the same split-on-entity/action-boundary pattern used in
// the backend team's earlier prototype. Anything not in this map — including
// eventTypes that don't exist yet (spec §6) — falls back to a generic phrase
// instead of crashing or showing raw enum text.
const ACTION_VERB: Record<string, string> = {
    CREATED: "added",
    ACTIVATED: "activated",
    ARCHIVED: "archived",
    UPDATED: "updated",
    TERMINATED: "terminated",
    OCCUPANCY_CHANGED: "changed the occupancy of",
};

function describe(activity: Activity): string {
    const [, ...actionParts] = activity.eventType.split("_");
    const action = actionParts.join("_");
    const verb = ACTION_VERB[action];

    if (!verb) {
        return `${activity.actorName} — ${activity.entityName} was updated`;
    }

    return `${activity.actorName} ${verb} ${activity.entityName}`;
}

interface RecentActivityProps {
    activities: Activity[];
    isConnected?: boolean;
}

export default function RecentActivity({ activities, isConnected }: RecentActivityProps) {
    return (
        <div>
            {isConnected !== undefined && (
                <div className="flex items-center justify-end mb-2">
                    {isConnected ? (
                        <span className="pill-success !text-[10px] !px-2 !py-0.5 inline-flex items-center gap-1">
                            <span className="status-dot-live" />
                            Live
                        </span>
                    ) : (
                        <span className="pill-neutral !text-[10px] !px-2 !py-0.5">Reconnecting…</span>
                    )}
                </div>
            )}

            {activities.length === 0 ? (
                <p className="text-xs text-ink-muted">No recent activity yet.</p>
            ) : (
                <ul className="space-y-0.5">
                    {activities.slice(0, 5).map((activity) => {
                        const Icon = ENTITY_ICON[activity.entityType] ?? ActivityIcon;
                        const hrefPrefix = ENTITY_HREF_PREFIX[activity.entityType];
                        const label = timeAgo(activity.createdAt);

                        const row = (
                            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-ink/[0.03]">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light">
                                    <Icon className="h-3.5 w-3.5 text-primary-dark" strokeWidth={2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-ink group-hover:underline">
                                        {describe(activity)}
                                    </p>
                                </div>
                                {label && <span className="shrink-0 text-[11px] text-ink-muted">{label}</span>}
                            </div>
                        );

                        return (
                            <li key={activity.id}>
                                {hrefPrefix ? (
                                    <Link href={`${hrefPrefix}/${activity.entityId}`} className="group block">
                                        {row}
                                    </Link>
                                ) : (
                                    row
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
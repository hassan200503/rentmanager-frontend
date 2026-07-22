"use client";

import Link from "next/link";
import { Activity as ActivityIcon } from "lucide-react";
import type { Activity } from "@/features/activity/types/activity";
import { timeAgo, ENTITY_ICON, getActivityHref, describe } from "@/features/activity/utils/activity-display";

function ActivityRowSkeleton() {
    return (
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 -mx-2">
            <div className="skeleton h-7 w-7 rounded-md shrink-0" />
            <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-4/5 rounded" />
            </div>
            <div className="skeleton h-3 w-8 rounded shrink-0" />
        </div>
    );
}

interface RecentActivityProps {
    activities: Activity[];
    /**
     * True while SSE connection is open and receiving. Undefined means the
     * caller hasn't provided connectivity state (legacy usage) — no badge
     * is shown.
     */
    isConnected?: boolean;
    /**
     * True during the initial REST fetch before any data has landed.
     * While true we show skeletons rather than the empty-state copy or a
     * misleading "Reconnecting…" badge.
     */
    isLoading?: boolean;
}

export default function RecentActivity({ activities, isConnected, isLoading }: RecentActivityProps) {
    // During the initial data load, show skeleton rows and no connection badge.
    // "Reconnecting…" only makes sense AFTER a live connection has previously
    // been established and then dropped — not on first paint where SSE hasn't
    // been tried yet.
    if (isLoading) {
        return (
            <div>
                <ul className="space-y-0.5" aria-label="Loading recent activity">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li key={i}>
                            <ActivityRowSkeleton />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // Connection status badge:
    // - "Live" (green): SSE stream is open.
    // - "Reconnecting…" (neutral): had a live connection, now dropped, retrying.
    //   We derive this from isConnected=false AND activities.length > 0, meaning
    //   data was already loaded — so SSE must have connected at some point and
    //   then dropped rather than never having connected at all.
    // - No badge: isConnected is undefined (caller opted out) or initial state.
    const showLive = isConnected === true;
    const showReconnecting = isConnected === false && activities.length > 0;

    return (
        <div>
            {(showLive || showReconnecting) && (
                <div className="flex items-center justify-end mb-2">
                    {showLive ? (
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
                        const href = getActivityHref(activity);
                        const label = timeAgo(activity.createdAt);

                        const row = (
                            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-ink/[0.05] cursor-pointer">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light">
                                    <Icon className="h-3.5 w-3.5 text-primary-dark" strokeWidth={2} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-ink">
                                        {describe(activity)}
                                    </p>
                                </div>
                                {label && <span className="shrink-0 text-[11px] text-ink-muted">{label}</span>}
                            </div>
                        );

                        return (
                            <li key={activity.id}>
                                {href ? (
                                    <Link href={href} className="block">
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

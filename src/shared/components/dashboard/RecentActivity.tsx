"use client";

import Link from "next/link";
import { Activity as ActivityIcon } from "lucide-react";
import type { Activity } from "@/features/activity/types/activity";
import { timeAgo, getActivityHref, describe } from "@/features/activity/utils/activity-display";

function ActivityRowSkeleton() {
    return (
        <div className="flex items-center gap-3 px-2 py-2.5 -mx-2">
            <div className="skeleton h-2 w-2 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-4/5 rounded" />
            </div>
            <div className="skeleton h-3 w-8 rounded shrink-0" />
        </div>
    );
}

interface RecentActivityProps {
    activities: Activity[];
    isConnected?: boolean;
    isLoading?: boolean;
}

export default function RecentActivity({ activities, isConnected, isLoading }: RecentActivityProps) {
    if (isLoading) {
        return (
            <div>
                <ul className="space-y-2" aria-label="Loading recent activity">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <li key={i}><ActivityRowSkeleton /></li>
                    ))}
                </ul>
            </div>
        );
    }

    const showLive = isConnected === true;
    const showReconnecting = isConnected === false && activities.length > 0;

    return (
        <div>
            {(showLive || showReconnecting) && (
                <div className="flex items-center justify-end mb-2">
                    {showLive ? (
                        <span className="pill-success !text-[10px] !px-2 !py-0.5 inline-flex items-center gap-1">
                            <span className="status-dot-success status-dot-live" />
                            Live
                        </span>
                    ) : (
                        <span className="pill-neutral !text-[10px] !px-2 !py-0.5">Reconnecting…</span>
                    )}
                </div>
            )}

            {activities.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                        <ActivityIcon className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                    </div>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">No recent activity yet.</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border dark:bg-border-dark" aria-hidden />
                    <ul className="space-y-1">
                        {activities.slice(0, 6).map((activity) => {
                            const href = getActivityHref(activity);
                            const label = timeAgo(activity.createdAt);

                            const row = (
                                <div className="relative flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 cursor-pointer">
                                    <span className="relative z-10 mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                                        <span className="h-2 w-2 rounded-full bg-brand dark:bg-brand-300" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-fg dark:text-fg-dark">
                                            {describe(activity)}
                                        </p>
                                    </div>
                                    {label && <span className="shrink-0 text-[11px] text-fg-muted dark:text-fg-muted-dark pt-0.5">{label}</span>}
                                </div>
                            );

                            return (
                                <li key={activity.id}>
                                    {href ? <Link href={href} className="block">{row}</Link> : row}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
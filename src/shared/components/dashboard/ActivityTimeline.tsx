"use client";

import Link from "next/link";
import { Activity as ActivityIcon, ArrowRight } from "lucide-react";
import type { Activity } from "@/features/activity/types/activity";
import { timeAgo, getActivityHref, describe, ENTITY_ICON } from "@/features/activity/utils/activity-display";

function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="skeleton h-2 w-2 rounded-full mt-1.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-2.5 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ActivityTimelineProps {
  activities: Activity[];
  isConnected?: boolean;
  isLoading?: boolean;
}

function groupActivities(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const activity of activities) {
    const date = new Date(activity.createdAt);
    let key: string;
    if (date.toDateString() === today) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) key = "Earlier this week";
      else key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
  }
  return groups;
}

const ACTIVITY_COLORS: Record<string, string> = {
  CREATED: "var(--color-success)",
  ACTIVATED: "var(--color-brand)",
  UPDATED: "var(--color-info)",
  ARCHIVED: "var(--color-fg-muted)",
  TERMINATED: "var(--color-danger)",
  OCCUPANCY_CHANGED: "var(--color-warning)",
  REQUEST_SUBMITTED: "var(--color-warning)",
};

function getActivityColor(eventType: string): string {
  const [, ...parts] = eventType.split("_");
  const action = parts.join("_");
  return ACTIVITY_COLORS[action] ?? "var(--color-brand)";
}

export default function ActivityTimeline({ activities, isConnected, isLoading }: ActivityTimelineProps) {
  if (isLoading) return <TimelineSkeleton />;

  const grouped = groupActivities(activities.slice(0, 15));
  const groupKeys = Object.keys(grouped);

  if (groupKeys.length === 0) {
    return (
      <div className="empty-state !py-8">
        <div className="empty-state-icon !w-10 !h-10">
          <ActivityIcon className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No recent activity</p>
        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Activity from your portfolio will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isConnected && (
        <div className="flex items-center justify-end">
          <span className="pill-success !text-[10px] !px-2 !py-0.5 inline-flex items-center gap-1">
            <span className="status-dot-success status-dot-live" />
            Live
          </span>
        </div>
      )}

      {groupKeys.map((group) => (
        <div key={group}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark mb-2.5">
            {group}
          </p>
          <div className="relative">
            <div className="timeline-line" aria-hidden />
            <div className="space-y-0.5 relative">
              {grouped[group].map((activity) => {
                const href = getActivityHref(activity);
                const color = getActivityColor(activity.eventType);
                const label = timeAgo(activity.createdAt);
                const EntityIcon = ENTITY_ICON[activity.entityType] || ActivityIcon;

                const row = (
                  <div className="relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 group/row cursor-pointer">
                    <span className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center">
                      <span
                        className="h-2 w-2 rounded-full ring-2 ring-surface dark:ring-surface-dark"
                        style={{ backgroundColor: color }}
                      />
                    </span>
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <EntityIcon className="h-3 w-3" strokeWidth={2} style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fg dark:text-fg-dark">
                        {describe(activity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-fg-muted dark:text-fg-muted-dark">{label}</span>
                    </div>
                  </div>
                );

                return (
                  <div key={activity.id}>
                    {href ? <Link href={href}>{row}</Link> : row}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {activities.length > 6 && (
        <div className="text-center pt-1">
          <Link
            href="/dashboard/activity"
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: "var(--color-brand)" }}
          >
            View all activity <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}
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

  const visible = activities.slice(0, 5);
  const hiddenCount = activities.length - visible.length;

  const grouped = groupActivities(visible);
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
    <div className="space-y-4">
      {isConnected && (
        <div className="flex items-center justify-end">
          <span className="pill-success !text-[10px] !px-2 !py-0.5 inline-flex items-center gap-1">
            <span className="status-dot-success status-dot-live" />
            Live
          </span>
        </div>
      )}

      <div className="relative">
        <div className="space-y-4">
          {groupKeys.map((group) => (
            <div key={group}>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border dark:via-border-dark dark:to-border-dark" />
                <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle dark:text-fg-subtle-dark">
                  {group}
                </p>
                <span className="shrink-0 rounded-full border border-border/70 bg-surface/70 px-1.5 py-px text-[9px] font-bold tabular-nums text-fg-subtle dark:border-border-dark/70 dark:bg-surface-dark/70 dark:text-fg-subtle-dark">
                  {grouped[group].length}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent dark:from-border-dark" />
              </div>
              <div className="relative">
                <div className="timeline-line" aria-hidden />
                <div className="space-y-0.5 relative">
                  {grouped[group].map((activity) => {
                    const href = getActivityHref(activity);
                    const color = getActivityColor(activity.eventType);
                    const label = timeAgo(activity.createdAt);
                    const EntityIcon = ENTITY_ICON[activity.entityType] || ActivityIcon;

                    const row = (
                      <div className="relative flex items-start gap-3 rounded-xl border border-transparent px-3 py-2 transition-all duration-150 hover:border-brand/10 hover:bg-brand-50/60 hover:shadow-sm dark:hover:bg-brand-900/12 group/row cursor-pointer">
                        <span className="relative z-10 mt-1.5 flex h-3 w-3 shrink-0 items-center justify-center">
                          <span
                            className="h-2 w-2 rounded-full ring-2 ring-surface dark:ring-surface-dark group-hover/row:scale-125 transition-transform"
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
                          <ArrowRight className="h-3 w-3 text-fg-subtle opacity-0 transition-all group-hover/row:translate-x-0.5 group-hover/row:opacity-100 dark:text-fg-subtle-dark" strokeWidth={2} />
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
        </div>

        {hiddenCount > 0 && (
          <div
            className="pointer-events-none absolute -inset-x-1 bottom-0 z-10 h-9 rounded-xl bg-gradient-to-t from-surface to-transparent dark:from-surface-dark"
            aria-hidden
          />
        )}
      </div>

      {activities.length > 0 && (
        <Link
          href="/dashboard/activity"
          className="group/see-all flex w-full items-center justify-between rounded-xl border border-border/60 bg-surface/60 px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-px hover:border-brand/25 hover:bg-brand-50/50 hover:shadow-card dark:border-border-dark/60 dark:bg-surface-dark/60 dark:hover:border-brand-700/40 dark:hover:bg-brand-900/10"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-fg dark:text-fg-dark">
            View all activity
            <ArrowRight className="h-3.5 w-3.5 text-brand dark:text-brand-300 transition-transform group-hover/see-all:translate-x-0.5" strokeWidth={2} />
          </span>
          {hiddenCount > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-brand-700 shadow-sm ring-1 ring-brand/10 dark:bg-brand-900/40 dark:text-brand-300 dark:ring-brand-300/15">
              {hiddenCount}+ more
            </span>
          )}
        </Link>
      )}
    </div>
  );
}

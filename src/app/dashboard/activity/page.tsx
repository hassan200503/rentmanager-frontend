"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    Activity as ActivityIcon,
    Building2,
    ChevronRight,
    FileText,
    History,
    Home,
    RotateCw,
    Search,
    Settings2,
    Wrench,
} from "lucide-react";
import type { Activity } from "@/features/activity/types/activity";
import { activityApi, type ActivityFilters } from "@/features/activity/api/activity-api";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import {
    describe,
    getActionKey,
    getActivityHref,
    timeAgo,
} from "@/features/activity/utils/activity-display";

const PAGE_SIZE = 20;

// ── Filter config ─────────────────────────────────────────────────────────────

const ENTITY_CHIPS: { label: string; value: string; Icon?: typeof Building2 }[] = [
    { label: "All", value: "" },
    { label: "Properties", value: "Property", Icon: Building2 },
    { label: "Units", value: "Unit", Icon: Home },
    { label: "Leases", value: "Lease", Icon: FileText },
    { label: "Maintenance", value: "MaintenanceRequest", Icon: Wrench },
];

const EVENT_GROUPS = [
    {
        label: "Property",
        options: [
            { label: "Property Created", value: "PROPERTY_CREATED" },
            { label: "Property Activated", value: "PROPERTY_ACTIVATED" },
            { label: "Property Archived", value: "PROPERTY_ARCHIVED" },
            { label: "Property Updated", value: "PROPERTY_UPDATED" },
            { label: "Property Occupancy Changed", value: "PROPERTY_OCCUPANCY_CHANGED" },
        ],
    },
    {
        label: "Unit",
        options: [
            { label: "Unit Added", value: "UNIT_CREATED" },
            { label: "Unit Activated", value: "UNIT_ACTIVATED" },
            { label: "Unit Archived", value: "UNIT_ARCHIVED" },
            { label: "Unit Updated", value: "UNIT_UPDATED" },
            { label: "Unit Occupancy Changed", value: "UNIT_OCCUPANCY_CHANGED" },
        ],
    },
    {
        label: "Lease",
        options: [
            { label: "Lease Created", value: "LEASE_CREATED" },
            { label: "Lease Terminated", value: "LEASE_TERMINATED" },
        ],
    },
    {
        label: "Maintenance",
        options: [
            { label: "Maintenance Submitted", value: "MAINTENANCE_REQUEST_SUBMITTED" },
        ],
    },
];

// ── Action-type visual helpers ────────────────────────────────────────────────

function actionBg(eventType: string): string {
    switch (getActionKey(eventType)) {
        case "CREATED":
        case "ACTIVATED":    return "bg-success/10 dark:bg-success/[0.15]";
        case "ARCHIVED":
        case "TERMINATED":   return "bg-danger/10 dark:bg-danger/[0.15]";
        case "OCCUPANCY_CHANGED":
        case "REQUEST_SUBMITTED": return "bg-warning/10 dark:bg-warning/[0.15]";
        case "UPDATED":      return "bg-brand/10 dark:bg-brand/[0.15]";
        default:             return "bg-border-subtle dark:bg-border-subtle-dark";
    }
}

function actionIconColor(eventType: string): string {
    switch (getActionKey(eventType)) {
        case "CREATED":
        case "ACTIVATED":    return "text-success-dark dark:text-success";
        case "ARCHIVED":
        case "TERMINATED":   return "text-danger dark:text-danger";
        case "OCCUPANCY_CHANGED":
        case "REQUEST_SUBMITTED": return "text-warning-dark dark:text-warning";
        case "UPDATED":      return "text-brand dark:text-brand-300";
        default:             return "text-fg-muted dark:text-fg-muted-dark";
    }
}

const ENTITY_ICON_MAP: Record<string, typeof Building2> = {
    Property: Building2,
    Unit: Home,
    Lease: FileText,
    MaintenanceRequest: Wrench,
};

const ENTITY_LABEL: Record<string, string> = {
    Property: "Property",
    Unit: "Unit",
    Lease: "Lease",
    MaintenanceRequest: "Maintenance",
};

const ENTITY_CHIP_CLASS: Record<string, string> = {
    Property: "pill-info",
    Unit: "pill-success",
    Lease: "pill-warning",
    MaintenanceRequest: "pill-danger",
};

// ── Date grouping ─────────────────────────────────────────────────────────────

function groupByDate(activities: Activity[]): { key: string; items: Activity[] }[] {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    const map = new Map<string, Activity[]>();
    const order: string[] = [];

    for (const a of activities) {
        const d = new Date(a.createdAt);
        let key: string;
        if (d.toDateString() === today) key = "Today";
        else if (d.toDateString() === yesterday.toDateString()) key = "Yesterday";
        else if (d >= weekAgo) key = "Earlier this week";
        else if (d >= monthAgo) key = "This month";
        else key = d.toLocaleDateString("en-KE", { month: "long", year: "numeric" });

        if (!map.has(key)) { map.set(key, []); order.push(key); }
        map.get(key)!.push(a);
    }

    return order.map((key) => ({ key, items: map.get(key)! }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActivitySkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="skeleton h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-3/5 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
            </div>
            <div className="skeleton h-3 w-12 rounded shrink-0" />
        </div>
    );
}

function ActorBadge({ activity }: { activity: Activity }) {
    if (!activity.actorId) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                <Settings2 className="h-3 w-3" strokeWidth={1.5} />
                System
            </span>
        );
    }
    const name = activity.actorName ?? "";
    const initial = (name[0] ?? "?").toUpperCase();
    const label = name.includes("@") ? name.split("@")[0] : (name || "User");
    return (
        <span className="inline-flex items-center gap-1 text-[10px] text-fg-muted dark:text-fg-muted-dark">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/60 text-[9px] font-bold text-brand dark:text-brand-300">
                {initial}
            </span>
            {label}
        </span>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
    const { user, isLoading: isUserLoading } = useCurrentUser();
    const [entityType, setEntityType] = useState("");
    const [eventType, setEventType] = useState("");
    const [search, setSearch] = useState("");

    const filters = useMemo<ActivityFilters>(() => {
        const f: ActivityFilters = {};
        if (entityType) f.entityType = entityType;
        if (eventType) f.eventType = eventType;
        return f;
    }, [entityType, eventType]);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["activities", "all", user?.tenantId, entityType, eventType],
        queryFn: async ({ pageParam = 0 }) => {
            if (!user?.tenantId) throw new Error("No tenant");
            return activityApi.getAll(pageParam as number, PAGE_SIZE, filters, user.tenantId);
        },
        getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
        initialPageParam: 0,
        enabled: Boolean(user?.tenantId),
    });

    const totalElements = data?.pages[0]?.totalElements;
    const allActivities = data?.pages.flatMap((p) => p.content) ?? [];

    const activities = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return allActivities;
        return allActivities.filter(
            (a) =>
                a.entityName.toLowerCase().includes(term) ||
                describe(a).toLowerCase().includes(term)
        );
    }, [allActivities, search]);

    const groups = useMemo(() => groupByDate(activities), [activities]);
    const activeFilters = (entityType ? 1 : 0) + (eventType ? 1 : 0) + (search ? 1 : 0);

    const clearAll = () => { setEntityType(""); setEventType(""); setSearch(""); };

    // ── User loading skeleton ─────────────────────────────────────────────────
    if (isUserLoading) {
        return (
            <div className="page-container space-y-6">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
                <div className="card divide-y divide-border dark:divide-border-dark">
                    {Array.from({ length: 8 }).map((_, i) => <ActivitySkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container space-y-5">

            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                        <History className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="page-title mb-1">Activity Log</h1>
                        <p className="page-subtitle mb-0">
                            {totalElements != null
                                ? `${totalElements.toLocaleString()} event${totalElements !== 1 ? "s" : ""} recorded`
                                : "Complete audit trail of all changes"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="animate-fade-in-up space-y-2.5">
                {/* Entity type pills */}
                <div className="flex flex-wrap gap-2">
                    {ENTITY_CHIPS.map(({ label, value, Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => { setEntityType(value); setEventType(""); }}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                entityType === value
                                    ? "border-brand bg-brand text-white shadow-sm"
                                    : "border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:border-brand/50 hover:text-fg dark:hover:text-fg-dark"
                            }`}
                        >
                            {Icon && <Icon className="h-3 w-3" strokeWidth={2} />}
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search + event type row */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[160px] flex-1 max-w-xs">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle dark:text-fg-subtle-dark"
                            strokeWidth={2}
                            aria-hidden
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name…"
                            aria-label="Filter by entity name"
                            className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 pl-9 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                    </div>

                    <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        aria-label="Filter by event type"
                        className="rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm text-fg dark:text-fg-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                        <option value="">All events</option>
                        {EVENT_GROUPS.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                                {group.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>

                    {activeFilters > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-xs text-danger hover:underline whitespace-nowrap"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="animate-fade-in-up">
                {isLoading ? (
                    <div className="card divide-y divide-border dark:divide-border-dark">
                        {Array.from({ length: 10 }).map((_, i) => <ActivitySkeleton key={i} />)}
                    </div>
                ) : isError ? (
                    <div className="card-sm py-10 text-center">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 dark:bg-danger/[0.15]">
                            <ActivityIcon className="h-5 w-5 text-danger" strokeWidth={1.5} />
                        </div>
                        <p className="mb-1 text-sm font-medium text-fg dark:text-fg-dark">Failed to load activity log</p>
                        <p className="mb-4 text-xs text-fg-muted dark:text-fg-muted-dark">
                            {(error as Error)?.message || "An unexpected error occurred."}
                        </p>
                        <button
                            onClick={() => void refetch()}
                            className="btn-secondary inline-flex items-center gap-1.5"
                        >
                            <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
                            Try again
                        </button>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="card-sm py-14 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                            <ActivityIcon className="h-6 w-6 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.5} />
                        </div>
                        <p className="mb-1 text-sm font-medium text-fg dark:text-fg-dark">No activity found</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                            {activeFilters > 0
                                ? "No results match your filters."
                                : "Activity will appear here as you manage your portfolio."}
                        </p>
                        {activeFilters > 0 && (
                            <button type="button" onClick={clearAll} className="btn-secondary !text-xs">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="space-y-5">
                            {groups.map(({ key, items }) => (
                                <div key={key}>
                                    {/* Date group header */}
                                    <div className="mb-2 flex items-center gap-3">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border dark:via-border-dark dark:to-border-dark" />
                                        <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                                            {key}
                                        </p>
                                        <span className="shrink-0 rounded-full border border-border/70 bg-surface/70 px-1.5 py-px text-[9px] font-bold tabular-nums text-fg-subtle dark:border-border-dark/70 dark:bg-surface-dark/70 dark:text-fg-subtle-dark">
                                            {items.length}
                                        </span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent dark:from-border-dark" />
                                    </div>

                                    {/* Activity rows */}
                                    <div className="card overflow-hidden divide-y divide-border dark:divide-border-dark">
                                        {items.map((activity) => {
                                            const EntityIcon = ENTITY_ICON_MAP[activity.entityType] ?? ActivityIcon;
                                            const href = getActivityHref(activity);
                                            const label = timeAgo(activity.createdAt);

                                            const row = (
                                                <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/40 group/item cursor-pointer">
                                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-shadow group-hover/item:shadow-sm ${actionBg(activity.eventType)}`}>
                                                        <EntityIcon
                                                            className={`h-4 w-4 ${actionIconColor(activity.eventType)}`}
                                                            strokeWidth={2}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-fg dark:text-fg-dark">
                                                            {describe(activity, user?.userId)}
                                                        </p>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                            <ActorBadge activity={activity} />
                                                            <span className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark select-none">·</span>
                                                            <span className={`${ENTITY_CHIP_CLASS[activity.entityType] ?? "pill-neutral"} !text-[10px] !px-1.5 !py-0`}>
                                                                {ENTITY_LABEL[activity.entityType] ?? activity.entityType}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {label && (
                                                            <time
                                                                dateTime={activity.createdAt}
                                                                title={new Date(activity.createdAt).toLocaleString("en-KE")}
                                                                className="text-xs text-fg-muted dark:text-fg-muted-dark whitespace-nowrap tabular-nums"
                                                            >
                                                                {label}
                                                            </time>
                                                        )}
                                                        {href && (
                                                            <ChevronRight
                                                                className="h-4 w-4 text-fg-muted/30 dark:text-fg-muted-dark/30 transition-colors group-hover/item:text-fg dark:group-hover/item:text-fg-dark"
                                                                strokeWidth={2}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <div key={activity.id}>
                                                    {href ? <Link href={href} className="block">{row}</Link> : row}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="flex justify-center pt-5 pb-1">
                                <button
                                    onClick={() => void fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5"
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading…
                                        </>
                                    ) : (
                                        "Load more"
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasNextPage && activities.length > 0 && (
                            <p className="pt-4 pb-1 text-center text-xs text-fg-muted dark:text-fg-muted-dark">
                                {activeFilters > 0 && totalElements != null && activities.length < totalElements
                                    ? `Showing ${activities.length.toLocaleString()} matching events`
                                    : `All ${activities.length.toLocaleString()} events shown`}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

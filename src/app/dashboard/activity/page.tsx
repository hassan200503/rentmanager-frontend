"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Activity as ActivityIcon, History, Filter, X, ChevronRight, RotateCw } from "lucide-react";
import { activityApi, type ActivityFilters } from "@/features/activity/api/activity-api";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { timeAgo, ENTITY_ICON, getActivityHref, describe } from "@/features/activity/utils/activity-display";

const PAGE_SIZE = 20;

const ENTITY_TYPE_OPTIONS = ["", "Property", "Unit", "Lease"] as const;
const EVENT_TYPE_OPTIONS = ["", "PROPERTY_CREATED", "PROPERTY_UPDATED", "PROPERTY_ACTIVATED", "PROPERTY_ARCHIVED", "PROPERTY_OCCUPANCY_CHANGED", "UNIT_CREATED", "UNIT_UPDATED", "UNIT_ACTIVATED", "UNIT_ARCHIVED", "UNIT_OCCUPANCY_CHANGED", "LEASE_CREATED", "LEASE_TERMINATED"] as const;

function getEventTypeLabel(eventType: string): string {
    return eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function entityBadgeClass(entityType: string): string {
    switch (entityType) {
        case "Property": return "bg-blue-50 text-blue-700 border-blue-200";
        case "Unit": return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Lease": return "bg-amber-50 text-amber-700 border-amber-200";
        default: return "bg-ink/[0.05] text-ink-muted border-ink/[0.1]";
    }
}

function ActivitySkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="skeleton h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-3/5 rounded" />
                <div className="skeleton h-3 w-1/4 rounded" />
            </div>
            <div className="skeleton h-3 w-12 rounded shrink-0" />
        </div>
    );
}

export default function ActivityPage() {
    const { user, isLoading: isUserLoading } = useCurrentUser();
    const [entityType, setEntityType] = useState("");
    const [eventType, setEventType] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const filters: ActivityFilters = {};
    if (entityType) filters.entityType = entityType;
    if (eventType) filters.eventType = eventType;

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["activities", "all", user?.tenantId, entityType, eventType],
        queryFn: async ({ pageParam = 0 }) => {
            if (!user?.tenantId) throw new Error("No tenant");
            return activityApi.getAll(pageParam, PAGE_SIZE, filters, user.tenantId);
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.last) return undefined;
            return lastPage.number + 1;
        },
        initialPageParam: 0,
        enabled: Boolean(user?.tenantId),
    });

    const activities = data?.pages.flatMap((page) => page.content) ?? [];

    if (isUserLoading) {
        return (
            <div className="page-container space-y-6">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="rounded-lg border border-ink/[0.08] divide-y divide-ink/[0.06]">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ActivitySkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-container space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                        <History className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="page-title mb-1">Activity Log</h1>
                        <p className="page-subtitle mb-0">Complete audit trail of all changes</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-secondary inline-flex items-center gap-1.5"
                >
                    <Filter className="h-4 w-4" strokeWidth={2} />
                    Filters
                    {(entityType || eventType) && (
                        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                            {(entityType ? 1 : 0) + (eventType ? 1 : 0)}
                        </span>
                    )}
                </button>
            </div>

            {showFilters && (
                <div className="card-sm animate-fade-in-up space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-ink-muted">Filter by</span>
                        {(entityType || eventType) && (
                            <button
                                onClick={() => { setEntityType(""); setEventType(""); }}
                                className="inline-flex items-center gap-1 text-xs text-danger hover:underline"
                            >
                                <X className="h-3 w-3" strokeWidth={2} />
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-ink-muted">Entity Type</label>
                            <select
                                value={entityType}
                                onChange={(e) => setEntityType(e.target.value)}
                                className="select-sm"
                            >
                                <option value="">All entities</option>
                                {ENTITY_TYPE_OPTIONS.filter(Boolean).map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-ink-muted">Event Type</label>
                            <select
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="select-sm"
                            >
                                <option value="">All events</option>
                                {EVENT_TYPE_OPTIONS.filter(Boolean).map((opt) => (
                                    <option key={opt} value={opt}>{getEventTypeLabel(opt)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="animate-fade-in-up">
                {isLoading ? (
                    <div className="rounded-lg border border-ink/[0.08] divide-y divide-ink/[0.06]">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <ActivitySkeleton key={i} />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="card-sm text-center py-10">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                            <ActivityIcon className="h-5 w-5 text-danger" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium text-ink mb-1">Failed to load activity log</p>
                        <p className="text-xs text-ink-muted mb-4">{(error as Error)?.message || "An unexpected error occurred."}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-outline inline-flex items-center gap-1.5"
                        >
                            <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
                            Try again
                        </button>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="card-sm text-center py-14">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink/[0.04]">
                            <ActivityIcon className="h-6 w-6 text-ink-muted/40" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-medium text-ink mb-1">No activity found</p>
                        {entityType || eventType ? (
                            <p className="text-xs text-ink-muted">No results match your filters. Try adjusting or clearing them.</p>
                        ) : (
                            <p className="text-xs text-ink-muted">Activity will appear here as you manage your properties, units, and leases.</p>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg border border-ink/[0.08] bg-surface overflow-hidden">
                            <div className="divide-y divide-ink/[0.06]">
                                {activities.map((activity) => {
                                    const Icon = ENTITY_ICON[activity.entityType] ?? ActivityIcon;
                                    const href = getActivityHref(activity);
                                    const label = timeAgo(activity.createdAt);

                                    const row = (
                                        <div className="flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-ink/[0.02] cursor-pointer group/item">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light group-hover/item:shadow-sm transition-shadow">
                                                <Icon className="h-4.5 w-4.5 text-primary-dark" strokeWidth={2} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="truncate text-sm font-medium text-ink">
                                                        {describe(activity)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${entityBadgeClass(activity.entityType)}`}>
                                                        {activity.entityType === "Property" ? "Property" : activity.entityType === "Unit" ? "Unit" : "Lease"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2.5">
                                                {label && (
                                                    <time
                                                        dateTime={activity.createdAt}
                                                        className="text-xs text-ink-muted/70"
                                                        title={new Date(activity.createdAt).toLocaleString()}
                                                    >
                                                        {label}
                                                    </time>
                                                )}
                                                {href && (
                                                    <ChevronRight className="h-4 w-4 text-ink-muted/30 group-hover/item:text-primary transition-colors" strokeWidth={2} />
                                                )}
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <div key={activity.id}>
                                            {href ? (
                                                <Link href={href} className="block">{row}</Link>
                                            ) : (
                                                row
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {hasNextPage && (
                            <div className="flex justify-center pt-6 pb-2">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5"
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Load more
                                            <ChevronRight className="h-4 w-4" strokeWidth={2} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasNextPage && activities.length > 0 && (
                            <p className="pt-4 pb-1 text-center text-xs text-ink-muted/60">
                                Showing all {activities.length} entries
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

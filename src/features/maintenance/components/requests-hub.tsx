// features/maintenance/components/requests-hub.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Wrench,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Loader2,
    ListFilter,
    ArrowUpDown,
} from "lucide-react";
import {
    useMaintenanceRequestsQuery,
    useMaintenanceSlaQuery,
    useMarkAllRequestsViewedMutation,
    useUpdateMaintenanceStatusMutation,
} from "../hooks/use-maintenance-query";
import {
    MaintenanceListParams,
    MaintenancePriority,
    MaintenanceStatus,
} from "../types/maintenance-response";
import {
    PRIORITY_LABEL,
    STATUS_LABEL,
    avgResponseHoursLabel,
    priorityBadgeClass,
    statusBadgeClass,
} from "../lib/request-utils";
import { ReviewsCard } from "@/features/reviews/components/reviews-card";

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

const ALL_STATUSES: MaintenanceStatus[] = [
    "SUBMITTED",
    "IN_REVIEW",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
];

const STATUS_ORDER: MaintenanceStatus[] = [
    "SUBMITTED",
    "IN_REVIEW",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
];

function SlaKpiCard({
    icon: Icon,
    label,
    value,
    hint,
    accent,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    value: string;
    hint?: string;
    accent: "brand" | "warning" | "success";
}) {
    const accentClass =
        accent === "brand"
            ? "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300"
            : accent === "warning"
              ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentClass}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                    <p className="kpi-label">{label}</p>
                    <p className="kpi-value font-data text-fg dark:text-fg-dark">{value}</p>
                    {hint && (
                        <p className="truncate text-[11px] text-fg-subtle dark:text-fg-subtle-dark">{hint}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function RequestsHub() {
    const [statusFilter, setStatusFilter] = useState<"" | MaintenanceStatus>("");
    const [priorityFilter, setPriorityFilter] = useState<"" | MaintenancePriority>("");
    const [sort, setSort] = useState<NonNullable<MaintenanceListParams["sort"]>>("createdAt");
    const [direction, setDirection] = useState<"ASC" | "DESC">("DESC");

    const params = useMemo<MaintenanceListParams | undefined>(() => {
        const p: MaintenanceListParams = { sort, direction };
        if (statusFilter) p.status = statusFilter;
        if (priorityFilter) p.priority = priorityFilter;
        return p;
    }, [statusFilter, priorityFilter, sort, direction]);

    const { data: requests, isLoading, isError, refetch } = useMaintenanceRequestsQuery(params);
    const { data: sla } = useMaintenanceSlaQuery();
    const updateStatus = useUpdateMaintenanceStatusMutation();
    const markAllViewed = useMarkAllRequestsViewedMutation();

    // V54: being on this page means the landlord has seen the requests -
    // clear the sidebar badge. Re-fires if a new request arrives while the
    // page is open (SSE-triggered refetch), so the badge only ever counts
    // requests the landlord hasn't actually laid eyes on.
    const unviewedCount = useMemo(
        () => (requests ?? []).filter((r) => r.landlordViewedAt == null).length,
        [requests],
    );

    useEffect(() => {
        if (unviewedCount === 0) return;
        markAllViewed.mutate();
    }, [unviewedCount, markAllViewed]);

    const openCount = requests?.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status)).length ?? 0;

    const responseRateValue =
        sla?.resolvedRequirementMet && sla.responseRatePct != null
            ? `${sla.responseRatePct}%`
            : sla && sla.resolvedRequests > 0
              ? `Rate hidden (need ${5 - sla.resolvedRequests} more resolved)`
              : "—";

    return (
        <div className="page-container space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Requests</h1>
                <p className="page-subtitle">
                    Maintenance requests from your renters, response-time SLA, and reviews.
                </p>
            </div>

            {/* ── SLA row ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SlaKpiCard
                    icon={Wrench}
                    label="Total Requests"
                    value={sla ? String(sla.totalRequests) : "—"}
                    hint={`${openCount} open`}
                    accent="brand"
                />
                <SlaKpiCard
                    icon={CheckCircle2}
                    label="Resolved"
                    value={sla ? String(sla.resolvedRequests) : "—"}
                    hint={sla && !sla.resolvedRequirementMet ? "Minimum 5 for SLA rating" : "SLA rating unlocked"}
                    accent="success"
                />
                <SlaKpiCard
                    icon={Clock}
                    label="Avg Response"
                    value={sla ? avgResponseHoursLabel(sla.resolvedRequirementMet ? sla.avgResponseHours : null) : "—"}
                    hint="Excellent ≤ 24 hrs"
                    accent="brand"
                />
                <SlaKpiCard
                    icon={AlertTriangle}
                    label="Response Rate"
                    value={responseRateValue}
                    hint="Within 24 hours"
                    accent="warning"
                />
            </div>

            {/* ── Filters ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
                <div className="flex items-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                    <ListFilter className="h-4 w-4" strokeWidth={2} />
                    <span className="font-medium">Filter</span>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "" | MaintenanceStatus)}
                    className="form-input !w-auto py-2"
                >
                    <option value="">All statuses</option>
                    {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                </select>
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as "" | MaintenancePriority)}
                    className="form-input !w-auto py-2"
                >
                    <option value="">All priorities</option>
                    {(Object.keys(PRIORITY_LABEL) as MaintenancePriority[]).map((p) => (
                        <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark ml-auto">
                    <ArrowUpDown className="h-4 w-4" strokeWidth={2} />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as NonNullable<MaintenanceListParams["sort"]>)}
                        className="form-input !w-auto py-2"
                    >
                        <option value="createdAt">Submitted date</option>
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                        <option value="title">Title</option>
                        <option value="updatedAt">Last updated</option>
                    </select>
                    <select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value as "ASC" | "DESC")}
                        className="form-input !w-auto py-2"
                    >
                        <option value="DESC">Newest first</option>
                        <option value="ASC">Oldest first</option>
                    </select>
                </div>
            </div>

            {/* ── Requests table ──────────────────────────────── */}
            <div className="card overflow-hidden animate-fade-in-up">
                {isLoading ? (
                    <div className="space-y-3 p-4">
                        <div className="skeleton h-12" />
                        <div className="skeleton h-12" />
                        <div className="skeleton h-12" />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center">
                        <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load requests</p>
                        <button onClick={() => refetch()} className="mt-2 btn-outline btn-sm">Retry</button>
                    </div>
                ) : !requests || requests.length === 0 ? (
                    <div className="p-8 text-center">
                        <Wrench className="h-10 w-10 mx-auto text-fg-muted dark:text-fg-muted-dark mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No maintenance requests</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {statusFilter || priorityFilter
                                ? "Try clearing your filters."
                                : "Renter requests will appear here once your tenants submit them."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-premium w-full">
                            <thead>
                                <tr>
                                    <th>Property</th>
                                    <th>Request</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th>First Response</th>
                                    <th>Update</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => {
                                    const responseTime =
                                        req.firstLandlordResponseAt != null
                                            ? (() => {
                                                  const ms =
                                                      new Date(req.firstLandlordResponseAt).getTime() -
                                                      new Date(req.createdAt).getTime();
                                                  const hours = ms / 3_600_000;
                                                  return hours < 0 ? "—" : avgResponseHoursLabel(hours);
                                              })()
                                            : "—";
                                    const responded = req.firstLandlordResponseAt != null;
                                    return (
                                        <tr key={req.id}>
                                            <td>
                                                <p className="font-medium text-fg dark:text-fg-dark text-sm">
                                                    {req.propertyName ?? "—"}
                                                </p>
                                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                                    {req.unitNumber ? `Unit ${req.unitNumber}` : ""}
                                                </p>
                                            </td>
                                            <td>
                                                <p className="font-medium text-fg dark:text-fg-dark text-sm">
                                                    {req.title}
                                                </p>
                                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                                    {req.renterName ?? "Renter"}
                                                </p>
                                            </td>
                                            <td>
                                                <span className={`badge ${priorityBadgeClass(req.priority)} !text-[10px]`}>
                                                    {PRIORITY_LABEL[req.priority]}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${statusBadgeClass(req.status)} !text-[10px]`}>
                                                    {STATUS_LABEL[req.status]}
                                                </span>
                                            </td>
                                            <td className="text-sm text-fg-muted dark:text-fg-muted-dark whitespace-nowrap">
                                                {formatDate(req.createdAt)}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        responded
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-fg-subtle dark:text-fg-subtle-dark"
                                                    }`}
                                                >
                                                    {responseTime}
                                                </span>
                                                {!responded && req.status !== "COMPLETED" && req.status !== "CANCELLED" && (
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                                        Not yet responded
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                <select
                                                    value={req.status}
                                                    disabled={updateStatus.isPending}
                                                    onChange={(e) =>
                                                        updateStatus.mutate({ id: req.id, status: e.target.value })
                                                    }
                                                    className="form-input !w-auto !py-1.5 !text-xs"
                                                >
                                                    {STATUS_ORDER.filter((s) => s !== "CANCELLED").map((s) => (
                                                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {updateStatus.isPending && (
                <p className="flex items-center gap-2 text-xs text-fg-muted dark:text-fg-muted-dark">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    Updating status…
                </p>
            )}

            {/* ── Reviews ─────────────────────────────────────── */}
            <ReviewsCard />
        </div>
    );
}

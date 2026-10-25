// features/maintenance/components/requests-hub.tsx
"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
    Wrench,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Loader2,
    ListFilter,
    ChevronRight,
    Timer,
    Inbox,
    CalendarDays,
    UserCog,
    Tag,
    MessageSquareText,
    Send,
    CornerDownRight,
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
    MaintenanceRequestResponse,
    MaintenanceStatus,
} from "../types/maintenance-response";
import {
    PRIORITY_LABEL,
    STATUS_LABEL,
    avgResponseHoursLabel,
    priorityBadgeClass,
    statusBadgeClass,
    waitSeverity,
    waitingLabel,
} from "../lib/request-utils";
import { ReviewsCard } from "@/features/reviews/components/reviews-card";

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function hoursSince(iso: string | null | undefined): number | null {
    if (!iso) return null;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return null;
    return (Date.now() - parsed.getTime()) / 3_600_000;
}

const STATUS_ORDER: MaintenanceStatus[] = [
    "SUBMITTED",
    "IN_REVIEW",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
];

const ALL_STATUSES = STATUS_ORDER;

/**
 * The statuses a landlord can pick for this request: its current one (a note
 * alone is a reply) plus whatever the backend says may come next. Falls back
 * to the full list only for a response from an older backend without the field.
 */
function selectableStatuses(req: MaintenanceRequestResponse, includeCancel: boolean): MaintenanceStatus[] {
    const next = req.allowedNextStatuses ?? STATUS_ORDER;
    return STATUS_ORDER.filter(
        (s) => (s === req.status || next.includes(s)) && (includeCancel || s !== "CANCELLED" || s === req.status),
    );
}

/**
 * A metric tile.
 *
 * `tone` is semantic, not decorative: "alert" is reserved for figures that
 * represent someone waiting. Nothing else may use it, or the one thing that
 * should pull the eye stops doing so.
 */
function MetricTile({
    icon: Icon,
    label,
    value,
    hint,
    tone = "neutral",
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    value: string;
    hint?: string;
    tone?: "neutral" | "brand" | "success" | "alert";
}) {
    const chip =
        tone === "alert"
            ? "bg-danger/10 text-danger-dark dark:text-danger ring-1 ring-danger/20"
            : tone === "success"
              ? "bg-success/10 text-success-dark dark:text-success ring-1 ring-success/20"
              : tone === "brand"
                ? "bg-brand/10 text-brand dark:text-brand-300 ring-1 ring-brand/20"
                : "bg-ink/[0.05] dark:bg-white/[0.06] text-fg-muted dark:text-fg-muted-dark ring-1 ring-border/60 dark:ring-border-dark/60";

    return (
        <div
            className={`card relative overflow-hidden p-4 transition-shadow hover:shadow-card ${
                tone === "alert" ? "ring-1 ring-danger/25" : ""
            }`}
        >
            {tone === "alert" && (
                <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-danger" />
            )}
            <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${chip}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="kpi-label">{label}</p>
                    <p
                        className={`kpi-value font-data tabular-nums ${
                            tone === "alert"
                                ? "text-danger-dark dark:text-danger"
                                : "text-fg dark:text-fg-dark"
                        }`}
                    >
                        {value}
                    </p>
                    {hint && (
                        <p className="mt-0.5 text-[11px] leading-snug text-fg-subtle dark:text-fg-subtle-dark">
                            {hint}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * The expanded body of a row: what the renter actually reported.
 *
 * The description was returned by the API and rendered nowhere, so a landlord
 * triaging "Testing workflow · Urgent" had the title and nothing else. Every
 * field here was already on the wire.
 */
function RequestDetail({
    req,
    onRespond,
    isSending,
}: {
    req: MaintenanceRequestResponse;
    onRespond: (status: MaintenanceStatus, note: string) => void;
    isSending: boolean;
}) {
    const [note, setNote] = useState("");
    const [nextStatus, setNextStatus] = useState<MaintenanceStatus>(req.status);
    const unchanged = nextStatus === req.status && note.trim() === "";

    const facts: { icon: typeof Tag; label: string; value: string }[] = [
        { icon: Tag, label: "Category", value: req.category?.replace(/_/g, " ") ?? "—" },
        { icon: CalendarDays, label: "Scheduled", value: formatDate(req.scheduledDate) },
        { icon: UserCog, label: "Assigned to", value: req.assignedTo || "Nobody yet" },
        { icon: CheckCircle2, label: "Completed", value: formatDate(req.completedAt) },
    ];

    return (
        <div className="border-t border-border/70 bg-surface-sunk/40 px-4 py-4 dark:border-border-dark/70 dark:bg-white/[0.02]">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                    <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle dark:text-fg-subtle-dark">
                        <MessageSquareText className="h-3.5 w-3.5" strokeWidth={2} />
                        What the renter reported
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg dark:text-fg-dark">
                        {req.description?.trim() || (
                            <span className="text-fg-muted dark:text-fg-muted-dark">
                                No description was provided.
                            </span>
                        )}
                    </p>
                    {req.notes?.trim() && (
                        <div className="mt-4 rounded-xl border border-brand/20 bg-brand/[0.05] p-3">
                            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand dark:text-brand-300">
                                <CornerDownRight className="h-3.5 w-3.5" strokeWidth={2} />
                                Your last reply to the renter
                            </p>
                            {/* Labelled as sent, not as an internal note: it
                                goes out by SMS, and a landlord who thinks
                                this is private will write something they
                                would not send. */}
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg dark:text-fg-dark">
                                {req.notes}
                            </p>
                        </div>
                    )}

                    {/* Composed here, beside the report it answers, rather
                        than in a modal that hides the very text the landlord
                        is replying to. */}
                    <div className="mt-4">
                        <label
                            htmlFor={`reply-${req.id}`}
                            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-subtle dark:text-fg-subtle-dark"
                        >
                            Reply to {req.renterName ?? "the renter"}
                        </label>
                        <textarea
                            id={`reply-${req.id}`}
                            value={note}
                            onChange={(e) => setNote(e.target.value.slice(0, 500))}
                            rows={3}
                            placeholder="e.g. Plumber booked for Thursday morning — he has the key."
                            className="form-input w-full resize-y text-sm"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <select
                                value={nextStatus}
                                onChange={(e) => setNextStatus(e.target.value as MaintenanceStatus)}
                                className="form-input !w-auto !py-1.5 !text-xs"
                                aria-label="Set status"
                            >
                                {selectableStatuses(req, true).map((st) => (
                                    <option key={st} value={st}>{STATUS_LABEL[st]}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                disabled={unchanged || isSending}
                                onClick={() => {
                                    onRespond(nextStatus, note);
                                    setNote("");
                                }}
                                className="btn-primary btn-sm"
                            >
                                {isSending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                                ) : (
                                    <Send className="h-3.5 w-3.5" strokeWidth={2} />
                                )}
                                Send reply
                            </button>
                            <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                {note.trim()
                                    ? `${500 - note.length} characters left · sent by SMS`
                                    : "A status change alone tells them little — a line of context tells them a lot."}
                            </span>
                        </div>
                    </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 self-start md:grid-cols-1">
                    {facts.map((f) => (
                        <div key={f.label} className="min-w-0">
                            <dt className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-fg-subtle dark:text-fg-subtle-dark">
                                <f.icon className="h-3 w-3" strokeWidth={2} />
                                {f.label}
                            </dt>
                            <dd className="mt-0.5 truncate text-sm capitalize text-fg dark:text-fg-dark">
                                {f.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}

export function RequestsHub() {
    const [statusFilter, setStatusFilter] = useState<"" | MaintenanceStatus>("");
    const [priorityFilter, setPriorityFilter] = useState<"" | MaintenancePriority>("");
    const [awaitingOnly, setAwaitingOnly] = useState(false);
    const [sort, setSort] = useState<NonNullable<MaintenanceListParams["sort"]>>("createdAt");
    const [direction, setDirection] = useState<"ASC" | "DESC">("DESC");
    const [expandedId, setExpandedId] = useState<string | null>(null);

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

    // Depend on `mutate` (stable across renders), never on the mutation
    // object, whose identity changes on every state transition. Depending on
    // the object made this effect re-trigger on its own side effect:
    // mutate -> isPending -> re-render -> new object -> mutate. Nothing
    // capped it, so while POST /maintenance/read was returning 500 and
    // unviewedCount therefore never fell to 0, the page issued the request
    // tens of times a second for as long as it stayed open.
    const { mutate: markAllViewedNow } = markAllViewed;
    useEffect(() => {
        if (unviewedCount === 0) return;
        markAllViewedNow();
    }, [unviewedCount, markAllViewedNow]);

    const openCount = requests?.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status)).length ?? 0;

    // Client-side because it is a view of the rows already loaded, not a
    // different query. Mirrors the backend's definition of "awaiting":
    // no first response, and not cancelled.
    const visibleRequests = useMemo(() => {
        const rows = requests ?? [];
        if (!awaitingOnly) return rows;
        return rows.filter((r) => r.firstLandlordResponseAt == null && r.status !== "CANCELLED");
    }, [requests, awaitingOnly]);

    // Absent must never render as zero.
    //
    // `?? 0` here produced "Awaiting first reply: 0 — Everyone has been
    // answered" while the table below showed four people waiting 22, 32 and
    // 34 days: a server predating this field returns undefined, and the
    // fallback turned "I don't know" into a confident all-clear. Unknown is
    // shown as unknown; the banner stays hidden because we cannot honestly
    // raise it either.
    const awaitingKnown = typeof sla?.awaitingFirstResponse === "number";
    const awaiting = awaitingKnown ? (sla?.awaitingFirstResponse as number) : null;
    const oldestWait = sla?.oldestAwaitingHours ?? null;

    const punctualityValue =
        sla?.resolvedRequirementMet && sla.responseRatePct != null
            ? `${sla.responseRatePct}%`
            : sla && sla.resolvedRequests > 0
              ? `Needs ${5 - sla.resolvedRequests} more`
              : "—";

    const filtersActive = Boolean(statusFilter || priorityFilter || awaitingOnly);

    return (
        <div className="page-container space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Requests</h1>
                <p className="page-subtitle">
                    Maintenance reported by your renters, how quickly you reply, and what they say about it.
                </p>
            </div>

            {/* ── The one thing that needs action ───────────────
                Shown only when someone is actually waiting. A banner that
                is always present is wallpaper; this one means something
                every time it appears. */}
            {awaiting != null && awaiting > 0 && (
                <button
                    type="button"
                    onClick={() => {
                        setAwaitingOnly(true);
                        setStatusFilter("");
                    }}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-danger/25 bg-danger/[0.06] px-4 py-3.5 text-left transition-colors hover:bg-danger/[0.09] animate-fade-in-up"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/12 text-danger-dark dark:text-danger">
                        <Inbox className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-danger-dark dark:text-danger">
                            {awaiting} {awaiting === 1 ? "renter is" : "renters are"} still waiting for a first reply
                        </span>
                        <span className="block text-xs text-fg-muted dark:text-fg-muted-dark">
                            {oldestWait != null
                                ? `The longest has waited ${waitingLabel(oldestWait)}.`
                                : "None of them has been answered yet."}{" "}
                            Replying is what starts the clock on your response time.
                        </span>
                    </span>
                    <ChevronRight
                        className="h-4 w-4 shrink-0 text-danger-dark/60 transition-transform group-hover:translate-x-0.5 dark:text-danger/60"
                        strokeWidth={2}
                    />
                </button>
            )}

            {/* ── Metrics ───────────────────────────────────────
                Labels say which population each number is computed over.
                "Response Rate / Within 24 hours" used to sit here reading as
                coverage while five requests went unanswered — 100% was
                arithmetically true and told the opposite of the truth. */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricTile
                    icon={Wrench}
                    label="Total requests"
                    value={sla ? String(sla.totalRequests) : "—"}
                    hint={`${openCount} still open`}
                    tone="brand"
                />
                <MetricTile
                    icon={Timer}
                    label="Awaiting first reply"
                    value={awaiting == null ? "—" : String(awaiting)}
                    hint={
                        awaiting == null
                            ? "Not reported by this server"
                            : awaiting > 0 && oldestWait != null
                              ? `Longest wait ${waitingLabel(oldestWait)}`
                              : "Everyone has been answered"
                    }
                    tone={awaiting == null ? "neutral" : awaiting > 0 ? "alert" : "success"}
                />
                <MetricTile
                    icon={Clock}
                    label="Avg first reply"
                    value={sla ? avgResponseHoursLabel(sla.resolvedRequirementMet ? sla.avgResponseHours : null) : "—"}
                    hint={sla ? `Across ${sla.respondedRequests} answered` : "Answered requests only"}
                />
                <MetricTile
                    icon={CheckCircle2}
                    label="Answered within 24h"
                    value={punctualityValue}
                    hint={
                        sla?.resolvedRequirementMet
                            ? `Of ${sla.respondedRequests} answered, not of all requests`
                            : "Unlocks at 5 resolved"
                    }
                    tone="success"
                />
            </div>

            {/* ── Filters ───────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 animate-fade-in-up">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted dark:text-fg-muted-dark">
                    <ListFilter className="h-4 w-4" strokeWidth={2} />
                    Filter
                </span>

                <button
                    type="button"
                    onClick={() => setAwaitingOnly((v) => !v)}
                    aria-pressed={awaitingOnly}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        awaitingOnly
                            ? "border-danger/30 bg-danger/10 text-danger-dark dark:text-danger"
                            : "border-border bg-surface text-fg-muted hover:text-fg dark:border-border-dark dark:bg-surface-dark dark:text-fg-muted-dark dark:hover:text-fg-dark"
                    }`}
                >
                    Awaiting reply{awaiting != null && awaiting > 0 ? ` (${awaiting})` : ""}
                </button>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "" | MaintenanceStatus)}
                    className="form-input !w-auto py-2 text-sm"
                    aria-label="Filter by status"
                >
                    <option value="">All statuses</option>
                    {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                </select>

                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as "" | MaintenancePriority)}
                    className="form-input !w-auto py-2 text-sm"
                    aria-label="Filter by priority"
                >
                    <option value="">All priorities</option>
                    {(["URGENT", "HIGH", "MEDIUM", "LOW"] as MaintenancePriority[]).map((p) => (
                        <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                    ))}
                </select>

                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as NonNullable<MaintenanceListParams["sort"]>)}
                    className="form-input !w-auto py-2 text-sm"
                    aria-label="Sort by"
                >
                    <option value="createdAt">Submitted date</option>
                    <option value="priority">Priority</option>
                    <option value="updatedAt">Last updated</option>
                </select>

                <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as "ASC" | "DESC")}
                    className="form-input !w-auto py-2 text-sm"
                    aria-label="Sort direction"
                >
                    <option value="DESC">Newest first</option>
                    <option value="ASC">Oldest first</option>
                </select>

                {filtersActive && (
                    <button
                        type="button"
                        onClick={() => {
                            setStatusFilter("");
                            setPriorityFilter("");
                            setAwaitingOnly(false);
                        }}
                        className="text-xs font-medium text-brand hover:text-brand-700 dark:text-brand-300"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* ── Requests ──────────────────────────────────────── */}
            <div className="card overflow-hidden animate-fade-in-up">
                {isLoading ? (
                    <div className="space-y-3 p-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="skeleton h-14" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="p-10 text-center">
                        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-danger" strokeWidth={1.5} />
                        <p className="mb-1 text-sm font-medium text-fg dark:text-fg-dark">
                            Couldn&#39;t load requests
                        </p>
                        <p className="mb-4 text-xs text-fg-muted dark:text-fg-muted-dark">
                            Your renters&#39; requests are safe — this is a problem reaching the server.
                        </p>
                        <button onClick={() => refetch()} className="btn-outline btn-sm">Try again</button>
                    </div>
                ) : visibleRequests.length === 0 ? (
                    <div className="p-10 text-center">
                        <Wrench className="mx-auto mb-3 h-10 w-10 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.5} />
                        <p className="mb-1 text-sm font-medium text-fg dark:text-fg-dark">
                            {filtersActive ? "Nothing matches these filters" : "No maintenance requests yet"}
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {filtersActive
                                ? "Try clearing them to see everything."
                                : "When a renter reports a problem from their portal, it lands here."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-premium w-full">
                            <thead>
                                <tr>
                                    <th className="w-8" aria-label="Expand" />
                                    <th>Request</th>
                                    <th>Property</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th>First reply</th>
                                    <th>Update</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRequests.map((req) => {
                                    const responded = req.firstLandlordResponseAt != null;
                                    const responseTime = responded
                                        ? (() => {
                                              const hours =
                                                  (new Date(req.firstLandlordResponseAt as string).getTime() -
                                                      new Date(req.createdAt).getTime()) /
                                                  3_600_000;
                                              return hours < 0 ? "—" : avgResponseHoursLabel(hours);
                                          })()
                                        : "—";

                                    const openFor = responded ? null : hoursSince(req.createdAt);
                                    const severity =
                                        req.status === "CANCELLED" || responded
                                            ? "none"
                                            : waitSeverity(openFor);
                                    const isExpanded = expandedId === req.id;

                                    // A severity rail rather than a coloured
                                    // row: it reads at a glance without
                                    // making the text harder to read.
                                    const rail =
                                        severity === "critical"
                                            ? "before:bg-danger"
                                            : severity === "late"
                                              ? "before:bg-warning"
                                              : severity === "watch"
                                                ? "before:bg-warning/40"
                                                : "before:bg-transparent";

                                    return (
                                        // Fragment, not <>, because the key
                                        // must be on the outermost node
                                        // returned from map — shorthand
                                        // fragments cannot carry one.
                                        <Fragment key={req.id}>
                                            <tr
                                                onClick={() => setExpandedId(isExpanded ? null : req.id)}
                                                className={`relative cursor-pointer transition-colors before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${rail} ${
                                                    isExpanded ? "bg-ink/[0.02] dark:bg-white/[0.03]" : ""
                                                }`}
                                            >
                                                <td className="pl-3 pr-0">
                                                    <ChevronRight
                                                        className={`h-4 w-4 text-fg-subtle transition-transform dark:text-fg-subtle-dark ${
                                                            isExpanded ? "rotate-90" : ""
                                                        }`}
                                                        strokeWidth={2}
                                                    />
                                                </td>
                                                <td>
                                                    <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                                        {req.title}
                                                    </p>
                                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                                        {req.renterName ?? "Renter"}
                                                    </p>
                                                </td>
                                                <td>
                                                    <p className="text-sm text-fg dark:text-fg-dark">
                                                        {req.propertyName ?? "—"}
                                                    </p>
                                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                                        {req.unitNumber ? `Unit ${req.unitNumber}` : ""}
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
                                                <td className="whitespace-nowrap text-sm tabular-nums text-fg-muted dark:text-fg-muted-dark">
                                                    {formatDate(req.createdAt)}
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    {responded ? (
                                                        <span className="text-sm font-medium tabular-nums text-success-dark dark:text-success">
                                                            {responseTime}
                                                        </span>
                                                    ) : req.status === "CANCELLED" ? (
                                                        <span className="text-sm text-fg-subtle dark:text-fg-subtle-dark">—</span>
                                                    ) : (
                                                        <span
                                                            className={`text-xs font-semibold ${
                                                                severity === "critical"
                                                                    ? "text-danger-dark dark:text-danger"
                                                                    : "text-warning-dark dark:text-warning"
                                                            }`}
                                                        >
                                                            Waiting {waitingLabel(openFor)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={req.status}
                                                        disabled={updateStatus.isPending}
                                                        onChange={(e) =>
                                                            updateStatus.mutate({ id: req.id, status: e.target.value })
                                                        }
                                                        className="form-input !w-auto !py-1.5 !text-xs"
                                                        aria-label={`Update status of ${req.title}`}
                                                    >
                                                        {selectableStatuses(req, false).map((s) => (
                                                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="!p-0">
                                                        <RequestDetail
                                                            req={req}
                                                            isSending={updateStatus.isPending}
                                                            onRespond={(status, note) =>
                                                                updateStatus.mutate({ id: req.id, status, note })
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
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

            <ReviewsCard />
        </div>
    );
}

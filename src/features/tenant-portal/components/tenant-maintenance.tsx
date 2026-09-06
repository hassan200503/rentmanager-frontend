"use client";

import { useTenantMaintenanceRequestsQuery } from "../hooks/use-tenant-portal-queries";
import { useTenantDashboardQuery } from "../hooks/use-tenant-portal-queries";
import { useMemo, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { tenantPortalApi, type CreateMaintenanceRequest } from "../api/tenant-portal-api";
import { tenantPortalKeys } from "../hooks/tenant-portal-keys";
import { formatDate } from "./tenant-format";
import {
    Wrench,
    Plus,
    Loader2,
    ChevronRight,
    X,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Search,
    Building2,
    MessageSquare,
    MessageSquareText,
} from "lucide-react";
import { toast } from "sonner";
import {
    PortalPage,
    PortalPageHeader,
    PortalCard,
    PortalEmptyState,
    PortalSkeleton,
    PortalErrorState,
} from "./portal-chrome";

type ViewState = "list" | "form" | "detail";

// Colour carries meaning here: live statuses stay saturated so they pull the
// eye, while terminal ones (Completed/Cancelled) are deliberately neutral.
// Completed was previously badge-success — bright green — which made finished
// work the loudest thing on a page whose whole job is surfacing unfinished work.
const STATUS_META: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    SUBMITTED: { label: "Submitted", icon: Clock, className: "badge-info" },
    IN_REVIEW: { label: "In Review", icon: Search, className: "badge-warning" },
    SCHEDULED: { label: "Scheduled", icon: Clock, className: "badge-emerald" },
    IN_PROGRESS: { label: "In Progress", icon: Loader2, className: "badge-warning" },
    COMPLETED: { label: "Completed", icon: CheckCircle2, className: "badge-neutral" },
    CANCELLED: { label: "Cancelled", icon: X, className: "badge-neutral" },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
    LOW: { label: "Low", className: "badge-neutral" },
    MEDIUM: { label: "Medium", className: "badge-info" },
    HIGH: { label: "High", className: "badge-warning" },
    URGENT: { label: "Urgent", className: "badge-danger" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    PLUMBING: Wrench,
    ELECTRICAL: AlertTriangle,
    STRUCTURAL: Building2,
    APPLIANCE: Wrench,
    PEST_CONTROL: AlertTriangle,
    GENERAL: MessageSquare,
};

/**
 * Statuses that still need somebody to act. Everything else is history.
 * This distinction drives the filter tabs AND the visual weight of a row:
 * a Completed request previously rendered as a loud green badge while a
 * Submitted one was quiet blue, so the requests needing no attention shouted
 * and the ones awaiting action receded — backwards for a work queue.
 */
const OPEN_STATUSES = new Set(["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS"]);

const isOpenStatus = (status: string) => OPEN_STATUSES.has(status);

/**
 * The journey a request travels, in order. CANCELLED is deliberately absent:
 * it is an exit, not a stage, and drawing it as one would imply every request
 * passes through it.
 */
const PROGRESS_STAGES = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] as const;

/**
 * How far along a request is, 0-based, or null when the concept does not
 * apply (cancelled).
 *
 * <p>The page has always promised "follow its progress through to completion"
 * and then shown a single status word, which tells a renter where they are
 * but not how far that is from done. A four-segment track answers "how much
 * longer" at a glance, which is the actual question.
 */
function progressIndex(status: string): number | null {
    const i = PROGRESS_STAGES.indexOf(status as (typeof PROGRESS_STAGES)[number]);
    return i === -1 ? null : i;
}

/** Whole days since an ISO timestamp, floored. */
function daysSince(iso: string): number {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return 0;
    return Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
}

/**
 * A slim track showing how far a request has travelled.
 *
 * Segments rather than a percentage bar: the stages are discrete and named,
 * and a smooth 60% would imply a precision the data does not have.
 */
function ProgressTrack({ status }: { status: string }) {
    const index = progressIndex(status);
    if (index == null) return null;

    return (
        <div
            className="mt-2.5 flex items-center gap-1"
            role="img"
            aria-label={`Stage ${index + 1} of ${PROGRESS_STAGES.length}: ${STATUS_META[status]?.label ?? status}`}
        >
            {PROGRESS_STAGES.map((stage, i) => {
                const done = i <= index;
                return (
                    <span
                        key={stage}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            done
                                ? index === PROGRESS_STAGES.length - 1
                                    ? "bg-ink-muted/40 dark:bg-white/20"
                                    : "bg-brand dark:bg-brand-400"
                                : "bg-ink/[0.07] dark:bg-white/[0.08]"
                        }`}
                    />
                );
            })}
        </div>
    );
}

/**
 * "PEST_CONTROL" -> "Pest control". Previously rendered via
 * .replace("_"," ").toLowerCase(), which produced an all-lowercase "general"
 * sitting among properly-capitalised labels.
 */
const categoryLabel = (category: string) => {
    const words = category.replace(/_/g, " ").toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
};

type StatusFilter = "all" | "open" | "resolved";

/**
 * Short relative age for recent items ("Today", "3 days ago"); anything older
 * keeps the absolute date, which is what matters for a record you may need to
 * cite later.
 */
function relativeAge(iso: string): string | null {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    const days = Math.floor((Date.now() - then) / 86_400_000);
    if (days < 0) return null;
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    return null;
}

function ListSkeleton() {
    return (
        <PortalPage>
            <div className="flex items-center justify-between">
                <div className="tenant-skeleton-premium h-8 w-48 rounded-lg" />
                <div className="tenant-skeleton-premium h-9 w-32 rounded-lg" />
            </div>
            <PortalSkeleton rows={3} />
        </PortalPage>
    );
}

export default function TenantMaintenance() {
    const [view, setView] = useState<ViewState>("list");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (view === "form") return <MaintenanceForm onBack={() => setView("list")} />;
    if (view === "detail" && selectedId) return <MaintenanceDetail id={selectedId} onBack={() => { setView("list"); setSelectedId(null); }} />;

    return <MaintenanceList onNew={() => setView("form")} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />;
}

function MaintenanceList({ onNew, onSelect }: { onNew: () => void; onSelect: (id: string) => void }) {
    const { data: requests, isLoading, error } = useTenantMaintenanceRequestsQuery();
    const [filter, setFilter] = useState<StatusFilter>("all");

    // Newest first. The API returns rows in no guaranteed order — the list was
    // rendering 1 Aug, 2 Aug, 1 Aug, 3 Aug, 14 Aug interleaved — so ordering is
    // enforced here rather than assumed. Sorting a copy keeps the query cache
    // immutable.
    const ordered = useMemo(() => {
        return [...(requests ?? [])].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [requests]);

    const openCount = useMemo(() => ordered.filter((r) => isOpenStatus(r.status)).length, [ordered]);
    const resolvedCount = ordered.length - openCount;

    // The longest anyone has been left without a reply. Shown because "5 still
    // open" is a count, not a situation: five requests opened this morning and
    // five untouched since August are the same number and completely
    // different circumstances.
    const longestWaitDays = useMemo(() => {
        const waits = ordered
            .filter((r) => isOpenStatus(r.status) && r.firstLandlordResponseAt == null)
            .map((r) => daysSince(r.createdAt));
        return waits.length ? Math.max(...waits) : 0;
    }, [ordered]);

    const visible = useMemo(() => {
        if (filter === "open") return ordered.filter((r) => isOpenStatus(r.status));
        if (filter === "resolved") return ordered.filter((r) => !isOpenStatus(r.status));
        return ordered;
    }, [ordered, filter]);

    if (isLoading) return <ListSkeleton />;

    if (error) {
        return (
            <PortalPage>
                <PortalPageHeader
                    icon={Wrench}
                    eyebrow="Your home"
                    title="Maintenance"
                    subtitle="Submit and track repair requests."
                />
                <PortalErrorState
                    title="Couldn't load your requests"
                    description="This is usually temporary. Check your connection and try again."
                />
            </PortalPage>
        );
    }

    return (
        <PortalPage>
            <PortalPageHeader
                icon={Wrench}
                eyebrow="Your home"
                title="Maintenance"
                subtitle="Report a problem and follow its progress through to completion."
                actions={
                    <button type="button" onClick={onNew} className="btn-primary">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        New Request
                    </button>
                }
            />

            {ordered.length === 0 ? (
                <PortalCard padded={false}>
                    <PortalEmptyState
                        icon={Wrench}
                        title="No maintenance requests"
                        description="Report a repair and you'll be able to track its status here from submitted through to completed."
                        action={
                            <button type="button" onClick={onNew} className="btn-primary">
                                <Plus className="h-4 w-4" strokeWidth={2} />
                                Submit Request
                            </button>
                        }
                    />
                </PortalCard>
            ) : (
                <>
                    {/* Filter + count. At nine-plus requests an unfiltered list stops
                        being scannable, and "2 still open" is the number a renter
                        actually cares about. */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div
                            role="tablist"
                            aria-label="Filter requests by status"
                            /* Was an inline style with a hardcoded
                               rgba(0,0,0,0.06) border, which is invisible on a
                               dark ground — inline styles cannot carry a
                               dark: variant, so the control lost its edge
                               entirely in dark mode. Tokens fix it in both. */
                            className="inline-flex items-center gap-1 rounded-xl border border-ink/[0.06] bg-ink/[0.04] p-1 dark:border-white/[0.08] dark:bg-white/[0.05]"
                        >
                            {([
                                { id: "all" as const, label: "All", count: ordered.length },
                                { id: "open" as const, label: "Open", count: openCount },
                                { id: "resolved" as const, label: "Resolved", count: resolvedCount },
                            ]).map((tab) => {
                                const active = filter === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setFilter(tab.id)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                            active
                                                ? "bg-white text-ink shadow-sm dark:bg-white/12 dark:text-ink-dark"
                                                : "text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark"
                                        }`}
                                    >
                                        {tab.label}
                                        <span className={`ml-1.5 tabular-nums ${active ? "text-ink-muted dark:text-ink-muted-dark" : "text-ink-subtle dark:text-ink-subtle-dark"}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                            {openCount === 0 ? (
                                "Nothing outstanding"
                            ) : (
                                <>
                                    {openCount} still open
                                    {longestWaitDays >= 7 && (
                                        <>
                                            <span aria-hidden="true" className="mx-1.5 text-ink-subtle/50">·</span>
                                            <span className="font-medium text-warning-dark dark:text-warning">
                                                longest waiting {longestWaitDays} days
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </p>
                    </div>

                    {visible.length === 0 ? (
                        <PortalCard padded={false}>
                            <PortalEmptyState
                                icon={Wrench}
                                title={filter === "open" ? "Nothing outstanding" : "Nothing resolved yet"}
                                description={
                                    filter === "open"
                                        ? "Every request you've raised has been dealt with."
                                        : "Requests will move here once your landlord marks them completed."
                                }
                            />
                        </PortalCard>
                    ) : (
                        <div className="space-y-2.5">
                            {visible.map((req) => {
                                const CatIcon = CATEGORY_ICONS[req.category] ?? Wrench;
                                const statusMeta = STATUS_META[req.status] ?? STATUS_META.SUBMITTED;
                                const priorityMeta = PRIORITY_META[req.priority] ?? PRIORITY_META.MEDIUM;
                                const StatusIcon = statusMeta.icon;
                                const open = isOpenStatus(req.status);
                                const age = relativeAge(req.createdAt);

                                // Whether anyone has actually come back to
                                // them. Until now every row looked identical
                                // whether the landlord had replied or had not
                                // touched it in 34 days — the renter had to
                                // open each request to find out, and a reply
                                // could sit unread indefinitely.
                                const replied = Boolean(req.notes?.trim());
                                const awaitingReply =
                                    req.firstLandlordResponseAt == null && open;
                                const waitingDays = awaitingReply ? daysSince(req.createdAt) : 0;
                                // A long silence earns visual weight. Amber,
                                // not red: the renter has done nothing wrong,
                                // and alarming them about their landlord's
                                // delay helps nobody. It marks the row as
                                // worth chasing, which is the useful signal.
                                const overdue = awaitingReply && waitingDays >= 7;

                                return (
                                    <button
                                        key={req.id}
                                        type="button"
                                        onClick={() => onSelect(req.id)}
                                        className={`tenant-panel !p-4 w-full text-left flex items-start gap-4 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-card ${
                                            open ? "" : "opacity-[0.72] hover:opacity-100"
                                        } ${
                                            overdue
                                                ? "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-warning"
                                                : ""
                                        }`}
                                    >
                                        {/* Open requests get the brand-tinted icon; resolved ones
                                            go neutral so the eye lands on what still needs action. */}
                                        <div
                                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                open
                                                    ? "bg-brand-50 text-brand dark:bg-brand-900/30 dark:text-brand-400"
                                                    : "bg-ink/[0.05] text-ink-muted dark:bg-white/[0.07] dark:text-ink-muted-dark"
                                            }`}
                                        >
                                            {/* @ts-expect-error - React 19 ElementType inference issue */}
                                            <CatIcon className="h-5 w-5" strokeWidth={1.75} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-ink dark:text-ink-dark">
                                                {req.title}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">
                                                <span>{formatDate(req.createdAt)}</span>
                                                {age && (
                                                    <>
                                                        <span aria-hidden="true" className="text-ink-subtle/50">·</span>
                                                        <span>{age}</span>
                                                    </>
                                                )}
                                            </p>

                                            {replied ? (
                                                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-brand dark:text-brand-400">
                                                    <MessageSquareText className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                                                    <span className="line-clamp-1 font-medium">
                                                        {req.notes?.trim()}
                                                    </span>
                                                </p>
                                            ) : awaitingReply ? (
                                                /* Quantified, not repeated. Four identical
                                                   sentences reading "Waiting for your landlord
                                                   to respond" told the renter nothing they
                                                   could act on; the number of days is the part
                                                   that decides whether to chase. */
                                                <p
                                                    className={`mt-1.5 inline-flex items-center gap-1.5 text-xs ${
                                                        overdue
                                                            ? "font-medium text-warning-dark dark:text-warning"
                                                            : "text-ink-subtle dark:text-ink-subtle-dark"
                                                    }`}
                                                >
                                                    <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                                                    {waitingDays < 1
                                                        ? "No reply yet"
                                                        : `No reply yet · ${waitingDays} day${waitingDays === 1 ? "" : "s"}`}
                                                </p>
                                            ) : null}

                                            {open && <ProgressTrack status={req.status} />}
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                                            {/* Priority is only meaningful while something is still
                                                open — on a closed request it is noise. */}
                                            {open && <span className={priorityMeta.className}>{priorityMeta.label}</span>}
                                            <span className={`inline-flex items-center gap-1 ${statusMeta.className}`}>
                                                {/* @ts-expect-error - React 19 ElementType inference issue */}
                                                <StatusIcon className="h-3 w-3" strokeWidth={2} />
                                                {statusMeta.label}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-ink-subtle transition-colors group-hover:text-brand dark:text-ink-subtle-dark dark:group-hover:text-brand-400" strokeWidth={2} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </PortalPage>
    );
}

function MaintenanceForm({ onBack }: { onBack: () => void }) {
    const queryClient = useQueryClient();
    const { data: dashboard } = useTenantDashboardQuery();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<CreateMaintenanceRequest["category"]>("GENERAL");
    const [priority, setPriority] = useState<CreateMaintenanceRequest["priority"]>("MEDIUM");

    const mutation = useMutation({
        mutationFn: (payload: CreateMaintenanceRequest) => tenantPortalApi.submitMaintenanceRequest(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.maintenance() });
            toast.success("Maintenance request submitted");
            onBack();
        },
        onError: () => {
            toast.error("Failed to submit maintenance request");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (!dashboard) return;

        mutation.mutate({
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            priority,
        });
    };

    const CATEGORIES: { value: CreateMaintenanceRequest["category"]; label: string }[] = [
        { value: "PLUMBING", label: "Plumbing" },
        { value: "ELECTRICAL", label: "Electrical" },
        { value: "STRUCTURAL", label: "Structural" },
        { value: "APPLIANCE", label: "Appliance" },
        { value: "PEST_CONTROL", label: "Pest Control" },
        { value: "GENERAL", label: "General" },
    ];

    const PRIORITIES: { value: CreateMaintenanceRequest["priority"]; label: string }[] = [
        { value: "LOW", label: "Low" },
        { value: "MEDIUM", label: "Medium" },
        { value: "HIGH", label: "High" },
        { value: "URGENT", label: "Urgent – immediate attention needed" },
    ];

    return (
        <div className="page-container max-w-2xl mx-auto animate-fade-in-up py-6 sm:py-8">
            <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors">
                    <ChevronRight className="h-4 w-4 rotate-180 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-fg dark:text-fg-dark">New Request</h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-0.5">Describe the issue you&apos;re experiencing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="tenant-panel !p-5 sm:!p-6 space-y-5">
                <div className="space-y-1.5">
                    <label className="form-label">Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Leaking kitchen faucet"
                        className="form-input"
                        required
                        maxLength={200}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="form-label">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue in detail, including location and how long it has been happening"
                        className="form-input min-h-[100px] resize-y"
                        rows={4}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="form-label">Category *</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as CreateMaintenanceRequest["category"])} className="form-input">
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="form-label">Priority *</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as CreateMaintenanceRequest["priority"])} className="form-input">
                            {PRIORITIES.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={onBack} className="btn-ghost">Cancel</button>
                    <button type="submit" disabled={!title.trim() || mutation.isPending} className="btn-primary">
                        {mutation.isPending ? (
                            <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Submitting...</>
                        ) : (
                            <><Plus className="h-4 w-4" strokeWidth={2} /> Submit Request</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

function MaintenanceDetail({ id, onBack }: { id: string; onBack: () => void }) {
    const { data: requests } = useTenantMaintenanceRequestsQuery();
    const request = requests?.find((r) => r.id === id);

    if (!request) {
        return (
            <PortalPage>
                <PortalCard padded={false}>
                    <PortalEmptyState
                        icon={Wrench}
                        title="Request not found"
                        description="It may have been removed, or the link is out of date."
                        action={
                            <button type="button" onClick={onBack} className="btn-outline btn-sm">
                                Back to requests
                            </button>
                        }
                    />
                </PortalCard>
            </PortalPage>
        );
    }

    const CatIcon = CATEGORY_ICONS[request.category] ?? Wrench;
    const statusMeta = STATUS_META[request.status] ?? STATUS_META.SUBMITTED;
    const priorityMeta = PRIORITY_META[request.priority] ?? PRIORITY_META.MEDIUM;
    const StatusIcon = statusMeta.icon;

    return (
        <div className="page-container max-w-2xl mx-auto animate-fade-in-up py-6 sm:py-8 space-y-6">
            <div className="flex items-center gap-3">
                <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors">
                    <ChevronRight className="h-4 w-4 rotate-180 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-display font-bold text-fg dark:text-fg-dark truncate">{request.title}</h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-0.5">Submitted {formatDate(request.createdAt)}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 ${statusMeta.className}`}>
                    {/* @ts-expect-error - React 19 ElementType inference issue */}
                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {statusMeta.label}
                </span>
                <span className={priorityMeta.className}>{priorityMeta.label} Priority</span>
                <span className="badge-neutral inline-flex items-center gap-1.5">
                    {/* @ts-expect-error - React 19 ElementType inference issue */}
                    <CatIcon className="h-3 w-3" strokeWidth={2} />
                    {categoryLabel(request.category)}
                </span>
            </div>

            <div className="tenant-panel !p-5 sm:!p-6 space-y-5">
                {request.description && (
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-2">Description</p>
                        <p className="text-sm text-fg dark:text-fg-dark leading-relaxed whitespace-pre-wrap">{request.description}</p>
                    </div>
                )}

                {/* Category and Priority are NOT repeated here — they are already
                    stated as badges directly above. This grid carries only the
                    facts that appear nowhere else: scheduling, assignment and
                    completion. Restating the same three attributes in a second
                    style is what made this screen read as a template dump. */}
                <div className="grid grid-cols-2 gap-4">
                    {request.scheduledDate && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Scheduled Date</p>
                            <p className="text-sm text-fg dark:text-fg-dark">{formatDate(request.scheduledDate)}</p>
                        </div>
                    )}
                    {request.assignedTo && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Assigned To</p>
                            <p className="text-sm text-fg dark:text-fg-dark">{request.assignedTo}</p>
                        </div>
                    )}
                    {request.completedAt && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-1">Completed At</p>
                            <p className="text-sm text-fg dark:text-fg-dark">{formatDate(request.completedAt)}</p>
                        </div>
                    )}
                </div>

                {/* This is the landlord speaking to the renter, so it is
                    labelled as such. "Notes" read like a filing annotation and
                    buried the one part of the screen that answers the question
                    the renter actually came with. */}
                {request.notes?.trim() ? (
                    <div className="rounded-xl border border-brand/25 bg-brand-50/60 p-4 dark:border-brand-400/25 dark:bg-brand-900/15">
                        <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand dark:text-brand-400">
                            <MessageSquareText className="h-3.5 w-3.5" strokeWidth={2} />
                            Reply from your landlord
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg dark:text-fg-dark">
                            {request.notes}
                        </p>
                        {request.firstLandlordResponseAt && (
                            <p className="mt-2 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                First responded {formatDate(request.firstLandlordResponseAt)}
                            </p>
                        )}
                    </div>
                ) : isOpenStatus(request.status) ? (
                    /* Silence is information too. Without this the renter
                       cannot tell "seen and being handled" from "nobody has
                       looked at this in a month". */
                    <div className="rounded-xl border border-border/70 bg-surface-sunk/40 p-4 dark:border-border-dark/70 dark:bg-white/[0.02]">
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            Your landlord hasn&#39;t replied to this yet. You&#39;ll get an SMS as
                            soon as they do.
                        </p>
                    </div>
                ) : null}
            </div>

            {/* The "Timeline" panel that used to sit here has been removed. It
                restated the status badge, the scheduled date and the completion
                date — every one of which is already on this screen — so it added
                a third copy of the same facts without adding information. A real
                event timeline (submitted → reviewed → scheduled → completed, with
                timestamps) would be worth building, but the API does not expose
                those transition times today, so inventing one would be fiction. */}
        </div>
    );
}

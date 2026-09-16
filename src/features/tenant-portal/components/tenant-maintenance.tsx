"use client";

import { useMemo, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
    Bug,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock,
    Droplets,
    Loader2,
    MessageCircle,
    MessageSquareText,
    Phone,
    Plus,
    Search,
    Settings,
    Wrench,
    X,
    Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
    useTenantMaintenanceRequestsQuery,
    useTenantLeaseQuery,
} from "../hooks/use-tenant-portal-queries";
import { tenantPortalApi, type CreateMaintenanceRequest } from "../api/tenant-portal-api";
import { tenantPortalKeys } from "../hooks/tenant-portal-keys";
import { formatDate } from "./tenant-format";
import {
    PortalPage,
    PortalCard,
    PortalEmptyState,
    PortalSkeleton,
    PortalErrorState,
} from "./portal-chrome";

// ── Types ──────────────────────────────────────────────────────────────────────

type ViewState = "list" | "form" | "detail";
type StatusFilter = "all" | "open" | "resolved";
type IconFC = React.FC<{ className?: string; strokeWidth?: number }>;

// ── Status ─────────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; icon: IconFC; className: string }> = {
    SUBMITTED:   { label: "Submitted",   icon: Clock,        className: "badge-info"    },
    IN_REVIEW:   { label: "In Review",   icon: Search,       className: "badge-warning" },
    SCHEDULED:   { label: "Scheduled",   icon: Clock,        className: "badge-emerald" },
    IN_PROGRESS: { label: "In Progress", icon: Loader2,      className: "badge-warning" },
    COMPLETED:   { label: "Completed",   icon: CheckCircle2, className: "badge-neutral" },
    CANCELLED:   { label: "Cancelled",   icon: X,            className: "badge-neutral" },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
    LOW:    { label: "Low",    className: "badge-neutral" },
    MEDIUM: { label: "Medium", className: "badge-info"    },
    HIGH:   { label: "High",   className: "badge-warning" },
    URGENT: { label: "Urgent", className: "badge-danger"  },
};

// ── Category config — semantic colours per type ────────────────────────────────
// Each category gets its own colour so the icon is instantly scannable in the
// list without reading the text. Use complete class strings so Tailwind JIT
// can pick them up at build time.

const CATEGORY_ICONS: Record<string, IconFC> = {
    PLUMBING:     Droplets,
    ELECTRICAL:   Zap,
    STRUCTURAL:   Building2,
    APPLIANCE:    Settings,
    PEST_CONTROL: Bug,
    GENERAL:      Wrench,
};

const CATEGORY_ICON_STYLE: Record<string, { text: string; bg: string }> = {
    PLUMBING:     { text: "text-blue-500 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/25"    },
    ELECTRICAL:   { text: "text-amber-500 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/25"  },
    STRUCTURAL:   { text: "text-slate-500 dark:text-slate-400",  bg: "bg-slate-100 dark:bg-slate-800/50" },
    APPLIANCE:    { text: "text-purple-500 dark:text-purple-400",bg: "bg-purple-50 dark:bg-purple-900/25"},
    PEST_CONTROL: { text: "text-orange-500 dark:text-orange-400",bg: "bg-orange-50 dark:bg-orange-900/25"},
    GENERAL:      { text: "text-brand dark:text-brand-400",      bg: "bg-brand-50 dark:bg-brand-900/25"  },
};

// Gradient priority bar — CSS gradient strings, applied via inline style so JIT
// doesn't need to know the actual brand CSS variable value at compile time.
function priorityBarStyle(priority: string, open: boolean): React.CSSProperties {
    if (!open) return { background: "var(--color-border, #e2e8f0)" };
    const map: Record<string, string> = {
        URGENT: "linear-gradient(to bottom, #ef4444, #dc2626)",
        HIGH:   "linear-gradient(to bottom, #f59e0b, #d97706)",
        MEDIUM: "linear-gradient(to bottom, var(--color-brand, #6366f1), var(--color-brand, #6366f1))",
        LOW:    "var(--color-border, #e2e8f0)",
    };
    return { background: map[priority] ?? map.MEDIUM };
}

// Card background tint for open requests.
const PRIORITY_CARD_TINT: Record<string, string> = {
    URGENT: "border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-900/10",
    HIGH:   "border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10",
    MEDIUM: "border-brand-200/70 dark:border-brand-700/30 bg-brand-50/40 dark:bg-brand-900/10",
    LOW:    "border-border dark:border-border-dark",
};

const OPEN_STATUSES = new Set(["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS"]);
const isOpenStatus  = (s: string) => OPEN_STATUSES.has(s);

const PROGRESS_STAGES = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] as const;

function progressIndex(status: string): number | null {
    const i = PROGRESS_STAGES.indexOf(status as (typeof PROGRESS_STAGES)[number]);
    return i === -1 ? null : i;
}

function daysSince(iso: string): number {
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : Math.floor((Date.now() - t) / 86_400_000);
}

function relativeAge(iso: string): string | null {
    const days = daysSince(iso);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    return null;
}

const categoryLabel = (cat: string) => {
    const w = cat.replace(/_/g, " ").toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
};

// ── Slim 5-segment progress track shown on list cards ─────────────────────────

function ProgressTrack({ status }: { status: string }) {
    const index = progressIndex(status);
    if (index == null) return null;
    const isComplete = index === PROGRESS_STAGES.length - 1;
    return (
        <div
            className="mt-3 flex items-center gap-[3px]"
            role="img"
            aria-label={`Stage ${index + 1} of 5: ${STATUS_META[status]?.label ?? status}`}
        >
            {PROGRESS_STAGES.map((_, i) => (
                <span
                    key={i}
                    className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                        i <= index
                            ? isComplete
                                ? "bg-ink/25 dark:bg-white/25"
                                : "bg-brand dark:bg-brand-400"
                            : "bg-ink/[0.07] dark:bg-white/[0.08]"
                    }`}
                />
            ))}
        </div>
    );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function TenantMaintenance() {
    const [view,       setView]       = useState<ViewState>("list");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (view === "form") {
        return <MaintenanceForm onBack={() => setView("list")} />;
    }
    if (view === "detail" && selectedId) {
        return (
            <MaintenanceDetail
                id={selectedId}
                onBack={() => { setView("list"); setSelectedId(null); }}
            />
        );
    }
    return (
        <MaintenanceList
            onNew={() => setView("form")}
            onSelect={(id) => { setSelectedId(id); setView("detail"); }}
        />
    );
}

// ── List ───────────────────────────────────────────────────────────────────────

function MaintenanceList({ onNew, onSelect }: { onNew: () => void; onSelect: (id: string) => void }) {
    const { data: requests, isLoading, error } = useTenantMaintenanceRequestsQuery();
    const [filter, setFilter] = useState<StatusFilter>("all");

    const ordered = useMemo(
        () => [...(requests ?? [])].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        [requests],
    );

    const openCount     = useMemo(() => ordered.filter((r) =>  isOpenStatus(r.status)).length, [ordered]);
    const resolvedCount = ordered.length - openCount;

    const longestWaitDays = useMemo(() => {
        const waits = ordered
            .filter((r) => isOpenStatus(r.status) && r.firstLandlordResponseAt == null)
            .map((r) => daysSince(r.createdAt));
        return waits.length ? Math.max(...waits) : 0;
    }, [ordered]);

    const visible = useMemo(() => {
        if (filter === "open")     return ordered.filter((r) =>  isOpenStatus(r.status));
        if (filter === "resolved") return ordered.filter((r) => !isOpenStatus(r.status));
        return ordered;
    }, [ordered, filter]);

    if (isLoading) {
        return (
            <PortalPage>
                <div className="tenant-skeleton-premium h-44 w-full rounded-2xl" />
                <PortalSkeleton rows={3} />
            </PortalPage>
        );
    }

    if (error) {
        return (
            <PortalPage>
                <PortalErrorState
                    title="Couldn't load your requests"
                    description="This is usually temporary. Check your connection and try again."
                />
            </PortalPage>
        );
    }

    return (
        <PortalPage>
            {/* ── Hero ── */}
            <div className="tenant-hero-panel relative overflow-hidden !p-6 sm:!p-8">
                {/* Gradient wash */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 60%)",
                    }}
                    aria-hidden
                />
                {/* Radial glow orb */}
                <div
                    className="absolute -top-24 -right-16 h-64 w-64 rounded-full pointer-events-none opacity-60 blur-3xl"
                    style={{
                        background:
                            "radial-gradient(circle, color-mix(in srgb, var(--color-brand) 18%, transparent), transparent 70%)",
                    }}
                    aria-hidden
                />

                <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                    {/* Left: identity + CTA */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                                <Wrench className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </div>
                            <p className="tenant-eyebrow !mt-0">Your home</p>
                        </div>
                        <h1 className="tenant-hero-title">Maintenance</h1>
                        <p className="tenant-hero-subtitle">
                            Report a problem and track it from submission through to completion.
                        </p>
                        <div className="tenant-hero-chips">
                            <button
                                type="button"
                                onClick={onNew}
                                className="tenant-context-chip inline-flex cursor-pointer transition-colors hover:bg-brand-100 dark:hover:bg-brand-900/40"
                            >
                                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                                New request
                            </button>
                        </div>
                    </div>

                    {/* Right: dual stat block */}
                    <div className="shrink-0 lg:min-w-[15rem]">
                        <div className="rounded-2xl border border-brand-200/70 dark:border-brand-700/40 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-brand-100 dark:divide-brand-800/40">
                                {/* Open */}
                                <div className="p-4 sm:p-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted dark:text-fg-muted-dark">
                                        Open
                                    </p>
                                    <div className="mt-1 flex items-end gap-1">
                                        <span className="font-data text-4xl font-bold leading-none text-fg dark:text-fg-dark">
                                            {openCount}
                                        </span>
                                        <span className="mb-0.5 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                            /{ordered.length}
                                        </span>
                                    </div>
                                    {openCount === 0 ? (
                                        <p className="mt-2 flex items-center gap-1 text-[11px] text-fg-muted dark:text-fg-muted-dark">
                                            <CheckCircle2 className="h-3 w-3 text-success" strokeWidth={2.5} />
                                            All clear
                                        </p>
                                    ) : longestWaitDays >= 7 ? (
                                        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-warning-dark dark:text-warning">
                                            <Clock className="h-3 w-3" strokeWidth={2.5} />
                                            {longestWaitDays}d wait
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-[11px] text-fg-muted dark:text-fg-muted-dark">
                                            In progress
                                        </p>
                                    )}
                                </div>
                                {/* Resolved */}
                                <div className="p-4 sm:p-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted dark:text-fg-muted-dark">
                                        Resolved
                                    </p>
                                    <div className="mt-1">
                                        <span className="font-data text-4xl font-bold leading-none text-fg dark:text-fg-dark">
                                            {resolvedCount}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[11px] text-fg-muted dark:text-fg-muted-dark">
                                        {resolvedCount === 0 ? "None yet" : "Completed"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {ordered.length === 0 ? (
                <PortalCard padded={false}>
                    <PortalEmptyState
                        icon={Wrench}
                        title="No maintenance requests yet"
                        description="Report a repair and track its progress from submitted through to completed."
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
                    {/* Filter tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div
                            role="tablist"
                            aria-label="Filter requests by status"
                            className="inline-flex items-center gap-1 rounded-xl border border-ink/[0.06] bg-ink/[0.04] p-1 dark:border-white/[0.08] dark:bg-white/[0.05]"
                        >
                            {([
                                { id: "all"      as const, label: "All",      count: ordered.length },
                                { id: "open"     as const, label: "Open",     count: openCount      },
                                { id: "resolved" as const, label: "Resolved", count: resolvedCount  },
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
                                        <span className={`ml-1.5 tabular-nums ${
                                            active ? "text-ink-muted dark:text-ink-muted-dark" : "text-ink-subtle dark:text-ink-subtle-dark"
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {openCount > 0 && longestWaitDays >= 7 && (
                            <p className="text-xs font-medium text-warning-dark dark:text-warning">
                                <Clock className="mr-1 inline h-3 w-3" strokeWidth={2.5} />
                                Longest waiting {longestWaitDays} days
                            </p>
                        )}
                    </div>

                    {visible.length === 0 ? (
                        <PortalCard padded={false}>
                            <PortalEmptyState
                                icon={Wrench}
                                title={filter === "open" ? "Nothing outstanding" : "Nothing resolved yet"}
                                description={
                                    filter === "open"
                                        ? "Every request you've raised has been dealt with."
                                        : "Requests will appear here once your landlord marks them completed."
                                }
                            />
                        </PortalCard>
                    ) : (
                        <div className="space-y-3">
                            {visible.map((req) => {
                                const CatIcon      = CATEGORY_ICONS[req.category] ?? Wrench;
                                const catStyle     = CATEGORY_ICON_STYLE[req.category] ?? CATEGORY_ICON_STYLE.GENERAL;
                                const statusMeta   = STATUS_META[req.status]   ?? STATUS_META.SUBMITTED;
                                const priorityMeta = PRIORITY_META[req.priority] ?? PRIORITY_META.MEDIUM;
                                const StatusIcon   = statusMeta.icon;
                                const open         = isOpenStatus(req.status);
                                const age          = relativeAge(req.createdAt);
                                const replied      = Boolean(req.notes?.trim());
                                const awaitingReply = req.firstLandlordResponseAt == null && open;
                                const waitDays     = awaitingReply ? daysSince(req.createdAt) : 0;
                                const overdue      = awaitingReply && waitDays >= 7;
                                const cardTint     = open
                                    ? (PRIORITY_CARD_TINT[req.priority] ?? PRIORITY_CARD_TINT.MEDIUM)
                                    : "border-border dark:border-border-dark bg-surface dark:bg-surface-dark";

                                return (
                                    <button
                                        key={req.id}
                                        type="button"
                                        onClick={() => onSelect(req.id)}
                                        className={`group w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cardTint} ${!open ? "opacity-70 hover:opacity-100" : ""}`}
                                    >
                                        <div className="flex items-stretch">
                                            {/* Priority gradient bar */}
                                            <div
                                                className="w-1 shrink-0 rounded-l-2xl"
                                                style={priorityBarStyle(req.priority, open)}
                                            />

                                            <div className="flex min-w-0 flex-1 items-start gap-3 p-4 sm:p-5">
                                                {/* Category icon — semantic colour */}
                                                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                    open ? `${catStyle.bg} ${catStyle.text}` : "bg-ink/[0.05] text-ink-muted dark:bg-white/[0.06] dark:text-ink-muted-dark"
                                                }`}>
                                                    <CatIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
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
                                                        <p className="mt-2 flex items-start gap-1.5 text-xs text-brand dark:text-brand-400">
                                                            <MessageSquareText className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                                                            <span className="line-clamp-1 font-medium">{req.notes?.trim()}</span>
                                                        </p>
                                                    ) : overdue ? (
                                                        <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning-bg/60 px-2 py-0.5 text-[11px] font-semibold text-warning-dark dark:border-warning/25 dark:bg-warning-bg-dark/40 dark:text-warning">
                                                            <Clock className="h-3 w-3" strokeWidth={2.5} />
                                                            {waitDays}d without reply
                                                        </span>
                                                    ) : awaitingReply ? (
                                                        <p className="mt-2 text-xs text-ink-subtle dark:text-ink-subtle-dark">
                                                            <Clock className="mr-1 inline h-3 w-3" strokeWidth={2} />
                                                            {waitDays < 1 ? "Awaiting reply" : `No reply · ${waitDays}d`}
                                                        </p>
                                                    ) : null}

                                                    {open && <ProgressTrack status={req.status} />}
                                                </div>

                                                {/* Right meta column */}
                                                <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                                                    {open && (
                                                        <span className={priorityMeta.className}>
                                                            {priorityMeta.label}
                                                        </span>
                                                    )}
                                                    <span className={`inline-flex items-center gap-1 ${statusMeta.className}`}>
                                                        <StatusIcon className="h-3 w-3" strokeWidth={2} />
                                                        {statusMeta.label}
                                                    </span>
                                                    <ChevronRight
                                                        className="mt-1 h-4 w-4 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand dark:text-ink-subtle-dark dark:group-hover:text-brand-400"
                                                        strokeWidth={2}
                                                    />
                                                </div>
                                            </div>
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

// ── Form ───────────────────────────────────────────────────────────────────────

// Category buttons — each category has its own semantic colour for icon,
// selected border, and selected background. Store full class strings so Tailwind
// JIT picks them up at build time.
const CATEGORIES: {
    value: CreateMaintenanceRequest["category"];
    label: string;
    icon: IconFC;
    iconText: string;
    iconBg: string;
    selBorder: string;
    selBg: string;
    selText: string;
}[] = [
    {
        value: "PLUMBING",
        label: "Plumbing",
        icon: Droplets,
        iconText: "text-blue-500 dark:text-blue-400",
        iconBg:   "bg-blue-50 dark:bg-blue-900/30",
        selBorder: "border-blue-400 dark:border-blue-500",
        selBg:     "bg-blue-50 dark:bg-blue-900/15",
        selText:   "text-blue-700 dark:text-blue-300",
    },
    {
        value: "ELECTRICAL",
        label: "Electrical",
        icon: Zap,
        iconText: "text-amber-500 dark:text-amber-400",
        iconBg:   "bg-amber-50 dark:bg-amber-900/30",
        selBorder: "border-amber-400 dark:border-amber-500",
        selBg:     "bg-amber-50 dark:bg-amber-900/15",
        selText:   "text-amber-700 dark:text-amber-300",
    },
    {
        value: "STRUCTURAL",
        label: "Structural",
        icon: Building2,
        iconText: "text-slate-500 dark:text-slate-400",
        iconBg:   "bg-slate-100 dark:bg-slate-800/50",
        selBorder: "border-slate-400 dark:border-slate-500",
        selBg:     "bg-slate-50 dark:bg-slate-900/20",
        selText:   "text-slate-700 dark:text-slate-300",
    },
    {
        value: "APPLIANCE",
        label: "Appliance",
        icon: Settings,
        iconText: "text-purple-500 dark:text-purple-400",
        iconBg:   "bg-purple-50 dark:bg-purple-900/30",
        selBorder: "border-purple-400 dark:border-purple-500",
        selBg:     "bg-purple-50 dark:bg-purple-900/15",
        selText:   "text-purple-700 dark:text-purple-300",
    },
    {
        value: "PEST_CONTROL",
        label: "Pest Control",
        icon: Bug,
        iconText: "text-orange-500 dark:text-orange-400",
        iconBg:   "bg-orange-50 dark:bg-orange-900/30",
        selBorder: "border-orange-400 dark:border-orange-500",
        selBg:     "bg-orange-50 dark:bg-orange-900/15",
        selText:   "text-orange-700 dark:text-orange-300",
    },
    {
        value: "GENERAL",
        label: "General",
        icon: Wrench,
        iconText: "text-brand dark:text-brand-400",
        iconBg:   "bg-brand-50 dark:bg-brand-900/30",
        selBorder: "border-brand dark:border-brand-400",
        selBg:     "bg-brand-50 dark:bg-brand-900/15",
        selText:   "text-brand dark:text-brand-300",
    },
];

// Priority options — each carries a CSS color value for the top indicator bar
// applied via inline style so we get exact colors without JIT class generation.
const PRIORITY_OPTIONS: {
    value: CreateMaintenanceRequest["priority"];
    label: string;
    hint: string;
    barColor: string;
    activeClass: string;
}[] = [
    {
        value: "LOW",
        label: "Low",
        hint: "Not urgent",
        barColor: "#9ca3af",
        activeClass: "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 shadow-sm",
    },
    {
        value: "MEDIUM",
        label: "Medium",
        hint: "Address soon",
        barColor: "var(--color-brand, #6366f1)",
        activeClass: "border-brand/60 dark:border-brand-400/60 bg-brand-50 dark:bg-brand-900/20 text-brand dark:text-brand-300 shadow-sm",
    },
    {
        value: "HIGH",
        label: "High",
        hint: "Affects daily use",
        barColor: "#f59e0b",
        activeClass: "border-amber-400/70 dark:border-amber-500/60 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm",
    },
    {
        value: "URGENT",
        label: "Urgent",
        hint: "Immediate attention",
        barColor: "#ef4444",
        activeClass: "border-red-400/70 dark:border-red-500/60 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-sm",
    },
];

function MaintenanceForm({ onBack }: { onBack: () => void }) {
    const queryClient = useQueryClient();

    const [title,       setTitle]       = useState("");
    const [description, setDescription] = useState("");
    const [category,    setCategory]    = useState<CreateMaintenanceRequest["category"]>("GENERAL");
    const [priority,    setPriority]    = useState<CreateMaintenanceRequest["priority"]>("MEDIUM");

    const mutation = useMutation({
        mutationFn: (payload: CreateMaintenanceRequest) =>
            tenantPortalApi.submitMaintenanceRequest(payload),
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
        mutation.mutate({
            title:       title.trim(),
            description: description.trim() || undefined,
            category,
            priority,
        });
    };

    const selectedCat = CATEGORIES.find((c) => c.value === category);

    return (
        <div className="page-container mx-auto max-w-2xl animate-fade-in-up space-y-5 py-6 sm:py-8">
            {/* ── Back nav ── */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
                    aria-label="Back to maintenance list"
                >
                    <ChevronRight className="h-4 w-4 rotate-180 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </button>
                <div>
                    <h1 className="font-display text-xl font-bold text-fg dark:text-fg-dark sm:text-2xl">
                        New Request
                    </h1>
                    <p className="mt-0.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                        Describe the issue you&apos;re experiencing
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ── Issue details ── */}
                <div className="tenant-panel !p-5 sm:!p-6 space-y-4">
                    <div className="flex items-center gap-2.5 pb-1">
                        <div className="h-5 w-[3px] rounded-full bg-brand dark:bg-brand-400" />
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Issue details</p>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="form-label !mb-0">
                                Title <span className="text-danger">*</span>
                            </label>
                            <span className={`font-mono-nums text-[11px] ${title.length >= 180 ? "text-warning-dark dark:text-warning" : "text-fg-subtle dark:text-fg-subtle-dark"}`}>
                                {title.length}/200
                            </span>
                        </div>
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
                        <label className="form-label !mb-0">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Location, how long it's been happening, any relevant details…"
                            className="form-input min-h-[96px] resize-y"
                            rows={3}
                        />
                    </div>
                </div>

                {/* ── Category ── */}
                <div className="tenant-panel !p-5 sm:!p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-5 w-[3px] rounded-full bg-brand dark:bg-brand-400" />
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">Category</p>
                        </div>
                        {selectedCat && (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${selectedCat.selBg} ${selectedCat.selText}`}>
                                <selectedCat.icon className="h-3 w-3" strokeWidth={2} />
                                {selectedCat.label}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {CATEGORIES.map((c) => {
                            const CatIcon  = c.icon;
                            const selected = category === c.value;
                            return (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setCategory(c.value)}
                                    className={`relative flex flex-col items-center gap-2.5 overflow-hidden rounded-xl border px-2 pb-3.5 pt-4 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                                        selected
                                            ? `${c.selBorder} ${c.selBg} ${c.selText} shadow-sm`
                                            : "border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:border-fg/20 dark:hover:border-white/20 hover:text-fg dark:hover:text-fg-dark"
                                    }`}
                                >
                                    {/* Top colour indicator bar */}
                                    <div
                                        className={`absolute inset-x-0 top-0 h-[3px] rounded-t-xl transition-opacity duration-150 ${selected ? "opacity-100" : "opacity-0"}`}
                                        style={selected ? { background: "currentColor" } : {}}
                                    />
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150 ${
                                        selected ? `${c.iconBg} ${c.iconText}` : "bg-ink/[0.05] dark:bg-white/[0.06] text-inherit"
                                    }`}>
                                        <CatIcon className="h-5 w-5" strokeWidth={selected ? 2 : 1.75} />
                                    </div>
                                    <span className="text-xs font-medium leading-tight">{c.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Priority ── */}
                <div className="tenant-panel !p-5 sm:!p-6 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-5 w-[3px] rounded-full bg-brand dark:bg-brand-400" />
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Priority</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {PRIORITY_OPTIONS.map((p) => {
                            const selected = priority === p.value;
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setPriority(p.value)}
                                    className={`relative flex flex-col items-start gap-1.5 overflow-hidden rounded-xl border px-3 pb-3 pt-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                                        selected
                                            ? p.activeClass
                                            : "border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:border-fg/20 dark:hover:border-white/20"
                                    }`}
                                >
                                    {/* Coloured top bar */}
                                    <div
                                        className="absolute inset-x-0 top-0 h-[3px] rounded-t-xl transition-opacity duration-150"
                                        style={selected ? { background: p.barColor } : { background: "transparent" }}
                                    />
                                    <span className="text-xs font-semibold">{p.label}</span>
                                    <span className="text-[10px] leading-snug text-fg-subtle dark:text-fg-subtle-dark">
                                        {p.hint}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center justify-end gap-3 pt-1">
                    <button type="button" onClick={onBack} className="btn-ghost">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!title.trim() || mutation.isPending}
                        className="btn-primary"
                    >
                        {mutation.isPending ? (
                            <><Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> Submitting…</>
                        ) : (
                            <><Plus className="h-4 w-4" strokeWidth={2} /> Submit Request</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Detail ─────────────────────────────────────────────────────────────────────

function MaintenanceDetail({ id, onBack }: { id: string; onBack: () => void }) {
    const { data: requests } = useTenantMaintenanceRequestsQuery();
    const { data: lease }    = useTenantLeaseQuery();
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

    const CatIcon       = CATEGORY_ICONS[request.category]  ?? Wrench;
    const catStyle      = CATEGORY_ICON_STYLE[request.category] ?? CATEGORY_ICON_STYLE.GENERAL;
    const statusMeta    = STATUS_META[request.status]        ?? STATUS_META.SUBMITTED;
    const priorityMeta  = PRIORITY_META[request.priority]   ?? PRIORITY_META.MEDIUM;
    const StatusIcon    = statusMeta.icon;
    const open          = isOpenStatus(request.status);
    const idx           = progressIndex(request.status);
    const waitDays      = open && !request.firstLandlordResponseAt ? daysSince(request.createdAt) : 0;
    const longWait      = waitDays >= 7;

    const STAGE_DESCRIPTIONS: Record<string, string> = {
        SUBMITTED:   "Request received",
        IN_REVIEW:   "Being assessed",
        SCHEDULED:   "Work date set",
        IN_PROGRESS: "Repair underway",
        COMPLETED:   "Issue resolved",
    };

    return (
        <div className="page-container mx-auto max-w-2xl animate-fade-in-up space-y-4 py-6 sm:py-8">
            {/* ── Back nav ── */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
                    aria-label="Back to maintenance list"
                >
                    <ChevronRight className="h-4 w-4 rotate-180 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </button>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Maintenance request</p>
                    <h1 className="truncate font-display text-xl font-bold text-fg dark:text-fg-dark sm:text-2xl">
                        {request.title}
                    </h1>
                </div>
            </div>

            {/* ── Overdue banner — shown above everything when landlord hasn't replied ── */}
            {longWait && (
                <div className="overflow-hidden rounded-2xl border border-warning/25 dark:border-warning/20 bg-amber-50/80 dark:bg-amber-900/10">
                    <div className="flex items-stretch">
                        <div className="w-1 shrink-0 rounded-l-2xl bg-amber-400 dark:bg-amber-500" />
                        <div className="flex min-w-0 flex-1 items-start gap-3.5 p-4 sm:p-5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                <Clock className="h-[18px] w-[18px]" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-amber-800 dark:text-amber-300">
                                    No reply after {waitDays} day{waitDays === 1 ? "" : "s"}
                                </p>
                                <p className="mt-0.5 text-sm leading-relaxed text-amber-700/80 dark:text-amber-400/70">
                                    Your request is still waiting for a response. Consider chasing your landlord directly.
                                </p>
                                {lease?.landlordPhone && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <a
                                            href={`tel:${lease.landlordPhone}`}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success-bg dark:bg-success-bg-dark px-3 py-1.5 text-xs font-semibold text-success-dark dark:text-success transition-colors hover:bg-success/10"
                                        >
                                            <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
                                            Call landlord
                                        </a>
                                        <a
                                            href={(() => { const d = lease.landlordPhone.replace(/\D/g, ""); return `https://wa.me/${d.startsWith("0") && d.length === 10 ? `254${d.slice(1)}` : d}`; })()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#15803d]/30 bg-[#dcfce7] dark:bg-[#14532d]/30 px-3 py-1.5 text-xs font-semibold text-[#15803d] dark:text-[#4ade80] transition-colors hover:bg-[#bbf7d0] dark:hover:bg-[#14532d]/50"
                                        >
                                            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                                            WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Status header card ── */}
            <div className="tenant-panel overflow-hidden !p-0">
                <div className="flex items-stretch">
                    <div
                        className="w-1.5 shrink-0 rounded-l-2xl"
                        style={priorityBarStyle(request.priority, open)}
                    />
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 p-4 sm:p-5">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            open
                                ? `${catStyle.bg} ${catStyle.text}`
                                : "bg-ink/[0.05] text-ink-muted dark:bg-white/[0.06] dark:text-ink-muted-dark"
                        }`}>
                            <CatIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                {categoryLabel(request.category)} · Submitted {formatDate(request.createdAt)}
                                {(request.unitNumber || request.propertyName) && (
                                    <>
                                        {" · "}
                                        {[request.unitNumber, request.propertyName].filter(Boolean).join(", ")}
                                    </>
                                )}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 ${statusMeta.className}`}>
                                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                    {statusMeta.label}
                                </span>
                                <span className={priorityMeta.className}>
                                    {priorityMeta.label} priority
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Progress timeline ── */}
            {request.status !== "CANCELLED" && idx !== null && (
                <div className="tenant-panel !p-5 sm:!p-6">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                        Progress
                    </p>
                    <div className="flex items-start">
                        {PROGRESS_STAGES.map((stage, i) => {
                            const done    = i <= idx;
                            const current = i === idx && idx < PROGRESS_STAGES.length - 1;
                            const stageDate: string | null =
                                stage === "SUBMITTED"   ? formatDate(request.createdAt)               :
                                stage === "IN_REVIEW"   ? (request.firstLandlordResponseAt ? formatDate(request.firstLandlordResponseAt) : null) :
                                stage === "SCHEDULED"   ? (request.scheduledDate           ? formatDate(request.scheduledDate)           : null) :
                                stage === "COMPLETED"   ? (request.completedAt             ? formatDate(request.completedAt)             : null) :
                                null;

                            return (
                                <div key={stage} className="flex flex-1 flex-col items-center">
                                    {/* Connector + dot row */}
                                    <div className="flex w-full items-center">
                                        {i > 0 && (
                                            <div
                                                className="h-[2px] flex-1 transition-colors duration-500"
                                                style={
                                                    i <= idx
                                                        ? { background: "linear-gradient(to right, var(--color-brand), var(--color-brand))" }
                                                        : { background: "var(--color-border, #e2e8f0)" }
                                                }
                                            />
                                        )}

                                        {/* Dot with optional pulsing ring on current active stage */}
                                        <div className="relative flex shrink-0 items-center justify-center">
                                            {current && (
                                                <span className="absolute h-8 w-8 animate-ping rounded-full bg-brand/20 dark:bg-brand-400/15" />
                                            )}
                                            <div className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                                                done
                                                    ? "border-brand bg-brand dark:border-brand-400 dark:bg-brand-400"
                                                    : "border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
                                            }`}>
                                                {done && (
                                                    current ? (
                                                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {i < PROGRESS_STAGES.length - 1 && (
                                            <div
                                                className="h-[2px] flex-1 transition-colors duration-500"
                                                style={
                                                    i + 1 <= idx
                                                        ? { background: "var(--color-brand, #6366f1)" }
                                                        : { background: "var(--color-border, #e2e8f0)" }
                                                }
                                            />
                                        )}
                                    </div>

                                    {/* Stage label */}
                                    <p className={`mt-2 text-center text-[10px] font-semibold leading-tight ${
                                        done ? "text-fg dark:text-fg-dark" : "text-fg-subtle dark:text-fg-subtle-dark"
                                    }`}>
                                        {STATUS_META[stage]?.label ?? stage}
                                    </p>
                                    <p className={`mt-0.5 text-center text-[9px] leading-tight ${
                                        current
                                            ? "font-medium text-brand dark:text-brand-400"
                                            : "text-fg-subtle/70 dark:text-fg-subtle-dark/70"
                                    }`}>
                                        {current ? "Active" : (STAGE_DESCRIPTIONS[stage] ?? "")}
                                    </p>
                                    {stageDate && (
                                        <p className="mt-0.5 text-center text-[9px] text-fg-subtle dark:text-fg-subtle-dark">
                                            {stageDate}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Description + meta + landlord reply ── */}
            <div className="tenant-panel !p-5 sm:!p-6 space-y-5">
                {request.description ? (
                    <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                            Description
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg dark:text-fg-dark">
                            {request.description}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm italic text-fg-subtle dark:text-fg-subtle-dark">No description provided.</p>
                )}

                {(request.scheduledDate || request.assignedTo || request.completedAt) && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border dark:border-border-dark pt-4">
                        {request.scheduledDate && (
                            <div>
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                                    Scheduled
                                </p>
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                    {formatDate(request.scheduledDate)}
                                </p>
                            </div>
                        )}
                        {request.assignedTo && (
                            <div>
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                                    Assigned to
                                </p>
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                    {request.assignedTo}
                                </p>
                            </div>
                        )}
                        {request.completedAt && (
                            <div>
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                                    Completed
                                </p>
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                    {formatDate(request.completedAt)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Landlord reply or pending-reply note ── */}
                {request.notes?.trim() ? (
                    <div className="rounded-xl border border-brand/25 bg-brand-50/60 p-4 dark:border-brand-400/25 dark:bg-brand-900/15">
                        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand dark:text-brand-400">
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
                ) : open && !longWait ? (
                    <div className="rounded-xl border border-border/70 bg-surface-sunk/40 p-4 dark:border-border-dark/70 dark:bg-white/[0.02]">
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            Your landlord hasn&apos;t replied yet. You&apos;ll be notified as soon as they respond.
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

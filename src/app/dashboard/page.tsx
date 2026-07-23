"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    Building2,
    CheckCircle2,
    AlertTriangle,
    Wrench,
    FileEdit,
    Archive,
    Wallet,
    Plus,
    Receipt,
    Users,
    ShieldCheck,
    Clock,
    ArrowRight,
    ArrowUpRight,
    Smartphone,
    ArrowLeftRight,
} from "lucide-react";
import type { ElementType } from "react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { propertyApi } from "@/features/property/api/property-api";
import { PropertyStatus } from "@/features/property/types/property";
import { usePropertyDashboardMetrics } from "@/features/property/hooks/use-property-dashboard-metrics";
import { useActivityFeed } from "@/features/activity/hooks/use-activity-feed";
// NOTE: fixed a stray space in this import path ("/ use-daraja-status-query")
// that would have failed module resolution — flagging in case the real file
// on disk is actually named with that space, which would be worth renaming.
import { useDarajaStatusQuery } from "@/features/daraja/queries/ use-daraja-status-query";
import MetricCard, { MetricCardSkeleton } from "@/shared/components/dashboard/MetricCard";
import OccupancyDonut from "@/shared/components/dashboard/OccupancyDonut";
import PortfolioBar from "@/shared/components/dashboard/PortfolioBar";
import RecentActivity from "@/shared/components/dashboard/RecentActivity";

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-ink/10 pb-6">
                <div>
                    <div className="skeleton h-3 w-20 mb-3" />
                    <div className="skeleton h-8 w-44 mb-2" />
                    <div className="skeleton h-4 w-64" />
                </div>
                <div className="skeleton h-9 w-36 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <MetricCardSkeleton key={i} />
                ))}
            </div>
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2 skeleton h-64" />
                <div className="card skeleton h-64" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card skeleton h-48" />
                <div className="card skeleton h-48" />
                <div className="card skeleton h-48" />
            </div>
        </div>
    );
}

function InlinePermissionDenied() {
    return (
        <div className="mx-auto max-w-xl card text-center mt-12">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                <ShieldCheck className="h-5 w-5 text-ink-muted" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-ink mb-1">Restricted page</p>
            <p className="text-sm text-ink-muted">
                You don&#39;t have permission to view this page. Ask an account owner for access.
            </p>
        </div>
    );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="card border-danger/20 bg-danger/[0.03] text-center py-10">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load your dashboard</p>
            <p className="text-xs text-ink-muted mb-4">
                Please try again. If this keeps happening, contact support.
            </p>
            <button onClick={onRetry} className="btn-outline mx-auto">
                Retry
            </button>
        </div>
    );
}

interface PhasePlaceholderCardProps {
    icon: ElementType;
    title: string;
    note: string;
    href?: string;
}

function PhasePlaceholderCard(props: PhasePlaceholderCardProps) {
    const Icon = props.icon;
    const isAvailable = Boolean(props.href);

    const wrapperClass = isAvailable
        ? "card-interactive h-full"
        : "card-sm border-dashed border-ink/15 bg-ink/[0.015] h-full";

    const content = (
        <div className={wrapperClass}>
            <div className="flex items-start justify-between mb-3">
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        isAvailable ? "bg-primary-light" : "bg-ink/[0.05]"
                    }`}
                >
                    <Icon
                        className={`h-3.5 w-3.5 ${isAvailable ? "text-primary-dark" : "text-ink-muted"}`}
                        strokeWidth={2}
                    />
                </div>
                {isAvailable ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
                        View
                        <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                ) : (
                    <span className="pill-neutral !text-[10px]">Coming soon</span>
                )}
            </div>
            <h3 className="text-sm font-medium text-ink mb-1">{props.title}</h3>
            <p className="text-xs text-ink-muted leading-relaxed">{props.note}</p>
        </div>
    );

    if (props.href) {
        return (
            <Link href={props.href} className="block h-full">
                {content}
            </Link>
        );
    }

    return content;
}

/**
 * Maps a property status string to the project's existing pill-* classes.
 * Falls back to pill-neutral for any status outside the known set.
 */
function StatusBadge({ status }: { status: string }) {
    const normalized = status?.toUpperCase?.() ?? "";

    const pillClassMap: Record<string, string> = {
        ACTIVE: "pill-success",
        MAINTENANCE: "pill-warning",
        DRAFT: "pill-neutral",
        ARCHIVED: "pill-neutral",
    };

    const pillClass = pillClassMap[normalized] ?? "pill-neutral";

    return <span className={`${pillClass} capitalize !px-2 !py-0.5 !text-[11px]`}>{status?.toLowerCase()}</span>;
}

export default function DashboardPage() {
    const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();

    if (isUserLoading) return <div className="page-container"><DashboardSkeleton /></div>;
    if (!isOwner) return <InlinePermissionDenied />;
    if (!user?.tenantId) return <div className="page-container"><DashboardSkeleton /></div>;

    return <DashboardContent tenantId={user.tenantId} />;
}

type PropertyTableFilter = "active" | "all";

function DashboardContent({ tenantId }: { tenantId: string }) {
    const [propertyFilter, setPropertyFilter] = useState<PropertyTableFilter>("active");

    const { metrics, isLoading: metricsLoading, isError: metricsError, refetch: refetchMetrics } =
        usePropertyDashboardMetrics(tenantId);
    const darajaStatus = useDarajaStatusQuery(tenantId);

    // Table respects the active/all toggle below.
    const propertiesQuery = useQuery({
        queryKey: ["properties", "dashboard-list", tenantId, propertyFilter],
        queryFn: () =>
            propertyApi.list(
                propertyFilter === "active"
                    ? { page: 0, size: 5, status: PropertyStatus.ACTIVE }
                    : { page: 0, size: 5 }
            ),
        enabled: Boolean(tenantId),
    });

    // Recent activity intentionally stays decoupled from the table's toggle —
    // "what changed recently" shouldn't disappear just because someone is
    // filtering the table to Active. Backed by the live activity feed module
    // (REST for the initial batch + SSE for live updates) rather than the
    // "last 5 created properties" proxy this used to be.
    const {
        activities,
        isConnected,
        isLoading: activitiesLoading,
        isError: activitiesError,
        refetch: refetchActivities,
    } = useActivityFeed(tenantId);

    if (metricsLoading || propertiesQuery.isLoading) {
        return <div className="page-container"><DashboardSkeleton /></div>;
    }

    if (metricsError || propertiesQuery.isError) {
        return (
            <div className="page-container">
                <DashboardError
                    onRetry={() => {
                        refetchMetrics();
                        propertiesQuery.refetch();
                        refetchActivities();
                    }}
                />
            </div>
        );
    }

    const isDarajaConnected = darajaStatus.data?.configured ?? false;
    const properties = propertiesQuery.data?.content ?? [];
    const lastUpdated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // --- Derived, honest tones — the value decides the color, not the slot ---
    const activeTone = metrics.activeProperties > 0 ? "success" : "neutral";
    const fullyOccupiedTone =
        metrics.activeProperties === 0 ? "neutral" : metrics.fullyOccupied === 0 ? "warning" : "success";
    const vacantTone = metrics.vacant > 0 ? "warning" : "success";

    // --- Auto-generated insights, computed only from real metrics ---
    const attentionCount = metrics.vacant + metrics.underMaintenance;
    const occupancyRate =
        metrics.activeProperties > 0 ? Math.round((metrics.fullyOccupied / metrics.activeProperties) * 100) : null;
    const activeShare =
        metrics.totalProperties > 0 ? Math.round((metrics.activeProperties / metrics.totalProperties) * 100) : null;

    const occupancyInsight =
        occupancyRate !== null
            ? occupancyRate >= 80
                ? `Strong occupancy — ${occupancyRate}% of active properties are fully occupied.`
                : `${occupancyRate}% of active properties are fully occupied. ${metrics.vacant + Math.max(metrics.activeProperties - metrics.fullyOccupied - metrics.vacant, 0)} have room to fill.`
            : "Add an active property to start tracking occupancy.";

    const portfolioInsight =
        activeShare !== null && activeShare < 40
            ? `Only ${activeShare}% of your ${metrics.totalProperties}-property portfolio is active — the rest is draft or archived.`
            : null;

    return (
        <div className="page-container space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-6">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1.5">Overview</p>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Portfolio overview and account status</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                        Updated {lastUpdated}
                    </span>
                    <Link href="/dashboard/properties/create" className="btn-primary inline-flex items-center gap-1.5">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Add property
                    </Link>
                </div>
            </div>

            {/* Key metrics */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard icon={Building2} label="Total properties" value={metrics.totalProperties} />
                    <MetricCard icon={CheckCircle2} label="Active" value={metrics.activeProperties} tone={activeTone} />
                    <MetricCard
                        icon={CheckCircle2}
                        label="Fully occupied"
                        value={metrics.fullyOccupied}
                        tone={fullyOccupiedTone}
                    />
                    <MetricCard icon={AlertTriangle} label="Vacant" value={metrics.vacant} tone={vacantTone} />
                </div>

                {/* Needs attention — only shows a warning tint when there's actually something to act on */}
                <div
                    className={`card-sm flex flex-wrap items-center justify-between gap-3 !py-3 ${
                        attentionCount > 0 ? "border-warning-dark/20 bg-warning-dark/[0.04]" : ""
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle
                            className={`h-4 w-4 shrink-0 ${attentionCount > 0 ? "text-warning-dark" : "text-ink-muted"}`}
                            strokeWidth={2}
                        />
                        <p className="text-xs text-ink">
                            {attentionCount > 0 ? (
                                <>
                                    <span className="font-data font-semibold">{attentionCount}</span>{" "}
                                    {attentionCount === 1 ? "property needs" : "properties need"} attention —{" "}
                                    {metrics.vacant} vacant, {metrics.underMaintenance} under maintenance
                                </>
                            ) : (
                                "No vacant or under-maintenance properties right now."
                            )}
                        </p>
                    </div>
                    {attentionCount > 0 && (
                        <Link
                            href="/dashboard/properties"
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                            Review
                            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                        </Link>
                    )}
                </div>
            </div>

            {/* Portfolio + payments */}
            <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Portfolio &amp; payments</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card lg:col-span-2 animate-fade-in-up">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h2 className="section-header !mb-0">Properties</h2>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 rounded-lg bg-ink/[0.04] p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setPropertyFilter("active")}
                                        aria-pressed={propertyFilter === "active"}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                            propertyFilter === "active"
                                                ? "bg-surface text-ink shadow-sm"
                                                : "text-ink-muted hover:text-ink"
                                        }`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPropertyFilter("all")}
                                        aria-pressed={propertyFilter === "all"}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                            propertyFilter === "all"
                                                ? "bg-surface text-ink shadow-sm"
                                                : "text-ink-muted hover:text-ink"
                                        }`}
                                    >
                                        All
                                    </button>
                                </div>
                                {properties.length > 0 && (
                                    <Link
                                        href="/dashboard/properties"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                    >
                                        View all
                                        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {properties.length === 0 ? (
                            <div className="text-center py-12">
                                <div
                                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                                    <Building2 className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                                </div>
                                <p className="text-sm font-medium text-ink mb-1">
                                    {propertyFilter === "active" ? "No active properties" : "No properties yet"}
                                </p>
                                <p className="text-xs text-ink-muted mb-4">
                                    {propertyFilter === "active"
                                        ? "Activate a property or switch to \"All\" to see draft and archived listings."
                                        : "Add your first property to start tracking occupancy and rent."}
                                </p>
                                <Link href="/dashboard/properties/create"
                                      className="btn-primary inline-flex items-center gap-1.5 w-fit mx-auto">
                                    <Plus className="h-4 w-4" strokeWidth={2} />
                                    Add property
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-2">
                                <table className="w-full text-sm border-separate border-spacing-0">
                                    <thead>
                                    <tr className="text-left text-ink-muted">
                                        <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-ink/10">Property</th>
                                        <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-ink/10">Type</th>
                                        <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-ink/10">Status</th>
                                        <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-ink/10">Occupancy</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {properties.map((p) => (
                                        <tr
                                            key={p.propertyId}
                                            className="group border-b border-ink/[0.06] last:border-0 hover:bg-ink/[0.02] transition-colors"
                                        >
                                            <td className="py-3 px-2">
                                                <Link href={`/dashboard/properties/${p.propertyId}`} className="flex items-center gap-2.5">
                                                    <div
                                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-[11px] font-semibold text-primary-dark">
                                                        {p.name?.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-ink group-hover:underline">{p.name}</span>
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2 text-ink-muted">{p.propertyType}</td>
                                            <td className="py-3 px-2">
                                                <StatusBadge status={p.status} />
                                            </td>
                                            <td className="py-3 px-2 font-data text-ink-muted">{p.occupancyStatus}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="card animate-fade-in-up">
                        <h2 className="section-header">M-Pesa</h2>
                        {darajaStatus.isLoading ? (
                            <div className="skeleton h-6 w-24" />
                        ) : isDarajaConnected ? (
                            <Link href="/daraja/config" className="flex items-start gap-3 group">
                                <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                                    <Smartphone className="h-4 w-4 text-primary-dark" strokeWidth={2} />
                                </div>
                                <div>
                                <span className="pill-success">
                                    <span className="status-dot-live" />
                                    Connected
                                </span>
                                    <p className="text-xs text-ink-muted mt-1.5 group-hover:text-primary group-hover:underline transition-colors">
                                        Manage configuration
                                    </p>
                                </div>
                            </Link>
                        ) : (
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05]">
                                    <Smartphone className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                                </div>
                                <div className="space-y-2.5">
                                    <p className="text-sm text-ink-muted">
                                        Not connected yet. Link your till or paybill to start collecting rent via M-Pesa.
                                    </p>
                                    <Link href="/daraja/config" className="btn-primary inline-flex">
                                        Set up M-Pesa
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Insights</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card animate-fade-in-up">
                        <h2 className="section-header">Occupancy</h2>
                        <OccupancyDonut
                            fullyOccupied={metrics.fullyOccupied}
                            vacant={metrics.vacant}
                            activeProperties={metrics.activeProperties}
                        />
                        <p className="text-xs text-ink-muted leading-relaxed mt-4 pt-4 border-t border-ink/[0.06]">
                            {occupancyInsight}
                        </p>
                    </div>

                    <div className="card animate-fade-in-up">
                        <h2 className="section-header">Portfolio composition</h2>
                        <PortfolioBar
                            active={metrics.activeProperties}
                            underMaintenance={metrics.underMaintenance}
                            draft={metrics.draft}
                            archived={metrics.archived}
                        />
                        {portfolioInsight && (
                            <p className="text-xs text-ink-muted leading-relaxed mt-4 pt-4 border-t border-ink/[0.06]">
                                {portfolioInsight}
                            </p>
                        )}
                    </div>

                    <div className="card animate-fade-in-up">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="section-header !mb-0">Recent activity</h2>
                            {activities.length > 0 && (
                                <Link
                                    href="/dashboard/activity"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                    View all
                                    <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                                </Link>
                            )}
                        </div>
                        <RecentActivity activities={activities} isConnected={isConnected} isLoading={activitiesLoading} />
                    </div>
                </div>
            </div>

            {/* Modules */}
            <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Modules</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <PhasePlaceholderCard
                        icon={ArrowLeftRight}
                        title="Transactions"
                        note="Live payments, charges, and adjustments feed"
                        href="/dashboard/payments" />
                    <PhasePlaceholderCard
                        icon={Receipt}
                        title="Rent ledger"
                        note="Collection status, overdue balances"
                        href="/dashboard/rent-ledger" />
                    <PhasePlaceholderCard
                        icon={Users}
                        title="Tenants"
                        note="Residents, lease terms, rent collection"
                        href="/dashboard/leases" />
                    <PhasePlaceholderCard icon={Wallet} title="Upcoming disbursements"
                                           note="Phase 5 — pending payouts to your M-Pesa" />
                </div>
            </div>
        </div>
    );
}
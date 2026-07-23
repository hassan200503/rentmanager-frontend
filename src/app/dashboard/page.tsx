"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    Building2,
    CheckCircle2,
    AlertTriangle,
    Archive,
    Plus,
    Receipt,
    Users,
    ShieldCheck,
    Clock,
    ArrowRight,
    ArrowUpRight,
    Smartphone,
    ArrowLeftRight,
    TrendingUp,
    Home,
} from "lucide-react";
import type { ElementType } from "react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { propertyApi } from "@/features/property/api/property-api";
import { PropertyStatus } from "@/features/property/types/property";
import { usePropertyDashboardMetrics } from "@/features/property/hooks/use-property-dashboard-metrics";
import { useActivityFeed } from "@/features/activity/hooks/use-activity-feed";
import { useDarajaStatusQuery } from "@/features/daraja/queries/ use-daraja-status-query";
import MetricCard, { MetricCardSkeleton } from "@/shared/components/dashboard/MetricCard";
import PortfolioBar from "@/shared/components/dashboard/PortfolioBar";
import RecentActivity from "@/shared/components/dashboard/RecentActivity";

function DashboardSkeleton() {
    return (
        <div className="page-container space-y-6">
            <div className="flex items-center justify-between pb-4">
                <div>
                    <div className="skeleton h-4 w-24 mb-2" />
                    <div className="skeleton h-8 w-48 mb-1" />
                    <div className="skeleton h-4 w-64" />
                </div>
                <div className="skeleton h-9 w-36 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <MetricCardSkeleton key={i} />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2">
                    <div className="skeleton h-64 w-full" />
                </div>
                <div className="card">
                    <div className="skeleton h-64 w-full" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card skeleton h-24" />
                ))}
            </div>
        </div>
    );
}

function InlinePermissionDenied() {
    return (
        <div className="page-container">
            <div className="card max-w-xl mx-auto text-center mt-12">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                    <ShieldCheck className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Restricted page</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    You don&#39;t have permission to view this page. Ask an account owner for access.
                </p>
            </div>
        </div>
    );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="page-container">
            <div className="card text-center py-10 max-w-xl mx-auto">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg dark:bg-danger-bg-dark">
                    <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load your dashboard</p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                    Please try again. If this keeps happening, contact support.
                </p>
                <button onClick={onRetry} className="btn-outline mx-auto">
                    Retry
                </button>
            </div>
        </div>
    );
}

interface ModuleCardProps {
    icon: ElementType;
    title: string;
    note: string;
    href?: string;
}

function ModuleCard(props: ModuleCardProps) {
    const Icon = props.icon;
    const isAvailable = Boolean(props.href);

    const content = (
        <div className={`card-hover h-full ${!isAvailable ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isAvailable ? "bg-brand-50 dark:bg-brand-800" : "bg-border-subtle dark:bg-border-subtle-dark"
                }`}>
                    <Icon className={`h-4 w-4 ${isAvailable ? "text-brand dark:text-brand-300" : "text-fg-subtle dark:text-fg-subtle-dark"}`} strokeWidth={2} />
                </div>
                {isAvailable ? (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand dark:text-brand-300">
                        Open
                        <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                ) : (
                    <span className="pill-neutral !text-[10px]">Coming soon</span>
                )}
            </div>
            <h3 className="text-sm font-medium text-fg dark:text-fg-dark mb-1">{props.title}</h3>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark leading-relaxed">{props.note}</p>
        </div>
    );

    if (props.href) {
        return <Link href={props.href} className="block h-full">{content}</Link>;
    }

    return content;
}

function StatusBadge({ status }: { status: string }) {
    const normalized = status?.toUpperCase?.() ?? "";

    const pillClassMap: Record<string, string> = {
        ACTIVE: "pill-success",
        MAINTENANCE: "pill-warning",
        DRAFT: "pill-neutral",
        ARCHIVED: "pill-neutral",
    };

    const pillClass = pillClassMap[normalized] ?? "pill-neutral";

    return <span className={`${pillClass} !px-2 !py-0.5 !text-[11px]`}>{status?.toLowerCase()}</span>;
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

    const {
        activities,
        isConnected,
        isLoading: activitiesLoading,
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

    const activeTone = metrics.activeProperties > 0 ? "success" : "neutral";
    const fullyOccupiedTone =
        metrics.activeProperties === 0 ? "neutral" : metrics.fullyOccupied === 0 ? "warning" : "success";

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
        <div className="page-container space-y-6">
            {/* ── Header ────────────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-2">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark mb-1">Overview</p>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Portfolio overview and account status</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                        Updated {lastUpdated}
                    </span>
                    <Link href="/dashboard/properties/create" className="btn-primary">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Add property
                    </Link>
                </div>
            </div>

            {/* ── Hero KPI row ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={Building2} label="Total properties" value={metrics.totalProperties} />
                <MetricCard icon={CheckCircle2} label="Active" value={metrics.activeProperties} tone={activeTone} />
                <MetricCard
                    icon={CheckCircle2}
                    label="Fully occupied"
                    value={metrics.fullyOccupied}
                    tone={fullyOccupiedTone}
                />
                <MetricCard
                    icon={occupancyRate !== null && occupancyRate >= 80 ? TrendingUp : AlertTriangle}
                    label="Occupancy rate"
                    value={occupancyRate !== null ? `${occupancyRate}%` : "—"}
                    tone={occupancyRate !== null && occupancyRate >= 80 ? "success" : "neutral"}
                />
            </div>

            {/* ── Attention banner ──────────────────────────────── */}
            {attentionCount > 0 && (
                <div className="card-sm flex flex-wrap items-center justify-between gap-3 !py-3 bg-warning-bg dark:bg-warning-bg-dark border-warning/20 dark:border-warning/20">
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-warning-dark dark:text-warning" strokeWidth={2} />
                        <p className="text-xs text-fg dark:text-fg-dark">
                            <span className="font-mono-nums font-semibold">{attentionCount}</span>{" "}
                            {attentionCount === 1 ? "property needs" : "properties need"} attention —{" "}
                            {metrics.vacant} vacant, {metrics.underMaintenance} under maintenance
                        </p>
                    </div>
                    <Link
                        href="/dashboard/properties"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand dark:text-brand-300 hover:underline"
                    >
                        Review <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                    </Link>
                </div>
            )}

            {/* ── Charts row ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Portfolio composition chart */}
                <div className="card lg:col-span-2">
                    <h2 className="section-header">Portfolio composition</h2>
                    <PortfolioBar
                        active={metrics.activeProperties}
                        underMaintenance={metrics.underMaintenance}
                        draft={metrics.draft}
                        archived={metrics.archived}
                    />
                    {portfolioInsight && (
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark leading-relaxed mt-4 pt-4 border-t border-border dark:border-border-dark">
                            {portfolioInsight}
                        </p>
                    )}
                </div>

                {/* M-Pesa status card */}
                <div className="card">
                    <h2 className="section-header">M-Pesa</h2>
                    {darajaStatus.isLoading ? (
                        <div className="skeleton h-6 w-24" />
                    ) : isDarajaConnected ? (
                        <Link href="/daraja/config" className="flex items-start gap-3 group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                                <Smartphone className="h-4 w-4 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <span className="pill-success">
                                    <span className="status-dot-success status-dot-live" />
                                    Connected
                                </span>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1.5 group-hover:text-brand dark:group-hover:text-brand-300 transition-colors">
                                    Manage configuration
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border-subtle dark:bg-border-subtle-dark">
                                <Smartphone className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
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

            {/* ── Properties table + Activity ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h2 className="section-header !mb-0">Properties</h2>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 rounded-lg bg-border-subtle dark:bg-border-subtle-dark p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setPropertyFilter("active")}
                                    aria-pressed={propertyFilter === "active"}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                        propertyFilter === "active"
                                            ? "bg-surface dark:bg-surface-dark text-fg dark:text-fg-dark shadow-sm"
                                            : "text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
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
                                            ? "bg-surface dark:bg-surface-dark text-fg dark:text-fg-dark shadow-sm"
                                            : "text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
                                    }`}
                                >
                                    All
                                </button>
                            </div>
                            {properties.length > 0 && (
                                <Link
                                    href="/dashboard/properties"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-300 hover:underline"
                                >
                                    View all
                                    <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                                </Link>
                            )}
                        </div>
                    </div>

                    {properties.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                                <Home className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                            </div>
                            <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">
                                {propertyFilter === "active" ? "No active properties" : "No properties yet"}
                            </p>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                                {propertyFilter === "active"
                                    ? "Activate a property or switch to \"All\" to see draft and archived listings."
                                    : "Add your first property to start tracking occupancy and rent."}
                            </p>
                            <Link href="/dashboard/properties/create" className="btn-primary inline-flex w-fit mx-auto">
                                <Plus className="h-4 w-4" strokeWidth={2} />
                                Add property
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full text-sm border-separate border-spacing-0">
                                <thead>
                                <tr className="text-left text-fg-muted dark:text-fg-muted-dark">
                                    <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-border dark:border-border-dark">Property</th>
                                    <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-border dark:border-border-dark">Type</th>
                                    <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-border dark:border-border-dark">Status</th>
                                    <th className="py-2 px-2 font-medium text-xs uppercase tracking-wide border-b border-border dark:border-border-dark">Occupancy</th>
                                </tr>
                                </thead>
                                <tbody>
                                {properties.map((p) => (
                                    <tr
                                        key={p.propertyId}
                                        className="group border-b border-border-subtle dark:border-border-subtle-dark last:border-0 hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors"
                                    >
                                        <td className="py-3 px-2">
                                            <Link href={`/dashboard/properties/${p.propertyId}`} className="flex items-center gap-2.5">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-800 text-[11px] font-semibold text-brand-dark dark:text-brand-200">
                                                    {p.name?.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-fg dark:text-fg-dark group-hover:text-brand dark:group-hover:text-brand-300 transition-colors">{p.name}</span>
                                            </Link>
                                        </td>
                                        <td className="py-3 px-2 text-fg-muted dark:text-fg-muted-dark">{p.propertyType}</td>
                                        <td className="py-3 px-2"><StatusBadge status={p.status} /></td>
                                        <td className="py-3 px-2 font-mono-nums text-fg-muted dark:text-fg-muted-dark">{p.occupancyStatus}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="section-header !mb-0">Recent activity</h2>
                        {activities.length > 0 && (
                            <Link
                                href="/dashboard/activity"
                                className="inline-flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-300 hover:underline"
                            >
                                View all
                                <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                            </Link>
                        )}
                    </div>
                    <RecentActivity activities={activities} isConnected={isConnected} isLoading={activitiesLoading} />
                </div>
            </div>

            {/* ── Occupancy insight ──────────────────────────────── */}
            <div className="card-sm bg-brand-50 dark:bg-brand-800/40 border-brand-200 dark:border-brand-700">
                <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-700">
                        <TrendingUp className="h-4 w-4 text-brand dark:text-brand-300" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-fg dark:text-fg-dark">Occupancy insight</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{occupancyInsight}</p>
                    </div>
                </div>
            </div>

            {/* ── Module quick-links ─────────────────────────────── */}
            <div>
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark mb-3">Quick access</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ModuleCard
                        icon={ArrowLeftRight}
                        title="Transactions"
                        note="Live payments, charges, and adjustments feed"
                        href="/dashboard/payments" />
                    <ModuleCard
                        icon={Receipt}
                        title="Rent ledger"
                        note="Collection status, overdue balances"
                        href="/dashboard/rent-ledger" />
                    <ModuleCard
                        icon={Users}
                        title="Tenants"
                        note="Residents, lease terms, rent collection"
                        href="/dashboard/leases" />
                    <ModuleCard icon={Archive} title="Upcoming disbursements" note="Phase 5 — pending payouts to your M-Pesa" />
                </div>
            </div>
        </div>
    );
}
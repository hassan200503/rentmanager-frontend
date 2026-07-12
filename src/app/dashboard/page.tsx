"use client";

import { useQuery } from "@tanstack/react-query";
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
    FileText,
    ShieldCheck,
    Clock,
    ArrowRight,
    Smartphone,
} from "lucide-react";
import type { ElementType } from "react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { propertyApi } from "@/features/property/api/property-api";
import { usePropertyDashboardMetrics } from "@/features/property/hooks/use-property-dashboard-metrics";
import { useDarajaStatusQuery } from "@/features/daraja/queries/ use-daraja-status-query";
import MetricCard, { MetricCardSkeleton } from "@/shared/components/dashboard/MetricCard";

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="skeleton h-8 w-40 mb-2" />
                    <div className="skeleton h-4 w-64" />
                </div>
                <div className="skeleton h-9 w-32 rounded-lg" />
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

function DashboardError() {
    return (
        <div className="card border-danger/20 bg-danger/[0.03] text-center py-10">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load your dashboard</p>
            <p className="text-xs text-ink-muted mb-4">
                Please refresh the page. If this keeps happening, contact support.
            </p>
            <button onClick={() => window.location.reload()} className="btn-outline mx-auto">
                Refresh
            </button>
        </div>
    );
}

interface BreakdownItem {
    label: string;
    value: number;
    icon: ElementType;
    tone: "warning" | "neutral";
}

interface PhasePlaceholderCardProps {
    icon: ElementType;
    title: string;
    note: string;
    href?: string;
}

function PhasePlaceholderCard(props: PhasePlaceholderCardProps) {
    const Icon = props.icon;
    const content = (
        <div className="card-sm border-dashed border-ink/15 bg-ink/[0.015] h-full">
            <div className="flex items-start justify-between mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink/[0.05]">
                    <Icon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                </div>
                <span className="pill-neutral text-[10px]">{props.href ? "View" : "Coming soon"}</span>
            </div>
            <h3 className="text-sm font-medium text-ink mb-1">{props.title}</h3>
            <p className="text-xs text-ink-muted">{props.note}</p>
        </div>
    );

    if (props.href) {
        return (
            <a href={props.href} className="block hover:opacity-80 transition-opacity h-full">
                {content}
            </a>
        );
    }

    return content;
}

export default function DashboardPage() {
    const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();

    if (isUserLoading) return <div className="page-container"><DashboardSkeleton /></div>;
    if (!isOwner) return <InlinePermissionDenied />;
    if (!user?.tenantId) return <div className="page-container"><DashboardSkeleton /></div>;

    return <DashboardContent tenantId={user.tenantId} />;
}

// @ts-ignore
function DashboardContent({ tenantId }: { tenantId: string }) {
    const { metrics, isLoading: metricsLoading, isError: metricsError } =
        usePropertyDashboardMetrics(tenantId);
    const darajaStatus = useDarajaStatusQuery(tenantId);
    const propertiesQuery = useQuery({
        queryKey: ["properties", "dashboard-list", tenantId],
        queryFn: () => propertyApi.list({ page: 0, size: 5 }),
        enabled: Boolean(tenantId),
    });

    if (metricsLoading || propertiesQuery.isLoading) {
        return <div className="page-container"><DashboardSkeleton /></div>;
    }

    if (metricsError || propertiesQuery.isError) {
        return <div className="page-container"><DashboardError /></div>;
    }

    const isDarajaConnected = darajaStatus.data?.configured ?? false;
    const properties = propertiesQuery.data?.content ?? [];
    const lastUpdated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const breakdown: BreakdownItem[] = [
        { label: "Under maintenance", value: metrics.underMaintenance, icon: Wrench, tone: "warning" },
        { label: "Draft", value: metrics.draft, icon: FileEdit, tone: "neutral" },
        { label: "Archived", value: metrics.archived, icon: Archive, tone: "neutral" },
    ];

    return (
        <div className="page-container space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Portfolio overview and account status</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2}/>
                        Updated {lastUpdated}
                    </span>
                    <a href="/dashboard/properties/new" className="btn-primary inline-flex items-center gap-1.5">
                        <Plus className="h-4 w-4" strokeWidth={2}/>
                        Add property
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={Building2} label="Total properties" value={metrics.totalProperties}/>
                <MetricCard icon={CheckCircle2} label="Active" value={metrics.activeProperties} tone="success"/>
                <MetricCard icon={CheckCircle2} label="Fully occupied" value={metrics.fullyOccupied}
                            tone="success"/>
                <MetricCard icon={AlertTriangle} label="Vacant" value={metrics.vacant} tone="warning"/>
            </div>

            <div className="card-sm flex flex-wrap items-center gap-x-6 gap-y-3 !py-3">
                {breakdown.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                        <div key={item.label} className="flex items-center gap-2">
                            <ItemIcon
                                className={item.tone === "warning" ? "h-3.5 w-3.5 text-warning-dark" : "h-3.5 w-3.5 text-ink-muted"}
                                strokeWidth={2}/>
                            <span className="text-xs text-ink-muted">{item.label}</span>
                            <span className="font-data text-sm font-semibold text-ink">{item.value}</span>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="section-header !mb-0">Properties</h2>
                        {properties.length > 0 && (
                            <a
                                href="/dashboard/properties"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                                View all
                                <ArrowRight className="h-3 w-3" strokeWidth={2.5}/>
                            </a>
                        )}
                    </div>

                    {properties.length === 0 ? (
                        <div className="text-center py-12">
                            <div
                                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                                <Building2 className="h-5 w-5 text-ink-muted" strokeWidth={2}/>
                            </div>
                            <p className="text-sm font-medium text-ink mb-1">No properties yet</p>
                            <p className="text-xs text-ink-muted mb-4">
                                Add your first property to start tracking occupancy and rent.
                            </p>
                            <a href="/dashboard/properties/new"
                               className="btn-primary inline-flex items-center gap-1.5 w-fit mx-auto">
                                <Plus className="h-4 w-4" strokeWidth={2}/>
                                Add property
                            </a>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="text-left text-ink-muted border-b border-ink/10">
                                    <th className="py-2 px-2 font-medium">Property</th>
                                    <th className="py-2 px-2 font-medium">Type</th>
                                    <th className="py-2 px-2 font-medium">Status</th>
                                    <th className="py-2 px-2 font-medium">Occupancy</th>
                                </tr>
                                </thead>
                                <tbody>
                                {properties.map((p) => (
                                    <tr
                                        key={p.propertyId}
                                        className="border-b border-ink/[0.06] last:border-0 hover:bg-ink/[0.02] transition-colors"
                                    >
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-light text-[11px] font-semibold text-primary-dark">
                                                    {p.name?.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-ink">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-ink-muted">{p.propertyType}</td>
                                        <td className="py-3 px-2">
                                            <span className="pill-neutral">{p.status}</span>
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
                        <div className="skeleton h-6 w-24"/>
                    ) : isDarajaConnected ? (
                        <a href="/daraja/config" className="flex items-start gap-3 group">
                            <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                                <Smartphone className="h-4 w-4 text-primary-dark" strokeWidth={2}/>
                            </div>
                            <div>
                            <span className="pill-success">
                                <span className="status-dot-live"/>
                                Connected
                            </span>
                                <p className="text-xs text-ink-muted mt-1.5 group-hover:text-primary group-hover:underline transition-colors">
                                    Manage configuration
                                </p>
                            </div>
                        </a>
                    ) : (
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/[0.05]">
                                <Smartphone className="h-4 w-4 text-ink-muted" strokeWidth={2}/>
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-sm text-ink-muted">
                                    Not connected yet. Link your till or paybill to start collecting rent via M-Pesa.
                                </p>
                                <a href="/daraja/config" className="btn-primary inline-flex">
                                    Set up M-Pesa
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <PhasePlaceholderCard
                    icon={Receipt}
                    title="Rent ledger"
                    note="Collection status, overdue balances"
                    href="/dashboard/rent-ledger"/>
                <PhasePlaceholderCard
                    icon={FileText}
                    title="Leases"
                    note="Active leases, renewals, pending actions"
                    href="/dashboard/leases"/>
                <PhasePlaceholderCard icon={Wallet} title="Upcoming disbursements"
                                      note="Phase 5 — pending payouts to your M-Pesa"/>
                <PhasePlaceholderCard icon={ShieldCheck} title="Verification status"
                                      note="Phase 7 — KYC and identity checks"/>
            </div>
        </div>
    );
}
"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { propertyApi } from "@/features/property/api/property-api";
import { usePropertyDashboardMetrics } from "@/features/property/hooks/use-property-dashboard-metrics";
import { useDarajaStatusQuery } from "@/features/daraja/queries/ use-daraja-status-query";
import MetricCard, { MetricCardSkeleton } from "@/shared/components/dashboard/MetricCard";

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="skeleton h-8 w-48 mb-1" />
            <div className="skeleton h-4 w-72 mb-6" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <MetricCardSkeleton key={i} />
                ))}
            </div>
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
            <p className="text-sm text-ink-muted">
                You don&#39;t have permission to view this page.
            </p>
        </div>
    );
}

export default function DashboardPage() {
    const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();

    if (isUserLoading) return <div className="page-container"><DashboardSkeleton /></div>;
    if (!isOwner) return <InlinePermissionDenied />;
    if (!user?.tenantId) return <div className="page-container"><DashboardSkeleton /></div>;

    return <DashboardContent tenantId={user.tenantId} />;
}

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
        return (
            <div className="page-container">
                <DashboardSkeleton />
            </div>
        );
    }

    if (metricsError || propertiesQuery.isError) {
        return (
            <div className="page-container">
                <div className="card border-danger/20 bg-danger/[0.03] text-center">
                    <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load your dashboard</p>
                    <p className="text-xs text-ink-muted">Please refresh the page. If this keeps happening, contact support.</p>
                </div>
            </div>
        );
    }

    const isDarajaConnected = darajaStatus.data?.configured ?? false;
    const properties = propertiesQuery.data?.content ?? [];

    return (
        <div className="page-container space-y-6">
            <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Portfolio overview and account status</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total properties" value={metrics.totalProperties} />
                <MetricCard label="Active" value={metrics.activeProperties} tone="success" />
                <MetricCard label="Fully occupied" value={metrics.fullyOccupied} tone="success" />
                <MetricCard label="Vacant" value={metrics.vacant} tone="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2 animate-fade-in-up">
                    <h2 className="section-header">Properties</h2>
                    {properties.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-sm text-ink-muted">No properties yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left text-ink-muted border-b border-ink/10">
                                <th className="py-2 font-medium">Name</th>
                                <th className="py-2 font-medium">Type</th>
                                <th className="py-2 font-medium">Status</th>
                                <th className="py-2 font-medium">Occupancy</th>
                            </tr>
                            </thead>
                            <tbody>
                            {properties.map((p) => (
                                <tr
                                    key={p.propertyId}
                                    className="border-b border-ink/[0.06] last:border-0 hover:bg-ink/[0.02] transition-colors"
                                >
                                    <td className="py-3 font-medium text-ink">{p.name}</td>
                                    <td className="py-3 text-ink-muted">{p.propertyType}</td>
                                    <td className="py-3">
                                        <span className="pill-neutral">{p.status}</span>
                                    </td>
                                    <td className="py-3 font-data text-ink-muted">{p.occupancyStatus}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card animate-fade-in-up">
                    <h2 className="section-header">M-Pesa</h2>
                    {darajaStatus.isLoading ? (
                        <div className="skeleton h-6 w-24" />
                    ) : isDarajaConnected ? (
                        <a href="/daraja/config" className="inline-flex items-center gap-2 group">
                            <span className="pill-success">
                                <span className="status-dot-live" />
                                Connected
                            </span>
                            <span className="text-xs text-ink-muted group-hover:text-primary group-hover:underline transition-colors">
                                Manage
                            </span>
                        </a>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-ink-muted">Not connected yet.</p>
                            <a href="/daraja/config" className="btn-primary inline-flex">
                                Set up M-Pesa
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Phase-readiness slots — placeholders only, no data yet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <PhasePlaceholderCard title="Rent ledger" note="Phase 1 — collection status, overdue balances" />
                <PhasePlaceholderCard title="Upcoming disbursements" note="Phase 5 — pending payouts to your M-Pesa" />
                <PhasePlaceholderCard title="Verification status" note="Phase 7 — KYC and identity checks" />
            </div>
        </div>
    );
}

function PhasePlaceholderCard({ title, note }: { title: string; note: string }) {
    return (
        <div className="card-sm border-dashed border-ink/15 bg-ink/[0.015]">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-ink">{title}</h3>
                <span className="pill-neutral text-[10px]">Coming soon</span>
            </div>
            <p className="text-xs text-ink-muted">{note}</p>
        </div>
    );
}
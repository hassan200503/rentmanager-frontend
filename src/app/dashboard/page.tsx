"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { propertyApi } from "@/features/property/api/property-api";
import { usePropertyDashboardMetrics } from "@/features/property/hooks/use-property-dashboard-metrics";
import {useDarajaStatusQuery} from "@/features/daraja/queries/ use-daraja-status-query";

function InlineLoading() {
    return (
        <div className="mx-auto max-w-xl p-8 text-center text-sm text-gray-500">
            Loading…
        </div>
    );
}

function InlinePermissionDenied() {
    return (
        <div className="mx-auto max-w-xl rounded-lg border p-8 text-center text-sm text-gray-500">
            You don&#39;t have permission to view this page.
        </div>
    );
}

export default function DashboardPage() {
    const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();

    if (isUserLoading) return <InlineLoading />;
    if (!isOwner) return <InlinePermissionDenied />;
    if (!user?.tenantId) return <InlineLoading />;

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
        return <InlineLoading />;
    }

    if (metricsError || propertiesQuery.isError) {
        return (
            <div className="rounded-md border border-danger/30 bg-red-50 p-4 text-sm text-danger-dark">
                Couldn&#39;t load your dashboard data. Please refresh the page.
            </div>
        );
    }

    const isDarajaConnected = darajaStatus.data?.configured ?? false;
    const properties = propertiesQuery.data?.content ?? [];

    return (
        <div className="space-y-6">
            <h1 className="page-title">Dashboard</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total properties" value={metrics.totalProperties} />
                <MetricCard label="Active" value={metrics.activeProperties} tone="success" />
                <MetricCard label="Fully occupied" value={metrics.fullyOccupied} />
                <MetricCard label="Vacant" value={metrics.vacant} tone="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card lg:col-span-2">
                    <h2 className="section-header">Properties</h2>
                    {properties.length === 0 ? (
                        <p className="text-sm text-gray-500">No properties yet.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="py-2 font-medium">Name</th>
                                <th className="py-2 font-medium">Type</th>
                                <th className="py-2 font-medium">Status</th>
                                <th className="py-2 font-medium">Occupancy</th>
                            </tr>
                            </thead>
                            <tbody>
                            {properties.map((p) => (
                                <tr key={p.propertyId} className="border-b last:border-0">
                                    <td className="py-2">{p.name}</td>
                                    <td className="py-2">{p.propertyType}</td>
                                    <td className="py-2">{p.status}</td>
                                    <td className="py-2">{p.occupancyStatus}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="card">
                    <h2 className="section-header">M-Pesa</h2>
                    {darajaStatus.isLoading ? (
                        <p className="text-sm text-gray-500">Checking status…</p>
                    ) : isDarajaConnected ? (
                        <a href="/daraja/config" className="inline-flex items-center gap-2 group">
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-success-dark">
                                Connected
                            </span>
                            <span className="text-xs text-gray-500 group-hover:underline">
                                Manage
                            </span>
                        </a>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500">Not connected yet.</p>
                            <a href="/daraja/config" className="btn-primary inline-flex">
                                Set up M-Pesa
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({
                        label,
                        value,
                        tone,
                    }: {
    label: string;
    value: number;
    tone?: "success" | "warning" | "danger";
}) {
    const valueClass =
        tone === "success"
            ? "text-success"
            : tone === "warning"
                ? "text-warning-dark"
                : tone === "danger"
                    ? "text-danger"
                    : "text-gray-900";

    return (
        <div className="card-sm">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${valueClass}`}>{value}</p>
        </div>
    );
}
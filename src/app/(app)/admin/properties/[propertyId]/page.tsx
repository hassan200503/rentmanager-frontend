"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
    Home,
    ArrowLeft,
    Loader2,
    AlertTriangle,
    MapPin,
    Building2,
    Boxes,
    KeyRound,
    History,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    TenantStatusBadge,
    formatCurrency,
    formatDate,
} from "@/features/admin/components/admin-ui";
import { useAdminPropertyDetailQuery } from "@/features/admin/hooks/use-admin-queries";

const unitStatusMeta: Record<string, { label: string; chip: string }> = {
    ACTIVE: { label: "Active", chip: "bg-success/10 text-success-dark border-success/20" },
    OCCUPIED: { label: "Occupied", chip: "bg-brand-50 text-brand-700 border-brand/20" },
    VACANT: { label: "Vacant", chip: "bg-info/10 text-info-dark border-info/20" },
    MAINTENANCE: { label: "Maintenance", chip: "bg-warning/10 text-warning-dark border-warning/20" },
    INACTIVE: { label: "Inactive", chip: "bg-border-subtle text-fg-muted border-border" },
    ARCHIVED: { label: "Archived", chip: "bg-border-subtle text-fg-muted border-border" },
};

const leaseStatusMeta: Record<string, { label: string; chip: string }> = {
    ACTIVE: { label: "Active", chip: "bg-success/10 text-success-dark border-success/20" },
    PENDING_APPROVAL: { label: "Pending approval", chip: "bg-warning/10 text-warning-dark border-warning/20" },
    AWAITING_DEPOSIT: { label: "Awaiting deposit", chip: "bg-info/10 text-info-dark border-info/20" },
    PENDING_ACTIVATION: { label: "Pending activation", chip: "bg-info/10 text-info-dark border-info/20" },
    DRAFT: { label: "Draft", chip: "bg-border-subtle text-fg-muted border-border" },
    EXPIRED: { label: "Expired", chip: "bg-border-subtle text-fg-muted border-border" },
    RENEWED: { label: "Renewed", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    TERMINATED: { label: "Terminated", chip: "bg-danger/10 text-danger border-danger/20" },
    CANCELLED: { label: "Cancelled", chip: "bg-border-subtle text-fg-muted border-border" },
    SUSPENDED: { label: "Suspended", chip: "bg-warning/10 text-warning-dark border-warning/20" },
};

function allChip(kind: "lease" | "unit", status: string) {
    const meta = kind === "unit" ? unitStatusMeta[status] : leaseStatusMeta[status];
    const label = meta?.label ?? status;
    const chip = meta?.chip ?? "bg-border-subtle text-fg-muted border-border";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${chip}`}>
            {label}
        </span>
    );
}

function PropertyDetailContent({ propertyId }: { propertyId: string }) {
    const { data, isPending, isError } = useAdminPropertyDetailQuery(propertyId);

    if (isPending) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-fg-muted dark:text-fg-muted-dark">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Loading property…
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load property detail</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The property may have been removed, or the admin endpoint is unreachable.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                        <Home className="h-6 w-6 text-violet-700 dark:text-violet-300" strokeWidth={2} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-fg dark:text-fg-dark">{data.name}</h1>
                            {allChip("unit", data.status)}
                        </div>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {data.referenceCode} · {data.propertyType} · {data.premisesType}
                            {data.occupancyStatus ? ` · ${data.occupancyStatus.replace(/_/g, " ")}` : ""}
                        </p>
                    </div>
                </div>
                {data.landlord && (
                    <Link
                        href={`/admin/landlords/${data.landlord.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-border-dark px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
                    >
                        <Building2 className="h-4 w-4" strokeWidth={2} />
                        {data.landlord.name}
                    </Link>
                )}
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Units</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">{data.totalUnits}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Occupied</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">{data.occupiedUnits}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Active leases</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">{data.activeLeases.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Created</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">{formatDate(data.createdAt)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Address */}
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        Location
                    </h3>
                    {data.description && (
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-3">{data.description}</p>
                    )}
                    <dl className="space-y-2 text-sm">
                        {[
                            ["Street", data.address?.street],
                            ["City", data.address?.city],
                            ["State / County", data.address?.state],
                            ["Postal code", data.address?.postalCode],
                            ["Country", data.address?.country],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-4 border-b border-border/60 dark:border-border-dark/60 pb-2">
                                <dt className="text-xs text-fg-muted dark:text-fg-muted-dark">{label}</dt>
                                <dd className="text-sm font-medium text-fg dark:text-fg-dark text-right">{value ?? "—"}</dd>
                            </div>
                        ))}
                        <div className="flex justify-between gap-4">
                            <dt className="text-xs text-fg-muted dark:text-fg-muted-dark">Landlord</dt>
                            <dd className="text-sm font-medium text-fg dark:text-fg-dark flex items-center gap-2">
                                {data.landlord?.name ?? "—"}
                                {data.landlord && <TenantStatusBadge status={data.landlord.status} />}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Active leases */}
                <div className="card p-5 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3 flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        Active leases ({data.activeLeases.length})
                    </h3>
                    {data.activeLeases.length === 0 ? (
                        <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark py-4 text-center">No active leases</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                    <tr>
                                        <th className="px-3 py-2">Lease</th>
                                        <th className="px-3 py-2">Renter</th>
                                        <th className="px-3 py-2">Unit</th>
                                        <th className="px-3 py-2">Rent</th>
                                        <th className="px-3 py-2">Period</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                                    {data.activeLeases.map((l) => (
                                        <tr key={l.id}>
                                            <td className="px-3 py-2 text-sm font-medium text-fg dark:text-fg-dark">{l.leaseNumber}</td>
                                            <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">{l.renterName}</td>
                                            <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">{l.unitNumber}</td>
                                            <td className="px-3 py-2 text-sm font-medium text-fg dark:text-fg-dark">{formatCurrency(l.rentAmount)}</td>
                                            <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                                {formatDate(l.startDate)} → {formatDate(l.endDate)}
                                            </td>
                                            <td className="px-3 py-2">{allChip("lease", l.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Units */}
            <div className="card p-5">
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    Units ({data.units.length})
                </h3>
                {data.units.length === 0 ? (
                    <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark py-4 text-center">No units registered</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <tr>
                                    <th className="px-3 py-2">Unit</th>
                                    <th className="px-3 py-2">Floor</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Occupancy</th>
                                    <th className="px-3 py-2">Rent</th>
                                    <th className="px-3 py-2">Deposit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                                {data.units.map((u) => (
                                    <tr key={u.id}>
                                        <td className="px-3 py-2">
                                            <p className="text-sm font-medium text-fg dark:text-fg-dark">{u.label || u.unitNumber}</p>
                                            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">{u.unitNumber}</p>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">{u.floor ?? "—"}</td>
                                        <td className="px-3 py-2">{allChip("unit", u.status)}</td>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {u.occupancyStatus?.replace(/_/g, " ") ?? "—"}
                                        </td>
                                        <td className="px-3 py-2 text-sm font-medium text-fg dark:text-fg-dark">{formatCurrency(u.rentAmount)}</td>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">{formatCurrency(u.depositAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Past leases */}
            {data.pastLeases.length > 0 && (
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3 flex items-center gap-2">
                        <History className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        Past leases ({data.pastLeases.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <tr>
                                    <th className="px-3 py-2">Lease</th>
                                    <th className="px-3 py-2">Renter</th>
                                    <th className="px-3 py-2">Unit</th>
                                    <th className="px-3 py-2">Rent</th>
                                    <th className="px-3 py-2">Period</th>
                                    <th className="px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                                {data.pastLeases.map((l) => (
                                    <tr key={l.id}>
                                        <td className="px-3 py-2 text-sm font-medium text-fg dark:text-fg-dark">{l.leaseNumber}</td>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">{l.renterName}</td>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">{l.unitNumber}</td>
                                        <td className="px-3 py-2 text-sm font-medium text-fg dark:text-fg-dark">{formatCurrency(l.rentAmount)}</td>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {formatDate(l.startDate)} → {formatDate(l.endDate)}
                                        </td>
                                        <td className="px-3 py-2">{allChip("lease", l.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminPropertyDetailPage() {
    const params = useParams<{ propertyId: string }>();

    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    <Link
                        href="/admin/properties"
                        className="inline-flex items-center gap-1.5 text-sm text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                        All properties
                    </Link>
                    <PropertyDetailContent propertyId={params.propertyId} />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
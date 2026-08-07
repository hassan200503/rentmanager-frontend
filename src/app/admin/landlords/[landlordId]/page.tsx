"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    Building2,
    ArrowLeft,
    Loader2,
    AlertTriangle,
    Ban,
    UserCheck,
    Mail,
    Phone,
    Wallet,
    RefreshCw,
    Lock,
    X,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    BillingModeBadge,
    TenantStatusBadge,
    DisbursementStatusBadge,
    CommissionSourceBadge,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatRate,
} from "@/features/admin/components/admin-ui";
import {
    useAdminLandlordDetailQuery,
    useAdminLandlordCommissionQuery,
} from "@/features/admin/hooks/use-admin-queries";
import {
    useSetLandlordCommissionMutation,
    useClearLandlordCommissionMutation,
    useUpdateLandlordStatusMutation,
    useRetryDisbursementMutation,
} from "@/features/admin/hooks/use-admin-mutations";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60 dark:border-border-dark/60 last:border-0">
            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">{label}</span>
            <span className="text-sm font-medium text-fg dark:text-fg-dark">{value}</span>
        </div>
    );
}

function CommissionPanel({ landlordId }: { landlordId: string }) {
    const { isPlatformOwner } = usePlatformRole();
    const { data: commission, isPending } = useAdminLandlordCommissionQuery(landlordId);
    const setCommission = useSetLandlordCommissionMutation();
    const clearCommission = useClearLandlordCommissionMutation();
    const [rate, setRate] = useState("");

    if (isPending) {
        return (
            <div className="card flex items-center justify-center gap-2 py-8 text-sm text-fg-muted dark:text-fg-muted-dark">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Loading commission…
            </div>
        );
    }

    const onSave = () => {
        const value = Number(rate);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            window.alert("Rate must be between 0 and 100 percent.");
            return;
        }
        setCommission.mutate({ landlordId, ratePercent: value });
    };

    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Commission rate</h3>
                </div>
                <CommissionSourceBadge source={commission?.source ?? "DEFAULT"} />
            </div>
            <div className="text-3xl font-bold text-fg dark:text-fg-dark">
                {formatRate(commission?.ratePercent)}
                {commission?.source === "OVERRIDE" && (
                    <span className="ml-2 text-xs font-medium text-fg-subtle dark:text-fg-subtle-dark">
                        {commission?.effectiveFrom ? `since ${formatDate(commission.effectiveFrom)}` : "override"}
                    </span>
                )}
            </div>
            {isPlatformOwner ? (
                <div className="flex items-end gap-2 pt-1">
                    <div className="flex-1">
                        <label className="block text-xs text-fg-muted dark:text-fg-muted-dark mb-1">
                            Rate (%)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder="e.g. 5.0"
                            className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                    </div>
                    <button
                        onClick={onSave}
                        disabled={setCommission.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                        {setCommission.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                        {commission?.source === "OVERRIDE" ? "Update" : "Set override"}
                    </button>
                    {commission?.source === "OVERRIDE" && (
                        <button
                            onClick={() => {
                                if (!window.confirm("Remove this override and fall back to the platform default?")) return;
                                clearCommission.mutate(landlordId);
                            }}
                            disabled={clearCommission.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-danger/30 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                            Clear
                        </button>
                    )}
                </div>
            ) : (
                <p className="flex items-center gap-1.5 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                    <Lock className="h-3 w-3" strokeWidth={2} />
                    Changing commission rates requires platform owner access.
                </p>
            )}
        </div>
    );
}

function LandlordDetailContent({ landlordId }: { landlordId: string }) {
    const { isPlatformOwner } = usePlatformRole();
    const { data, isPending, isError } = useAdminLandlordDetailQuery(landlordId);
    const updateStatus = useUpdateLandlordStatusMutation();
    const retryDisbursement = useRetryDisbursementMutation();

    if (isPending) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-fg-muted dark:text-fg-muted-dark">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Loading landlord…
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load landlord detail</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The landlord may have been removed, or the admin endpoint is unreachable.
                </p>
            </div>
        );
    }

    const onToggleStatus = () => {
        const target = data.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
        const t = target === "SUSPENDED" ? "suspend" : "reactivate";
        if (!window.confirm(`Are you sure you want to ${t} "${data.name}"?`)) return;
        updateStatus.mutate({ landlordId: data.id, status: target });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-brand-700 dark:text-brand-300" strokeWidth={2} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-fg dark:text-fg-dark">{data.name}</h1>
                            <TenantStatusBadge status={data.status} />
                            <BillingModeBadge mode={data.billingMode} />
                        </div>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">@{data.slug}</p>
                    </div>
                </div>
                {isPlatformOwner && (
                    data.status === "SUSPENDED" ? (
                        <button
                            onClick={onToggleStatus}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-success/30 text-xs font-medium text-success-dark dark:text-success hover:bg-success/10 transition-colors"
                        >
                            <UserCheck className="h-4 w-4" strokeWidth={2} />
                            Reactivate landlord
                        </button>
                    ) : (
                        <button
                            onClick={onToggleStatus}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-danger/30 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                        >
                            <Ban className="h-4 w-4" strokeWidth={2} />
                            Suspend landlord
                        </button>
                    )
                )}
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">GMV (all time)</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">{formatCurrency(data.gmvAmount)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Platform commission</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">{formatCurrency(data.commissionAmount)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Properties / Units</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">
                        {data.properties.length} / {data.properties.reduce((s, p) => s + p.unitsCount, 0)}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Renters / Active leases</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">
                        {data.renters.length} / {data.leases.filter((l) => l.status === "ACTIVE").length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Details */}
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">Details</h3>
                    <div className="flex items-center justify-between py-2 border-b border-border/60 dark:border-border-dark/60">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Email</span>
                        <span className="flex items-center gap-1.5 text-sm text-fg dark:text-fg-dark">
                            <Mail className="h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                            {data.email}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/60 dark:border-border-dark/60">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Phone</span>
                        <span className="flex items-center gap-1.5 text-sm text-fg dark:text-fg-dark">
                            <Phone className="h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                            {data.phoneNumber ?? "—"}
                        </span>
                    </div>
                    <InfoRow label="Joined" value={formatDate(data.createdAt)} />
                    <InfoRow label="Last activity" value={formatDateTime(data.lastActivityAt)} />
                    <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Effective commission</span>
                        <span className="text-sm font-semibold text-fg dark:text-fg-dark">
                            {formatRate(data.effectiveCommissionRate)}
                        </span>
                    </div>
                </div>

                {/* Properties */}
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">
                        Properties ({data.properties.length})
                    </h3>
                    {data.properties.length === 0 ? (
                        <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark py-4 text-center">No properties yet</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {data.properties.map((p) => (
                                <Link
                                    key={p.id}
                                    href={`/admin/properties/${p.id}`}
                                    className="flex items-center justify-between rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-3 py-2 hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-fg dark:text-fg-dark truncate">{p.name}</p>
                                        <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">{p.referenceCode}</p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-fg-muted dark:text-fg-muted-dark">
                                        {p.occupiedUnitsCount}/{p.unitsCount} occupied
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Commission */}
                <CommissionPanel landlordId={data.id} />
            </div>

            {/* Disbursements */}
            <div className="card p-5">
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">
                    Recent disbursements ({data.disbursements.length})
                </h3>
                {data.disbursements.length === 0 ? (
                    <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark py-4 text-center">No disbursements yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Amount</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                                {data.disbursements.map((d) => (
                                    <tr key={d.id}>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {formatDateTime(d.createdAt)}
                                        </td>
                                        <td className="px-3 py-2 text-sm font-medium text-fg dark:text-fg-dark">
                                            {formatCurrency(d.amount)}
                                        </td>
                                        <td className="px-3 py-2">
                                            <DisbursementStatusBadge status={d.status} />
                                            {d.requiresManualAttention && (
                                                <span className="ml-1.5 text-[10px] font-semibold text-danger uppercase">attention</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {isPlatformOwner && d.status === "FAILED" && !d.requiresManualAttention && (
                                                <button
                                                    onClick={() => {
                                                        if (!window.confirm("Retry this disbursement now?")) return;
                                                        retryDisbursement.mutate(d.id);
                                                    }}
                                                    disabled={retryDisbursement.isPending}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-brand/30 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand/10 disabled:opacity-50 transition-colors"
                                                >
                                                    <RefreshCw className="h-3 w-3" strokeWidth={2} />
                                                    Retry
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent transactions */}
            <div className="card p-5">
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">
                    Recent transactions ({data.recentTransactions.length})
                </h3>
                {data.recentTransactions.length === 0 ? (
                    <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark py-4 text-center">No transactions yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Source</th>
                                    <th className="px-3 py-2">Amount</th>
                                    <th className="px-3 py-2">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 dark:divide-border-dark/60">
                                {data.recentTransactions.map((t, i) => (
                                    <tr key={`${t.id}-${i}`}>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {formatDateTime(t.occurredAt)}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-fg dark:text-fg-dark">{t.source}</td>
                                        <td className="px-3 py-2 text-sm font-medium text-fg dark:text-fg-dark">
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {t.commissionAmount != null ? formatCurrency(t.commissionAmount) : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminLandlordDetailPage() {
    const params = useParams<{ landlordId: string }>();

    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    <Link
                        href="/admin/landlords"
                        className="inline-flex items-center gap-1.5 text-sm text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                        All landlords
                    </Link>
                    <LandlordDetailContent landlordId={params.landlordId} />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
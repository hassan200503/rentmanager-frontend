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
    RefreshCw,
    CreditCard,
    Crown,
    CheckCircle2,
    Clock,
    CalendarDays,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    BillingModeBadge,
    TenantStatusBadge,
    DisbursementStatusBadge,
    formatCurrency,
    formatDate,
    formatDateTime,
} from "@/features/admin/components/admin-ui";
import {
    useAdminLandlordDetailQuery,
} from "@/features/admin/hooks/use-admin-queries";
import {
    useUpdateLandlordStatusMutation,
    useRetryDisbursementMutation,
    useActivateLandlordSubscriptionMutation,
} from "@/features/admin/hooks/use-admin-mutations";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";
import { useSubscriptionPlansQuery } from "@/features/subscription/queries/use-subscription-queries";
import type { SubscriptionStatus } from "@/features/admin/types/admin-types";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60 dark:border-border-dark/60 last:border-0">
            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">{label}</span>
            <span className="text-sm font-medium text-fg dark:text-fg-dark">{value}</span>
        </div>
    );
}

const SUB_STATUS_META: Record<SubscriptionStatus, { label: string; color: string }> = {
    TRIAL: { label: "Free trial", color: "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30" },
    ACTIVE: { label: "Active", color: "text-success-dark dark:text-success bg-success/10 dark:bg-success/20" },
    GRACE_PERIOD: { label: "Grace period", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30" },
    LAPSED: { label: "Lapsed", color: "text-danger bg-danger/10 dark:bg-danger/20" },
    CANCELLED: { label: "Cancelled", color: "text-fg-muted dark:text-fg-muted-dark bg-border-subtle dark:bg-border-subtle-dark" },
    PAST_DUE: { label: "Past due", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30" },
};

function SubscriptionSection({
    landlordId,
    isPlatformOwner,
    subscriptionStatus,
    subscriptionPlanId,
    planStartDate,
    planEndDate,
    freeTrialEndsAt,
    billingMode,
}: {
    landlordId: string;
    isPlatformOwner: boolean;
    subscriptionStatus: SubscriptionStatus | null;
    subscriptionPlanId: string | null;
    planStartDate: string | null;
    planEndDate: string | null;
    freeTrialEndsAt: string | null;
    billingMode: string;
}) {
    const plans = useSubscriptionPlansQuery();
    const activate = useActivateLandlordSubscriptionMutation();
    const [showForm, setShowForm] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [periodMonths, setPeriodMonths] = useState(12);
    const [confirmActivate, setConfirmActivate] = useState(false);

    const currentPlan = plans.data?.find((p) => p.id === subscriptionPlanId);
    const activePlans = (plans.data ?? []).filter((p) => p.active);

    const statusMeta = subscriptionStatus ? SUB_STATUS_META[subscriptionStatus] : null;

    const handleActivate = () => {
        if (!selectedPlan) return;
        activate.mutate(
            { landlordId, request: { planCode: selectedPlan, periodMonths } },
            {
                onSuccess: () => {
                    setShowForm(false);
                    setConfirmActivate(false);
                    setSelectedPlan("");
                    setPeriodMonths(12);
                },
            }
        );
    };

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    Subscription
                </h3>
                {isPlatformOwner && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-brand/30 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand/10 transition-colors"
                    >
                        <Crown className="h-3 w-3" strokeWidth={2} />
                        Assign plan
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Billing mode</span>
                    <BillingModeBadge mode={billingMode as "COMMISSION" | "PREMIUM_MONTHLY"} />
                </div>

                {statusMeta && (
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Status</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.color}`}>
                            {statusMeta.label}
                        </span>
                    </div>
                )}

                {currentPlan && (
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">Plan</span>
                        <span className="text-sm font-medium text-fg dark:text-fg-dark">{currentPlan.name}</span>
                    </div>
                )}

                {planStartDate && planEndDate && (
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" strokeWidth={2} />
                            Period
                        </span>
                        <span className="text-xs font-medium text-fg dark:text-fg-dark">
                            {formatDate(planStartDate)} → {formatDate(planEndDate)}
                        </span>
                    </div>
                )}

                {subscriptionStatus === "TRIAL" && freeTrialEndsAt && (
                    <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" strokeWidth={2} />
                            Trial ends
                        </span>
                        <span className="text-xs font-medium text-fg dark:text-fg-dark">{formatDate(freeTrialEndsAt)}</span>
                    </div>
                )}
            </div>

            {isPlatformOwner && showForm && (
                <div className="mt-4 rounded-xl border border-border dark:border-border-dark bg-border-subtle/30 dark:bg-border-subtle-dark/30 p-4 space-y-3">
                    <p className="text-xs font-semibold text-fg dark:text-fg-dark">Assign premium plan</p>
                    <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">
                        Bypasses M-Pesa payment — use for Enterprise and negotiated plans.
                        Auto-renew is disabled; the plan must be manually renewed.
                    </p>

                    <div>
                        <label className="block text-xs font-medium text-fg-muted dark:text-fg-muted-dark mb-1">Plan</label>
                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="form-input text-sm"
                        >
                            <option value="">Select a plan…</option>
                            {activePlans.map((p) => (
                                <option key={p.id} value={p.code}>
                                    {p.name}{p.selfService ? "" : " (Enterprise)"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-fg-muted dark:text-fg-muted-dark mb-1">
                            Period (months)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={24}
                            value={periodMonths}
                            onChange={(e) => setPeriodMonths(Number(e.target.value))}
                            className="form-input text-sm w-28"
                        />
                    </div>

                    {activate.isError && (
                        <p className="text-xs text-danger">
                            {(activate.error as Error)?.message ?? "Failed to activate subscription"}
                        </p>
                    )}

                    {!confirmActivate ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmActivate(true)}
                                disabled={!selectedPlan}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                                Activate plan
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setConfirmActivate(false); }}
                                className="px-3 py-1.5 rounded-lg text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={handleActivate}
                                disabled={activate.isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand/30 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand/10 disabled:opacity-50 transition-colors"
                            >
                                {activate.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                                ) : (
                                    <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                                )}
                                {activate.isPending ? "Activating…" : "Confirm"}
                            </button>
                            <button
                                onClick={() => setConfirmActivate(false)}
                                className="px-2 py-1.5 rounded-lg text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function LandlordDetailContent({ landlordId }: { landlordId: string }) {
    const { isPlatformOwner } = usePlatformRole();
    const { data, isPending, isError } = useAdminLandlordDetailQuery(landlordId);
    const updateStatus = useUpdateLandlordStatusMutation();
    const retryDisbursement = useRetryDisbursementMutation();
    const [confirmingToggle, setConfirmingToggle] = useState(false);
    const [confirmingRetryId, setConfirmingRetryId] = useState<string | null>(null);

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
                    confirmingToggle ? (
                        <span className="inline-flex items-center gap-1.5">
                            <button
                                onClick={() => {
                                    const target = data.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
                                    updateStatus.mutate({ landlordId: data.id, status: target });
                                    setConfirmingToggle(false);
                                }}
                                className="inline-flex items-center px-3 py-2 rounded-lg border border-danger/30 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setConfirmingToggle(false)}
                                className="px-2 py-2 rounded-lg text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                            >
                                Cancel
                            </button>
                        </span>
                    ) : data.status === "SUSPENDED" ? (
                        <button
                            onClick={() => setConfirmingToggle(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-success/30 text-xs font-medium text-success-dark dark:text-success hover:bg-success/10 transition-colors"
                        >
                            <UserCheck className="h-4 w-4" strokeWidth={2} />
                            Reactivate landlord
                        </button>
                    ) : (
                        <button
                            onClick={() => setConfirmingToggle(true)}
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
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Active leases</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">
                        {data.leases.filter((l) => l.status === "ACTIVE").length}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Properties / Units</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">
                        {data.properties.length} / {data.properties.reduce((s, p) => s + p.unitsCount, 0)}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-1">Renters</p>
                    <p className="text-xl font-bold text-fg dark:text-fg-dark">{data.renters.length}</p>
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

                {/* Subscription */}
                <SubscriptionSection
                    landlordId={data.id}
                    isPlatformOwner={isPlatformOwner}
                    subscriptionStatus={data.subscriptionStatus}
                    subscriptionPlanId={data.subscriptionPlanId}
                    planStartDate={data.planStartDate}
                    planEndDate={data.planEndDate}
                    freeTrialEndsAt={data.freeTrialEndsAt}
                    billingMode={data.billingMode}
                />
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
                                                confirmingRetryId === d.id ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                retryDisbursement.mutate(d.id);
                                                                setConfirmingRetryId(null);
                                                            }}
                                                            className="inline-flex items-center px-2.5 py-1 rounded-lg border border-brand/30 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand/10 transition-colors"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmingRetryId(null)}
                                                            className="px-1.5 py-1 rounded-lg text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmingRetryId(d.id)}
                                                        disabled={retryDisbursement.isPending}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-brand/30 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand/10 disabled:opacity-50 transition-colors"
                                                    >
                                                        <RefreshCw className="h-3 w-3" strokeWidth={2} />
                                                        Retry
                                                    </button>
                                                )
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
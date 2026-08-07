"use client";

import { useState } from "react";
import {
    Send,
    Loader2,
    AlertTriangle,
    RefreshCw,
    Lock,
    Filter,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    DisbursementStatusBadge,
    EmptyState,
    Pagination,
    PageHeader,
    TableSkeleton,
    formatCurrency,
    formatDateTime,
} from "@/features/admin/components/admin-ui";
import {
    useAdminDisbursementsQuery,
    type AdminDisbursementsParams,
} from "@/features/admin/hooks/use-admin-queries";
import { useRetryDisbursementMutation } from "@/features/admin/hooks/use-admin-mutations";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "INITIATED", label: "Initiated" },
    { value: "PENDING", label: "Pending" },
    { value: "SUCCESS", label: "Success" },
    { value: "FAILED", label: "Failed" },
];

function DisbursementsContent() {
    const { isPlatformOwner } = usePlatformRole();
    const [status, setStatus] = useState("");
    const [attentionOnly, setAttentionOnly] = useState(false);
    const [page, setPage] = useState(0);
    const retry = useRetryDisbursementMutation();

    const params: AdminDisbursementsParams = {
        status: status || undefined,
        requiresManualAttention: attentionOnly ? true : undefined,
        page,
        size: PAGE_SIZE,
    };

    const { data, isPending, isError } = useAdminDisbursementsQuery(params);

    if (isPending) {
        return <TableSkeleton columns={6} rows={8} />;
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load disbursements</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The admin disbursements endpoint is unreachable. Check the backend service and try again.
                </p>
            </div>
        );
    }

    const attentionCount = data.content.filter((d) => d.requiresManualAttention).length;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                    <Filter className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(0);
                        }}
                        className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 pl-9 text-sm text-fg dark:text-fg-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark cursor-pointer">
                    <input
                        type="checkbox"
                        checked={attentionOnly}
                        onChange={(e) => {
                            setAttentionOnly(e.target.checked);
                            setPage(0);
                        }}
                        className="h-4 w-4 rounded border-border accent-[var(--color-brand)]"
                    />
                    Requires manual attention
                </label>
            </div>

            {attentionOnly && attentionCount === 0 && data.content.length > 0 && (
                <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark">
                    No disbursements on this page require manual attention.
                </p>
            )}

            {data.empty ? (
                <div className="card">
                    <EmptyState
                        icon={Send}
                        title="No disbursements found"
                        description="There are no payout records matching the current filters."
                    />
                </div>
            ) : (
                <div className="rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-border-subtle dark:bg-border-subtle-dark">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                    <th className="px-4 py-3">Initiated</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Recipient</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Retries</th>
                                    <th className="px-4 py-3">M-Pesa ref</th>
                                    <th className="px-4 py-3">Failure</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-border-dark">
                                {data.content.map((d) => (
                                    <tr
                                        key={d.id}
                                        className={`hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/40 transition-colors ${
                                            d.requiresManualAttention ? "bg-danger/5 dark:bg-danger/10" : ""
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {formatDateTime(d.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-fg dark:text-fg-dark">
                                            {formatCurrency(d.amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-fg dark:text-fg-dark">{d.recipientName ?? "—"}</p>
                                            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">{d.recipientPhone}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <DisbursementStatusBadge status={d.status} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">{d.retryCount}</td>
                                        <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {d.mpesaOriginatorConversationId ?? d.mpesaTransactionId ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {d.failureReason ? (
                                                <span className="text-xs text-danger" title={d.failureReason}>
                                                    {d.failureReason.length > 48 ? d.failureReason.slice(0, 48) + "…" : d.failureReason}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-fg-subtle dark:text-fg-subtle-dark">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {d.requiresManualAttention ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-danger uppercase bg-danger/10">
                                                    Attention
                                                </span>
                                            ) : isPlatformOwner && d.status === "FAILED" ? (
                                                <button
                                                    onClick={() => {
                                                        if (!window.confirm(`Retry KES ${Number(d.amount).toLocaleString()} payout now?`)) return;
                                                        retry.mutate(d.id);
                                                    }}
                                                    disabled={retry.isPending}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-brand/30 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand/10 disabled:opacity-50 transition-colors"
                                                >
                                                    {retry.isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                                                    ) : (
                                                        <RefreshCw className="h-3 w-3" strokeWidth={2} />
                                                    )}
                                                    Retry
                                                </button>
                                            ) : isPlatformOwner ? null : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-fg-subtle dark:text-fg-subtle-dark bg-border-subtle dark:bg-border-subtle-dark">
                                                    <Lock className="h-3 w-3" strokeWidth={2} />
                                                    Owner
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-border dark:border-border-dark">
                        <Pagination
                            page={data.number}
                            pageCount={data.totalPages}
                            totalElements={data.totalElements}
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminDisbursementsPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    <PageHeader
                        title="Disbursements"
                        subtitle="Monitor and retry M-Pesa payout batches across the platform"
                        icon={Send}
                        iconTone="from-blue-500 to-blue-600"
                    />
                    <DisbursementsContent />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
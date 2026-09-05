"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Send,
    RefreshCw,
    AlertTriangle,
    Plus,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react";
import { useDisbursementsQuery } from "@/features/disbursement/hooks/use-disbursement-queries";
import InitiateDisbursementModal from "@/features/disbursement/components/InitiateDisbursementModal";
import type { DisbursementStatus } from "@/features/disbursement/types/disbursement-types";
import { formatCurrency } from "@/shared/utils/money";

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
};

const STATUS_TABS: { label: string; value: string }[] = [
    { label: "All", value: "" },
    { label: "Initiated", value: "INITIATED" },
    { label: "Pending", value: "PENDING" },
    { label: "Success", value: "SUCCESS" },
    { label: "Failed", value: "FAILED" },
];

const statusMeta: Record<DisbursementStatus, { label: string; icon: typeof Clock; chip: string; dot: string }> = {
    INITIATED: { label: "Initiated", icon: Clock, chip: "bg-info/10 text-info-dark border-info/20", dot: "bg-info" },
    PENDING: { label: "Pending", icon: Clock, chip: "bg-warning/10 text-warning-dark border-warning/20", dot: "bg-warning" },
    SUCCESS: { label: "Success", icon: CheckCircle2, chip: "bg-success/10 text-success-dark border-success/20", dot: "bg-success" },
    FAILED: { label: "Failed", icon: XCircle, chip: "bg-danger/10 text-danger-dark border-danger/20", dot: "bg-danger" },
};

function StatusBadge({ status }: { status: DisbursementStatus }) {
    const meta = statusMeta[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

export default function DisbursementsPage() {
    const [statusFilter, setStatusFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    const { data: disbursements, isLoading, isError, error, refetch } = useDisbursementsQuery(statusFilter || undefined);

    return (
        <div className="page-container space-y-6 pb-12">
            {/* Header */}
            <div className="animate-fade-in-up">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/20 ring-1 ring-white/20">
                            <Send className="h-7 w-7 text-white" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-fg dark:text-fg-dark tracking-tight font-display">Disbursements</h1>
                            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Send money to tenants via M-Pesa B2C and track status.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="btn-primary text-xs gap-1.5"
                    >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        New Disbursement
                    </button>
                </div>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                            statusFilter === tab.value
                                ? "bg-brand text-white shadow-sm"
                                : "bg-surface dark:bg-surface-dark text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark border border-border dark:border-border-dark"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm overflow-hidden">
                    <div className="skeleton h-12 w-full rounded-none border-b border-border/50" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton h-16 w-full rounded-none border-t border-border/30" />
                    ))}
                </div>
            )}

            {/* Error state */}
            {isError && (
                <div className="max-w-md mx-auto mt-12 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm p-10 text-center animate-fade-in-up">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/20 to-danger/10 shadow-sm ring-1 ring-danger/20">
                        <AlertTriangle className="h-8 w-8 text-danger" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-semibold text-fg dark:text-fg-dark mb-1">Couldn&apos;t load disbursements</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6 max-w-xs mx-auto">{error?.message || "Something went wrong while fetching your data."}</p>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <RefreshCw className="w-4 h-4" strokeWidth={2} />
                        Try again
                    </button>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && disbursements && disbursements.length === 0 && (
                <div className="max-w-md mx-auto mt-12 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm p-10 text-center animate-fade-in-up">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 shadow-sm ring-1 ring-brand/20">
                        <Send className="h-8 w-8 text-brand" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-semibold text-fg dark:text-fg-dark mb-1">No disbursements yet</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6 max-w-xs mx-auto">
                        {statusFilter ? `No ${statusFilter.toLowerCase()} disbursements found.` : "Initiate your first B2C payment to a tenant."}
                    </p>
                    {!statusFilter && (
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            New Disbursement
                        </button>
                    )}
                </div>
            )}

            {/* Table */}
            {!isLoading && !isError && disbursements && disbursements.length > 0 && (
                <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border dark:border-border-dark">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Date</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Recipient</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Amount</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {disbursements.map((d) => (
                                <tr key={d.id} className="border-t border-border/50 dark:border-border-dark/50 hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors">
                                    <td className="px-4 py-3.5 text-xs text-fg-muted dark:text-fg-muted-dark whitespace-nowrap">
                                        <span className="text-fg dark:text-fg-dark font-medium">{formatDate(d.createdAt)}</span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-fg dark:text-fg-dark">{d.recipientName}</span>
                                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">{d.recipientPhone}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-sm font-semibold text-fg dark:text-fg-dark whitespace-nowrap">
                                        {formatCurrency(d.amount)}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <StatusBadge status={d.status} />
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <Link
                                            href={`/dashboard/disbursements/${d.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                                        >
                                            View
                                            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Initiate modal */}
            <InitiateDisbursementModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}

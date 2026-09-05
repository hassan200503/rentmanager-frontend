"use client";

import {
    Loader2,
    ShieldCheck,
    CheckCircle2,
    Clock,
    XCircle,
    CircleDashed,
} from "lucide-react";
import type {
    TenantStatus,
    DisbursementStatus,
    RentPaymentRequestStatus,
    BillingMode,
} from "../types/admin-types";
import { formatCurrency as formatMoneyValue, formatRate as formatRateValue, type MoneyValue } from "@/shared/utils/money";

// ---------- Formatting helpers ----------

export const formatCurrency = (amount: MoneyValue) => formatMoneyValue(amount);

export const formatRate = (rate: MoneyValue) => formatRateValue(rate);

export const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// ---------- Badges ----------

const tenantStatusMeta: Record<TenantStatus, { label: string; chip: string; dot: string }> = {
    ACTIVE: { label: "Active", chip: "bg-success/10 text-success-dark border-success/20", dot: "bg-success" },
    SUSPENDED: { label: "Suspended", chip: "bg-warning/10 text-warning-dark border-warning/20", dot: "bg-warning" },
    PENDING: { label: "Pending", chip: "bg-info/10 text-info-dark border-info/20", dot: "bg-info" },
    DEACTIVATED: { label: "Deactivated", chip: "bg-danger/10 text-danger-dark border-danger/20", dot: "bg-danger" },
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
    const meta = tenantStatusMeta[status] ?? { label: status, chip: "bg-border-subtle text-fg-muted border-border", dot: "bg-fg-subtle" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

export function BillingModeBadge({ mode }: { mode: BillingMode }) {
    if (mode === "PREMIUM_MONTHLY") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-brand-50 text-brand-700 border-brand/20">
                Premium
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-border-subtle text-fg-muted border-border">
            Commission
        </span>
    );
}

const disbursementMeta: Record<
    DisbursementStatus,
    { label: string; icon: typeof Clock; chip: string; dot: string }
> = {
    INITIATED: { label: "Initiated", icon: CircleDashed, chip: "bg-info/10 text-info-dark border-info/20", dot: "bg-info" },
    PENDING: { label: "Pending", icon: Clock, chip: "bg-warning/10 text-warning-dark border-warning/20", dot: "bg-warning" },
    SUCCESS: { label: "Success", icon: CheckCircle2, chip: "bg-success/10 text-success-dark border-success/20", dot: "bg-success" },
    FAILED: { label: "Failed", icon: XCircle, chip: "bg-danger/10 text-danger-dark border-danger/20", dot: "bg-danger" },
};

export function DisbursementStatusBadge({ status }: { status: DisbursementStatus }) {
    const meta = disbursementMeta[status] ?? { label: status, icon: Clock, chip: "bg-border-subtle text-fg-muted border-border", dot: "bg-fg-subtle" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

const paymentMeta: Record<RentPaymentRequestStatus, { label: string; chip: string; dot: string }> = {
    PAID: { label: "Paid", chip: "bg-success/10 text-success-dark border-success/20", dot: "bg-success" },
    PENDING: { label: "Pending", chip: "bg-warning/10 text-warning-dark border-warning/20", dot: "bg-warning" },
    FAILED: { label: "Failed", chip: "bg-danger/10 text-danger-dark border-danger/20", dot: "bg-danger" },
};

export function PaymentStatusBadge({ status }: { status: RentPaymentRequestStatus }) {
    const meta = paymentMeta[status] ?? { label: status, chip: "bg-border-subtle text-fg-muted border-border", dot: "bg-fg-subtle" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

export function CommissionSourceBadge({ source }: { source: "OVERRIDE" | "DEFAULT" }) {
    if (source === "OVERRIDE") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-brand-50 text-brand-700 border-brand/20">
                Override
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-border-subtle text-fg-muted border-border">
            Default
        </span>
    );
}

// ---------- Shared states ----------

export function InlineLoading({ label = "Loading…" }: { label?: string }) {
    return (
        <div className="page-container">
            <div className="card flex items-center justify-center gap-2 py-10 text-sm text-fg-muted dark:text-fg-muted-dark">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                {label}
            </div>
        </div>
    );
}

export function PermissionDenied() {
    return (
        <div className="page-container">
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                    <ShieldCheck className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Restricted to platform owners</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    This is the RentManager Super Admin console. You don&#39;t have permission to view it.
                </p>
            </div>
        </div>
    );
}

export function ErrorState({ message }: { message: string }) {
    return (
        <div className="page-container">
            <div className="card text-center py-10">
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Something went wrong</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">{message}</p>
            </div>
        </div>
    );
}

// ---------- Empty States ----------

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-border-subtle dark:bg-border-subtle-dark">
                <Icon className="h-8 w-8 text-fg-muted dark:text-fg-muted-dark opacity-60" />
            </div>
            <h3 className="text-base font-semibold text-fg dark:text-fg-dark mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark max-w-sm mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    iconTone = "from-emerald-500 to-emerald-600",
    actions,
}: {
    title: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    iconTone?: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${iconTone} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-fg dark:text-fg-dark">{title}</h1>
                    {subtitle && (
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{subtitle}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Pagination({
    page,
    pageCount,
    totalElements,
    onPageChange,
}: {
    page: number;
    pageCount: number;
    totalElements: number;
    onPageChange: (page: number) => void;
}) {
    if (pageCount <= 0) return null;
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                {totalElements.toLocaleString()} result{totalElements === 1 ? "" : "s"} · page {page + 1} of {pageCount}
            </p>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    disabled={page <= 0}
                    onClick={() => onPageChange(page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-border dark:border-border-dark text-xs font-medium text-fg dark:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                <button
                    type="button"
                    disabled={page >= pageCount - 1}
                    onClick={() => onPageChange(page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-border dark:border-border-dark text-xs font-medium text-fg dark:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

// ---------- Loading Skeletons ----------

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-border-subtle dark:bg-border-subtle-dark">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="h-3 bg-fg-muted/20 dark:bg-fg-muted-dark/20 rounded animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-border-dark">
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3">
                                        <div className="h-4 bg-fg-muted/10 dark:bg-fg-muted-dark/10 rounded animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="h-3 w-24 bg-fg-muted/20 dark:bg-fg-muted-dark/20 rounded animate-pulse mb-2" />
                    <div className="h-8 w-16 bg-fg-muted/10 dark:bg-fg-muted-dark/10 rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 rounded-lg bg-brand-50/50 dark:bg-brand-900/20 animate-pulse" />
            </div>
        </div>
    );
}

export function PageHeaderSkeleton() {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 animate-pulse" />
                <div>
                    <div className="h-6 w-32 bg-fg-muted/20 dark:bg-fg-muted-dark/20 rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-fg-muted/10 dark:bg-fg-muted-dark/10 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function AdminPageSkeleton({ statCount = 3, showSearch = true }: { statCount?: number; showSearch?: boolean }) {
    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <PageHeaderSkeleton />

                {/* Stats */}
                <div className={`grid grid-cols-1 sm:grid-cols-${statCount} gap-4`}>
                    {Array.from({ length: statCount }).map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>

                {/* Search */}
                {showSearch && (
                    <div className="h-10 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg animate-pulse" />
                )}

                {/* Table */}
                <TableSkeleton />
            </div>
        </div>
    );
}
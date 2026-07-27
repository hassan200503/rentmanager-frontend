"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    Receipt,
    AlertTriangle,
    Search,
    ChevronLeft,
    ChevronRight,
    Smartphone,
    Banknote,
    RefreshCw,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    CircleDollarSign,
    User,
    CalendarDays,
    CreditCard,
    Landmark,
    ArrowLeftRight,
    FileText,
    Timer,
    CheckCircle2,
    TrendingUp,
    Wallet,
    Filter,
    Clock,
    Trash2,
} from "lucide-react";
import { rentLedgerApi } from "@/features/rentledger/api/rent-ledger-api";
import { RentTransactionType, RentTransactionSource } from "@/features/rentledger/types/rent-ledger-response";
import { useLeaseSearch } from "@/features/lease/hooks/use-lease-search";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { useDeleteTransaction } from "@/features/rentledger/hooks/use-delete-transaction";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

const INITIALS_BG = [
    "from-brand-500/20 to-brand-600/10", "from-success-500/20 to-success-600/10",
    "from-warning-500/20 to-warning-600/10", "from-danger-500/20 to-danger-600/10",
    "from-info-500/20 to-info-600/10", "from-purple-500/20 to-purple-600/10",
];

const getInitials = (name: string | null) => {
    if (!name) return "—";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getInitialsBg = (name: string | null) => {
    if (!name) return INITIALS_BG[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return INITIALS_BG[Math.abs(hash) % INITIALS_BG.length];
};

const typeConfig: Record<RentTransactionType, { label: string; chip: string; icon: typeof CircleDollarSign; color: string; bg: string; dot: string }> = {
    RENT_CHARGE: { label: "Rent charge", chip: "bg-ink/[0.06] text-ink-muted border-ink/[0.08]", icon: CircleDollarSign, color: "text-ink", bg: "bg-ink/[0.04]", dot: "bg-ink-muted/40" },
    PAYMENT: { label: "Payment", chip: "bg-success/10 text-success-dark border-success/20", icon: CreditCard, color: "text-success-dark", bg: "bg-success/[0.06]", dot: "bg-success" },
    WAIVER: { label: "Waiver", chip: "bg-warning/10 text-warning-dark border-warning/20", icon: ArrowLeftRight, color: "text-warning-dark", bg: "bg-warning/[0.06]", dot: "bg-warning" },
    REFUND: { label: "Refund", chip: "bg-danger/10 text-danger-dark border-danger/20", icon: ArrowLeftRight, color: "text-danger-dark", bg: "bg-danger/[0.06]", dot: "bg-danger" },
    CREDIT_APPLIED: { label: "Credit applied", chip: "bg-brand-50 text-brand-700 border-brand-200", icon: CircleDollarSign, color: "text-brand-700", bg: "bg-brand/[0.06]", dot: "bg-brand" },
    ADJUSTMENT: { label: "Adjustment", chip: "bg-ink/[0.06] text-ink-muted border-ink/[0.08]", icon: ArrowLeftRight, color: "text-ink", bg: "bg-ink/[0.04]", dot: "bg-ink-muted/40" },
    DEPOSIT: { label: "Deposit", chip: "bg-info/10 text-info-dark border-info/20", icon: Landmark, color: "text-info-dark", bg: "bg-info/[0.06]", dot: "bg-info" },
};

const sourceMeta: Record<RentTransactionSource, { icon: typeof Smartphone; label: string; chip: string }> = {
    MPESA: { icon: Smartphone, label: "M-Pesa", chip: "bg-success/10 text-success-dark border-success/20" },
    CASH: { icon: Banknote, label: "Cash", chip: "bg-warning/10 text-warning-dark border-warning/20" },
    ADMIN_ADJUSTMENT: { icon: RefreshCw, label: "Manual", chip: "bg-info/10 text-info-dark border-info/20" },
    SYSTEM: { icon: Timer, label: "System", chip: "bg-ink/[0.05] text-ink-muted border-ink/[0.08]" },
};

const leaseStatusChip = (status: string | null) => {
    switch (status) {
        case "ACTIVE": return "bg-success/10 text-success-dark border-success/20";
        case "PENDING_ACTIVATION": return "bg-warning/10 text-warning-dark border-warning/20";
        case "PENDING_APPROVAL": return "bg-info/10 text-info-dark border-info/20";
        case "AWAITING_DEPOSIT": return "bg-brand-50 text-brand-700 border-brand-200";
        case "EXPIRED": case "TERMINATED": case "CANCELLED": return "bg-ink/[0.06] text-ink-muted border-ink/[0.08]";
        default: return "bg-ink/[0.04] text-ink-muted/60 border-ink/[0.06]";
    }
};
const leaseStatusDot = (status: string | null) => {
    switch (status) {
        case "ACTIVE": return "bg-success";
        case "PENDING_ACTIVATION": return "bg-warning";
        case "PENDING_APPROVAL": return "bg-info";
        case "AWAITING_DEPOSIT": return "bg-brand";
        case "EXPIRED": case "TERMINATED": case "CANCELLED": return "bg-ink-muted/40";
        default: return "bg-ink-muted/20";
    }
};

const TYPE_FILTERS: { label: string; value: RentTransactionType | "" }[] = [
    { label: "All types", value: "" },
    { label: "Payments", value: "PAYMENT" },
    { label: "Rent charges", value: "RENT_CHARGE" },
    { label: "Deposits", value: "DEPOSIT" },
    { label: "Waivers", value: "WAIVER" },
    { label: "Refunds", value: "REFUND" },
    { label: "Adjustments", value: "ADJUSTMENT" },
];

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

type SortKey = "occurredAt" | "amount" | "type" | "tenantFullName";
type SortDir = "asc" | "desc";

function SortIcon({ column, activeKey, dir }: { column: SortKey; activeKey: SortKey | null; dir: SortDir }) {
    if (activeKey !== column) return <ArrowUpDown className="h-3 w-3 text-ink-muted/30 group-hover:text-ink-muted/60 transition-colors" strokeWidth={1.5} />;
    return dir === "asc"
        ? <ArrowUp className="h-3 w-3 text-brand" strokeWidth={2.5} />
        : <ArrowDown className="h-3 w-3 text-brand" strokeWidth={2.5} />;
}

function ConfirmDeleteTransactionDialog({
    open,
    transaction,
    onConfirm,
    onCancel,
    isLoading,
}: {
    open: boolean;
    transaction: { id: string; type: string; amount: number; date: string; tenantName: string | null } | null;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    if (!open || !transaction) return null;

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

    const typeLabel = transaction.type.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-surface rounded-2xl border border-border shadow-dropdown p-6 max-w-sm w-full mx-4 animate-fade-in-up">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/20 to-danger/10 shadow-sm ring-1 ring-danger/20">
                    <Trash2 className="h-6 w-6 text-danger" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-ink text-center mb-1">Delete transaction</h3>
                <p className="text-sm text-ink-muted text-center mb-5">
                    This will permanently remove this {typeLabel.toLowerCase()} from the system. This action cannot be undone.
                </p>
                <div className="bg-ink/[0.03] rounded-xl border border-border/50 px-4 py-3 mb-5 space-y-1.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-ink-muted">Type</span>
                        <span className="font-medium text-ink">{typeLabel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-ink-muted">Amount</span>
                        <span className="font-medium text-ink">{fmt(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-ink-muted">Date</span>
                        <span className="font-medium text-ink">{transaction.date}</span>
                    </div>
                    {transaction.tenantName && (
                        <div className="flex justify-between text-sm">
                            <span className="text-ink-muted">Tenant</span>
                            <span className="font-medium text-ink text-right max-w-[200px] truncate">{transaction.tenantName}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm font-medium text-ink hover:bg-ink/[0.02] transition-all duration-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger-dark transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shadow-sm shadow-danger/20"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        )}
                        Delete permanently
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentsPage() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState<number>(25);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<RentTransactionType | "">("");
    const [showSystem, setShowSystem] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("occurredAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string; amount: number; date: string; tenantName: string | null } | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const router = useRouter();
    const { isOwner, isManager } = useCurrentUser();
    const { deleteTransaction, isLoading: isDeleting } = useDeleteTransaction();
    const canDelete = isOwner || isManager;

    const { data: transactions, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ["rent-ledger", "all-transactions"],
        queryFn: () => rentLedgerApi.getAllTransactions(),
        refetchInterval: autoRefresh ? 30000 : false,
        staleTime: 10000,
    });

    const { data: allLeasesData, isLoading: leasesLoading } = useLeaseSearch({ page: 0, size: 200 });

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
    }, []);

    const pipelineStages = useMemo(() => {
        const allLeases = allLeasesData?.content ?? [];
        const allTransactions = transactions ?? [];

        const totalDeposits = allTransactions
            .filter((tx) => tx.type === "DEPOSIT")
            .reduce((sum, tx) => sum + tx.amount, 0);

        const pendingLeases = allLeases.filter((l) =>
            ["DRAFT", "PENDING_APPROVAL", "AWAITING_DEPOSIT", "PENDING_ACTIVATION"].includes(l.status)
        );

        const activeLeases = allLeases.filter((l) =>
            ["ACTIVE", "RENEWED"].includes(l.status)
        );

        const activeRentTotal = activeLeases.reduce((sum, l) => sum + l.rentAmount, 0);

        const totalPayments = allTransactions
            .filter((tx) => tx.type === "PAYMENT")
            .reduce((sum, tx) => sum + tx.amount, 0);

        const f = (n: number) =>
            new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

        return [
            { label: "Deposits In", value: f(totalDeposits), sublabel: `${allTransactions.filter((t) => t.type === "DEPOSIT").length} deposits`, icon: Landmark, color: "text-info-dark" },
            { label: "Pending", value: String(pendingLeases.length), sublabel: `${pendingLeases.length} leases awaiting progression`, icon: Timer, color: "text-warning-dark" },
            { label: "Active", value: String(activeLeases.length), sublabel: `${activeLeases.length} leases in good standing`, icon: CheckCircle2, color: "text-success-dark" },
            { label: "Monthly Revenue", value: f(activeRentTotal), sublabel: `${activeLeases.length} active × monthly rent`, icon: TrendingUp, color: "text-brand-700" },
            { label: "Total Collected", value: f(totalDeposits + totalPayments), sublabel: `${allTransactions.length} transactions all time`, icon: Wallet, color: "text-ink-muted" },
        ];
    }, [transactions, allLeasesData]);

    const pipelineLoading = isLoading || leasesLoading;

    const toggleSort = (key: SortKey) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("desc");
        } else {
            setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        }
    };

    const filtered = useMemo(() => {
        if (!transactions) return [];
        const term = search.trim().toLowerCase();
        return transactions.filter((tx) => {
            if (typeFilter && tx.type !== typeFilter) return false;
            if (!showSystem && tx.source === "SYSTEM") return false;
            if (!term) return true;
            return (
                (tx.tenantFullName ?? "").toLowerCase().includes(term) ||
                (tx.leaseNumber ?? "").toLowerCase().includes(term) ||
                (tx.externalReference ?? "").toLowerCase().includes(term)
            );
        });
    }, [transactions, search, typeFilter, showSystem]);

    const sorted = useMemo(() => {
        const dir = sortDir === "asc" ? 1 : -1;
        return [...filtered].sort((a, b) => {
            if (sortKey === "occurredAt") return (new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()) * dir;
            if (sortKey === "amount") return (a.amount - b.amount) * dir;
            if (sortKey === "tenantFullName") return ((a.tenantFullName ?? "").localeCompare(b.tenantFullName ?? "")) * dir;
            return (a.type.localeCompare(b.type)) * dir;
        });
    }, [filtered, sortKey, sortDir]);

    const paged = useMemo(() => {
        const start = page * pageSize;
        return sorted.slice(start, start + pageSize);
    }, [sorted, page, pageSize]);

    const totalPages = Math.ceil(sorted.length / pageSize);
    const hasFilters = Boolean(typeFilter || search || !showSystem);

    const clearFilters = () => {
        setTypeFilter("");
        setSearch("");
        setShowSystem(false);
        setPage(0);
    };

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        await deleteTransaction(deleteTarget.id);
        setDeleteTarget(null);
    };

    const formatShortDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

    if (isLoading) {
        return (
            <div className="page-container space-y-6">
                <div className="skeleton h-9 w-56 rounded-xl" />
                <div className="skeleton h-4 w-80" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                </div>
                <div className="skeleton h-12 w-full rounded-2xl" />
                <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="skeleton h-12 w-full rounded-none border-b border-border/50" />
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-none border-t border-border/30" />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-container">
                <div className="max-w-md mx-auto mt-24 bg-surface rounded-2xl border border-border shadow-sm p-10 text-center animate-fade-in-up">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/20 to-danger/10 shadow-sm ring-1 ring-danger/20">
                        <AlertTriangle className="h-8 w-8 text-danger" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-semibold text-ink mb-1">Couldn&apos;t load transactions</p>
                    <p className="text-sm text-ink-muted mb-6 max-w-xs mx-auto">Something went wrong while fetching your data. Please try again.</p>
                    <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 transition-all duration-200">
                        <RefreshCw className="w-4 h-4" strokeWidth={2} />
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container space-y-6 pb-12">
            {/* ── Premium Header ── */}
            <div className="animate-fade-in-up">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/20 ring-1 ring-white/20">
                            <Receipt className="h-7 w-7 text-white" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight font-display">Transactions</h1>
                            <p className="text-sm text-ink-muted/80">Live feed of all payments, charges, and adjustments across your portfolio.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-surface text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="sr-only"
                            />
                            <span className={`relative inline-flex h-4 w-7 rounded-full transition-colors duration-300 ${autoRefresh ? "bg-brand" : "bg-ink/10"}`}>
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${autoRefresh ? "translate-x-3.5" : "translate-x-0.5"} mt-0.5`} />
                            </span>
                            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Auto
                        </label>
                        <button
                            onClick={handleRefresh}
                            disabled={isFetching}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/60 bg-surface text-sm font-medium text-ink-muted hover:text-ink hover:border-brand-200 hover:shadow-sm hover:bg-brand-50/30 transition-all duration-200 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} strokeWidth={1.5} />
                            {isFetching ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Money Flow Pipeline ── */}
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm overflow-hidden animate-fade-in-up">
                <div className="px-5 pt-4 pb-1">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                        </span>
                        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.15em]">Money Flow Pipeline</span>
                        <span className="text-ink-muted/20">·</span>
                        <span className="text-[11px] text-ink-muted/50">Live</span>
                    </div>
                </div>
                <div className="px-5 pb-5">
                    {pipelineLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent hidden lg:block" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {pipelineStages.map((stage, index) => (
                                    <div key={stage.label} className="animate-fade-in-up relative" style={{ animationDelay: `${index * 80}ms` }}>
                                        <div className="relative bg-surface rounded-xl border border-border/60 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-200/50 transition-all duration-300 h-full group">
                                            {index < pipelineStages.length - 1 && (
                                                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                                    <div className="w-6 h-6 rounded-full bg-surface border-2 border-border/60 flex items-center justify-center shadow-sm group-hover:border-brand-200/50 transition-colors">
                                                        <ChevronRight className="w-3 h-3 text-ink-muted/40" strokeWidth={2.5} />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stage.color.replace("text-", "from-").replace("-dark", "/20").replace("-muted", "/10")} to-transparent flex items-center justify-center shadow-sm ring-1 ring-white/10`}>
                                                    <stage.icon className={`w-5 h-5 ${stage.color}`} strokeWidth={1.5} />
                                                </div>
                                                <span className={`text-[10px] font-mono font-bold tabular-nums leading-none ${stage.color}`}>{stage.value}</span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">{stage.label}</p>
                                            <p className="text-[11px] text-ink-muted/60 mt-0.5">{stage.sublabel}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Filters Card ── */}
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm animate-fade-in-up">
                <div className="px-5 pt-4 pb-1">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-ink/[0.04] text-xs font-medium text-ink-muted">
                            <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span className="hidden sm:inline">Filters</span>
                            <span className="text-ink-muted/20">·</span>
                            <span className="font-semibold text-ink">{sorted.length}</span>
                            <span className="text-ink-muted/50">transaction{sorted.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasFilters && (
                                <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-danger hover:bg-danger/5 transition-colors">
                                    <X className="w-3 h-3" strokeWidth={2} />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="px-5 pb-5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/50" strokeWidth={1.5} />
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                placeholder="Search tenant, lease, or receipt..."
                                className="form-input w-full !pl-10 text-sm bg-ink/[0.02] border-border/60 focus:bg-surface transition-all duration-200 focus:shadow-md focus:shadow-brand/5 focus:border-brand-300/70"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/40 hover:text-ink-muted transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
                            {TYPE_FILTERS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setTypeFilter(opt.value); setPage(0); }}
                                    className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                                        typeFilter === opt.value
                                            ? "bg-brand text-white border-brand shadow-sm shadow-brand/20"
                                            : "bg-ink/[0.03] text-ink-muted border-transparent hover:bg-ink/[0.06] hover:text-ink"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                            <button
                                onClick={() => { setShowSystem(!showSystem); setPage(0); }}
                                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                                    showSystem
                                        ? "bg-ink/[0.06] text-ink border-ink/[0.15]"
                                        : "bg-brand text-white border-brand shadow-sm shadow-brand/20"
                                }`}
                            >
                                {showSystem ? "Showing system" : "Real payments"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table Card ── */}
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm animate-fade-in-up overflow-hidden">
                {transactions && transactions.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ink/[0.05] to-ink/[0.02] shadow-sm ring-1 ring-ink/[0.06]">
                            <Receipt className="w-8 h-8 text-ink-muted/40" strokeWidth={1.5} />
                        </div>
                        <p className="text-base font-semibold text-ink mb-1">No transactions yet</p>
                        <p className="text-sm text-ink-muted max-w-xs mx-auto">Transactions appear here once rent charges, deposits, or payments are posted to your portfolio.</p>
                    </div>
                ) : paged.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ink/[0.05] to-ink/[0.02] shadow-sm ring-1 ring-ink/[0.06]">
                            <Search className="w-8 h-8 text-ink-muted/40" strokeWidth={1.5} />
                        </div>
                        <p className="text-base font-semibold text-ink mb-1">No matching transactions</p>
                        <p className="text-sm text-ink-muted">Try a different search term or filter.</p>
                    </div>
                ) : (
                    <>
                        {/* Table header summary */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-ink/[0.015]">
                            <div className="flex items-center gap-3 text-xs text-ink-muted">
                                <span className="font-semibold text-ink">{sorted.length} result{sorted.length !== 1 ? "s" : ""}</span>
                                <span className="text-ink-muted/20">|</span>
                                <span>{formatCurrency(sorted.reduce((s, t) => s + t.amount, 0))} total volume</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                                    className="text-xs bg-transparent border border-border/40 rounded-lg px-2 py-1 text-ink-muted focus:border-brand-300 outline-none"
                                >
                                    {PAGE_SIZE_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s} / page</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-border/60 bg-ink/[0.02]">
                                    {[
                                        { key: "occurredAt" as SortKey, label: "Date", icon: CalendarDays },
                                        { key: "tenantFullName" as SortKey, label: "Tenant", icon: User },
                                        { key: "type" as SortKey, label: "Type", icon: null },
                                        { key: "amount" as SortKey, label: "Amount", icon: CircleDollarSign },
                                        { key: null, label: "Source", icon: null },
                                        { key: null, label: "Reference", icon: null },
                                        { key: null, label: "Lease", icon: FileText },
                                        { key: null, label: "Status", icon: null },
                                        ...(canDelete ? [{ key: null, label: "", icon: null }] : []),
                                    ].map((col) => (
                                        <th key={col.label} className="py-3.5 px-5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-[0.12em]">
                                            {col.key ? (
                                                <button onClick={() => toggleSort(col.key)} className="group inline-flex items-center gap-1.5 hover:text-ink transition-colors">
                                                    {col.icon && <col.icon className="w-3 h-3 text-ink-muted/40" strokeWidth={1.5} />}
                                                    {col.label}
                                                    <SortIcon column={col.key} activeKey={sortKey} dir={sortDir} />
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5">
                                                    {col.icon && <col.icon className="w-3 h-3" strokeWidth={1.5} />}
                                                    {col.label}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                {paged.map((tx) => {
                                    const cfg = typeConfig[tx.type] ?? typeConfig.RENT_CHARGE;
                                    const src = sourceMeta[tx.source] ?? sourceMeta.SYSTEM;
                                    const SrcIcon = src.icon;
                                    const TypeIcon = cfg.icon;

                                    return (
                                        <tr
                                            key={tx.id}
                                            onClick={() => router.push(`/dashboard/leases/${tx.leaseId}`)}
                                            className="group cursor-pointer hover:bg-gradient-to-r hover:from-brand-50/30 hover:to-transparent active:bg-ink/[0.03] transition-all duration-150"
                                        >
                                            <td className="py-4 px-5 whitespace-nowrap w-[130px]">
                                                <p className="text-sm font-semibold text-ink leading-tight">{formatDate(tx.occurredAt)}</p>
                                                <p className="text-xs text-ink-muted/50 mt-0.5 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-ink-muted/20" />
                                                    {formatTime(tx.occurredAt)}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getInitialsBg(tx.tenantFullName ?? tx.leaseNumber)} flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/50`}>
                                                        <span className="text-xs font-bold text-ink">{getInitials(tx.tenantFullName ?? tx.leaseNumber)}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-ink leading-snug truncate max-w-[180px]">{tx.tenantFullName || "—"}</p>
                                                        {tx.tenantPhone && (
                                                            <p className="text-xs text-ink-muted/60 mt-0.5 truncate">{tx.tenantPhone}</p>
                                                        )}
                                                        {tx.leaseNumber && (
                                                            <p className="text-[10px] text-ink-muted/40 mt-0.5 font-mono truncate">{tx.leaseNumber}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.chip}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    <TypeIcon className="w-3 h-3" strokeWidth={1.5} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex flex-col">
                                                    <span className={`font-data text-sm font-bold tabular-nums leading-tight ${
                                                        tx.type === "RENT_CHARGE" || tx.type === "ADJUSTMENT"
                                                            ? "text-ink"
                                                            : tx.type === "DEPOSIT" || tx.type === "PAYMENT"
                                                                ? "text-success-dark"
                                                                : "text-warning-dark"
                                                    }`}>
                                                        {tx.type === "RENT_CHARGE" || tx.type === "ADJUSTMENT" ? "−" : "+"}{formatCurrency(tx.amount)}
                                                    </span>
                                                    <span className={`text-[10px] font-medium mt-0.5 ${cfg.color}`}>{cfg.label}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${src.chip}`}>
                                                    <SrcIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                    {src.label}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className="text-xs font-mono text-ink-muted/60 group-hover:text-ink-muted transition-colors">
                                                    {tx.externalReference || <span className="text-ink-muted/20">&mdash;</span>}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-ink/[0.03] group-hover:bg-ink/[0.05] transition-colors border border-transparent group-hover:border-border/40">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-success shadow-sm shadow-success/30" />
                                                    <span className="text-xs font-mono font-semibold text-ink/80 group-hover:text-ink transition-colors">
                                                        {tx.leaseNumber || <span className="text-ink-muted/20">&mdash;</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${leaseStatusChip(tx.leaseStatus)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${leaseStatusDot(tx.leaseStatus)}`} />
                                                    {tx.leaseStatus || "—"}
                                                </span>
                                            </td>
                                            {canDelete && tx.type !== "RENT_CHARGE" && (
                                                <td className="py-4 px-3 w-[52px]">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteTarget({
                                                                id: tx.id,
                                                                type: tx.type,
                                                                amount: tx.amount,
                                                                date: formatShortDate(tx.occurredAt),
                                                                tenantName: tx.tenantFullName,
                                                            });
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-ink-muted/30 hover:text-danger hover:bg-danger/[0.06] hover:border-danger/20 transition-all duration-200"
                                                        title="Delete transaction"
                                                    >
                                                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Premium Pagination */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-border/50 bg-ink/[0.015]">
                            <p className="text-xs text-ink-muted/70">
                                {sorted.length > 0
                                    ? <>
                                        <span className="font-medium text-ink-muted">{page * pageSize + 1}</span>
                                        <span className="mx-1">–</span>
                                        <span className="font-medium text-ink-muted">{Math.min((page + 1) * pageSize, sorted.length)}</span>
                                        <span className="mx-1.5">of</span>
                                        <span className="font-semibold text-ink">{sorted.length}</span>
                                    </>
                                    : "No results"}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(0)}
                                    disabled={page === 0}
                                    className="px-2 py-1.5 rounded-lg text-xs font-medium text-ink-muted/50 hover:text-ink-muted hover:bg-ink/[0.04] transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                    title="First page"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium text-ink-muted hover:text-ink hover:border-brand-200/50 hover:bg-brand-50/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border/50 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                                    <span className="hidden sm:inline">Prev</span>
                                </button>

                                {/* Page numbers */}
                                <div className="hidden sm:flex items-center gap-1">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                                        const pageNum = start + i;
                                        if (pageNum >= totalPages) return null;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                                    pageNum === page
                                                        ? "bg-brand text-white shadow-sm shadow-brand/20"
                                                        : "text-ink-muted hover:text-ink hover:bg-ink/[0.04]"
                                                }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium text-ink-muted hover:text-ink hover:border-brand-200/50 hover:bg-brand-50/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border/50 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                                </button>
                                <button
                                    onClick={() => setPage(totalPages - 1)}
                                    disabled={page >= totalPages - 1}
                                    className="px-2 py-1.5 rounded-lg text-xs font-medium text-ink-muted/50 hover:text-ink-muted hover:bg-ink/[0.04] transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                    title="Last page"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ConfirmDeleteTransactionDialog
                open={deleteTarget !== null}
                transaction={deleteTarget}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                isLoading={isDeleting}
            />
        </div>
    );
}

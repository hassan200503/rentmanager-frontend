"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Receipt,
    AlertTriangle,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    Smartphone,
    Banknote,
    RefreshCw,
    X,
    SlidersHorizontal,
} from "lucide-react";
import { rentLedgerApi } from "@/features/rentledger/api/rent-ledger-api";
import { RentTransactionSummaryResponse, RentTransactionType, RentTransactionSource } from "@/features/rentledger/types/rent-ledger-response";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" }) +
        " " + d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
};

const typeLabels: Record<RentTransactionType, string> = {
    RENT_CHARGE: "Rent charge",
    PAYMENT: "Payment",
    WAIVER: "Waiver",
    REFUND: "Refund",
    CREDIT_APPLIED: "Credit applied",
    ADJUSTMENT: "Adjustment",
    DEPOSIT: "Deposit",
};

const typeColors: Record<RentTransactionType, string> = {
    RENT_CHARGE: "text-ink-muted bg-ink/[0.05]",
    PAYMENT: "text-success-dark bg-success/10",
    WAIVER: "text-warning-dark bg-warning/10",
    REFUND: "text-danger bg-danger/10",
    CREDIT_APPLIED: "text-primary-dark bg-primary-light",
    ADJUSTMENT: "text-ink-muted bg-ink/[0.05]",
    DEPOSIT: "text-info-dark bg-info/10",
};

const sourceIcon: Record<RentTransactionSource, typeof Smartphone> = {
    MPESA: Smartphone,
    CASH: Banknote,
    ADMIN_ADJUSTMENT: RefreshCw,
    SYSTEM: RefreshCw,
};

const PAGE_SIZE = 25;

type SortKey = "occurredAt" | "amount" | "type" | "tenantFullName";
type SortDir = "asc" | "desc";

function SortIcon({ column, activeKey, dir }: { column: SortKey; activeKey: SortKey | null; dir: SortDir }) {
    if (activeKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={2} />;
    return dir === "asc"
        ? <ArrowUp className="h-3 w-3" strokeWidth={2} />
        : <ArrowDown className="h-3 w-3" strokeWidth={2} />;
}

const TYPE_FILTERS: { label: string; value: RentTransactionType | "" }[] = [
    { label: "All types", value: "" },
    { label: "Payments", value: "PAYMENT" },
    { label: "Rent charges", value: "RENT_CHARGE" },
    { label: "Deposits", value: "DEPOSIT" },
    { label: "Waivers", value: "WAIVER" },
    { label: "Refunds", value: "REFUND" },
    { label: "Adjustments", value: "ADJUSTMENT" },
];

export default function PaymentsPage() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<RentTransactionType | "">("");
    const [sortKey, setSortKey] = useState<SortKey>("occurredAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const { data: transactions, isLoading, isError, refetch } = useQuery({
        queryKey: ["rent-ledger", "all-transactions"],
        queryFn: () => rentLedgerApi.getAllTransactions(),
    });

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
            if (!term) return true;
            return (
                (tx.tenantFullName ?? "").toLowerCase().includes(term) ||
                (tx.leaseNumber ?? "").toLowerCase().includes(term) ||
                (tx.externalReference ?? "").toLowerCase().includes(term)
            );
        });
    }, [transactions, search, typeFilter]);

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
        const start = page * PAGE_SIZE;
        return sorted.slice(start, start + PAGE_SIZE);
    }, [sorted, page]);

    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const hasFilters = Boolean(typeFilter || search);

    const clearFilters = () => {
        setTypeFilter("");
        setSearch("");
        setPage(0);
    };

    if (isLoading) {
        return (
            <div className="page-container space-y-6">
                <div className="skeleton h-8 w-48 mb-1" />
                <div className="skeleton h-4 w-72 mb-6" />
                <div className="card space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-container">
                <div className="card border-danger/20 bg-danger/[0.03] text-center py-10">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load transactions</p>
                    <p className="text-xs text-ink-muted mb-4">Please refresh the page. If this keeps happening, contact support.</p>
                    <button onClick={() => refetch()} className="btn-outline mx-auto">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                        <Receipt className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="page-title mb-1">Transactions</h1>
                        <p className="page-subtitle mb-0">Live feed of all payments, charges, and adjustments across your portfolio.</p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    className="btn-secondary inline-flex items-center gap-1.5"
                >
                    <RefreshCw className="h-4 w-4" strokeWidth={2} />
                    Refresh
                </button>
            </div>

            <div className="card-sm animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                        Filters
                        <span className="text-ink-muted font-normal">· {sorted.length} transactions</span>
                    </div>
                    {hasFilters && (
                        <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors">
                            <X className="h-3 w-3" strokeWidth={2} />
                            Clear filters
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Search tenant, lease, or receipt..."
                            className="form-input pl-8 w-full"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value as RentTransactionType | ""); setPage(0); }}
                        className="form-input max-w-xs"
                    >
                        {TYPE_FILTERS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card animate-fade-in-up">
                {transactions && transactions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                            <Receipt className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-medium text-ink mb-1">No transactions yet</p>
                            <p className="text-xs text-ink-muted">Transactions appear here once rent charges, deposits, or payments are posted.</p>
                    </div>
                ) : paged.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                            <Search className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-medium text-ink mb-1">No matching transactions</p>
                        <p className="text-xs text-ink-muted">Try a different search term or filter.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-ink-muted border-b border-ink/10">
                                        <th className="py-2 px-2 font-medium">
                                            <button onClick={() => toggleSort("occurredAt")} className="inline-flex items-center gap-1 hover:text-ink transition-colors">
                                                Date <SortIcon column="occurredAt" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2 px-2 font-medium">
                                            <button onClick={() => toggleSort("tenantFullName")} className="inline-flex items-center gap-1 hover:text-ink transition-colors">
                                                Tenant <SortIcon column="tenantFullName" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2 px-2 font-medium">
                                            <button onClick={() => toggleSort("type")} className="inline-flex items-center gap-1 hover:text-ink transition-colors">
                                                Type <SortIcon column="type" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2 px-2 font-medium">
                                            <button onClick={() => toggleSort("amount")} className="inline-flex items-center gap-1 hover:text-ink transition-colors">
                                                Amount <SortIcon column="amount" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2 px-2 font-medium">Source</th>
                                        <th className="py-2 px-2 font-medium">Reference</th>
                                        <th className="py-2 px-2 font-medium">Lease</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.map((tx) => {
                                        const SourceIcon = sourceIcon[tx.source] || RefreshCw;
                                        return (
                                            <tr key={tx.id} className="border-b border-ink/[0.06] last:border-0 hover:bg-ink/[0.02] transition-colors group">
                                                <td className="py-3 px-2 text-ink-muted whitespace-nowrap">
                                                    <p className="text-xs font-medium text-ink">{formatDate(tx.occurredAt)}</p>
                                                    <p className="text-[11px] text-ink-muted">
                                                        {new Date(tx.occurredAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <p className="text-sm font-medium text-ink">{tx.tenantFullName || "—"}</p>
                                                    {tx.tenantPhone && (
                                                        <p className="text-[11px] text-ink-muted">{tx.tenantPhone}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${typeColors[tx.type] || ""}`}>
                                                        {typeLabels[tx.type] || tx.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 font-data text-ink">
                                                    {tx.type === "RENT_CHARGE" ? "−" : "+"}{formatCurrency(tx.amount)}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <SourceIcon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                                                        <span className="text-xs text-ink-muted capitalize">{tx.source.toLowerCase().replace(/_/g, " ")}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="text-xs text-ink-muted font-mono">{tx.externalReference || "—"}</span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="text-xs text-ink-muted">{tx.leaseNumber || "—"}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-ink/[0.06]">
                            <p className="text-xs text-ink-muted">
                                {sorted.length > 0
                                    ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, sorted.length)} of ${sorted.length}`
                                    : "No results"}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="btn-secondary inline-flex items-center gap-1 text-xs py-1.5 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="btn-secondary inline-flex items-center gap-1 text-xs py-1.5 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
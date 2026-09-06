"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Plus, AlertTriangle, ChevronRight,
    Search, Download, X, ArrowUpDown, ArrowUp, ArrowDown, Wallet,
    CheckCircle2, CalendarClock, ChevronLeft, Lock, Phone, MessageCircle,
    Building2, AlertOctagon,
} from "lucide-react";
import { useLeaseSearch } from "@/features/lease/hooks/use-lease-search";
import { useLeaseStatsQuery } from "@/features/lease/hooks/use-lease-stats-query";
import { LeaseStatusBadge } from "@/features/lease/components/lease-status-badge";
import { RentLedgerStatusBadge } from "@/features/rentledger/components/rent-ledger-status-badge";
import { LeaseAttentionPanel } from "@/features/lease/components/lease-attention-panel";
import { LeaseStatCard } from "@/features/lease/components/lease-stat-card";
import { LeaseSummaryResponse, LeaseStatus } from "@/features/lease/types/lease-response";
import { exportLeasesToCsv } from "@/features/lease/utils/lease-csv-export";
import { useLeaseBalanceByLeaseQuery } from "@/features/rentledger/hooks/use-lease-balance-by-lease-query";
import { LeaseBalanceSummaryResponse } from "@/features/rentledger/types/rent-ledger-response";
import { formatCurrency, toMoneyNumber } from "@/shared/utils/money";
import { useHasRole } from "@/features/user/hooks/use-has-role";
import { WRITE_ROLES } from "@/features/user/lib/roles";

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

/** Leases whose lease is live enough to owe rent right now — mirrors lease-date-utils.ts. */
const LIVE_STATUSES: LeaseStatus[] = ["ACTIVE", "RENEWED"];

const STATUS_FILTER_OPTIONS: { label: string; value: LeaseStatus | "" }[] = [
    { label: "All statuses", value: "" },
    { label: "Draft", value: "DRAFT" },
    { label: "Pending Approval", value: "PENDING_APPROVAL" },
    { label: "Awaiting Deposit", value: "AWAITING_DEPOSIT" },
    { label: "Pending Activation", value: "PENDING_ACTIVATION" },
    { label: "Active", value: "ACTIVE" },
    { label: "Renewed", value: "RENEWED" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Terminated", value: "TERMINATED" },
    { label: "Suspended", value: "SUSPENDED" },
];

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type SortKey = "tenantFullName" | "endDate" | "rentAmount" | "status";
type SortDir = "asc" | "desc";

function SortIcon({ column, activeKey, dir }: { column: SortKey; activeKey: SortKey | null; dir: SortDir }) {
    if (activeKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" strokeWidth={2} />;
    return dir === "asc"
        ? <ArrowUp className="h-3 w-3" strokeWidth={2} />
        : <ArrowDown className="h-3 w-3" strokeWidth={2} />;
}

/**
 * Rent status is distinct from lease lifecycle status (the "Lease" column):
 * a lease can be ACTIVE and still be OVERDUE on this month's rent. Only
 * live leases (ACTIVE/RENEWED) show a rent status at all — a draft or
 * terminated lease was never charging rent in the first place, so neither
 * "overdue" nor "paid up" is a true claim about it.
 */
function RentStatusCell({ lease, balance }: { lease: LeaseSummaryResponse; balance?: LeaseBalanceSummaryResponse }) {
    if (!LIVE_STATUSES.includes(lease.status)) {
        return <span className="text-xs text-fg-subtle dark:text-fg-subtle-dark">—</span>;
    }
    if (!balance) {
        return (
            <span className="pill pill-success inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                Paid up
            </span>
        );
    }
    return (
        <div className="flex flex-col gap-0.5">
            <RentLedgerStatusBadge status={balance.status} />
            {balance.status !== "OVERPAID" && (
                <span className="text-[11px] font-mono-nums text-fg-muted dark:text-fg-muted-dark">
                    {formatCurrency(balance.outstandingBalance)}
                </span>
            )}
        </div>
    );
}

export default function LeasesPage() {
    const router = useRouter();
    const canWrite = useHasRole(WRITE_ROLES);

    const [statusFilter, setStatusFilter] = useState<LeaseStatus | "">("");
    const [searchInput, setSearchInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Debounced so every keystroke doesn't hit the search endpoint — only
    // fires once typing pauses. The search itself runs server-side (see
    // useLeaseSearch below), unlike the client-side filter this replaced,
    // which only ever searched whichever page was already loaded.
    useEffect(() => {
        const timer = setTimeout(() => {
            setKeyword(searchInput);
            setPage(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data, isLoading, isError } = useLeaseSearch({
        status: statusFilter || undefined,
        keyword: keyword || undefined,
        page,
        size: PAGE_SIZE,
    });
    const { data: stats } = useLeaseStatsQuery();
    const { data: balanceData } = useLeaseBalanceByLeaseQuery();

    const balanceByLease = useMemo(() => {
        const map = new Map<string, LeaseBalanceSummaryResponse>();
        balanceData?.forEach((b) => map.set(b.leaseId, b));
        return map;
    }, [balanceData]);

    // Portfolio-wide (balanceByLease already is, independent of this page's
    // pagination/filters) — the single most actionable number on this page.
    const overdue = useMemo(() => {
        let count = 0;
        let amount = 0;
        balanceData?.forEach((b) => {
            if (b.status === "OVERDUE") {
                count += 1;
                amount += toMoneyNumber(b.outstandingBalance);
            }
        });
        return { count, amount };
    }, [balanceData]);

    const rawLeases: LeaseSummaryResponse[] = useMemo(() => data?.content ?? [], [data]);
    const totalElements: number = data?.totalElements ?? rawLeases.length;
    const totalPages: number = data?.totalPages ?? 1;

    // Sorting is still applied client-side to the current page only — the
    // search endpoint doesn't take a sort param. Honest about its scope
    // (it reorders what's visible, it doesn't claim to reorder the
    // portfolio), unlike the old client-side keyword filter this page used
    // to have, which silently searched only the loaded page and nothing
    // else.
    const sortedLeases = useMemo(() => {
        if (!sortKey) return rawLeases;
        const dir = sortDir === "asc" ? 1 : -1;
        return [...rawLeases].sort((a, b) => {
            if (sortKey === "rentAmount") return (toMoneyNumber(a.rentAmount) - toMoneyNumber(b.rentAmount)) * dir;
            if (sortKey === "endDate") return (new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) * dir;
            const aVal = (a as unknown as Record<string, string | number | null>)[sortKey] ?? a.leaseNumber;
            const bVal = (b as unknown as Record<string, string | number | null>)[sortKey] ?? b.leaseNumber;
            return String(aVal).localeCompare(String(bVal)) * dir;
        });
    }, [rawLeases, sortKey, sortDir]);

    const displayName = (lease: LeaseSummaryResponse) => lease.tenantFullName || lease.leaseNumber;

    const toggleSort = (key: SortKey) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
        } else {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        }
    };

    const toggleSelected = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelected((prev) =>
            prev.size === sortedLeases.length ? new Set() : new Set(sortedLeases.map((l) => l.id))
        );
    };

    const hasFilters = Boolean(statusFilter || searchInput);
    const clearFilters = () => {
        setStatusFilter("");
        setSearchInput("");
        setKeyword("");
        setPage(0);
    };

    const handleExportSelected = () => {
        const toExport = selected.size > 0
            ? sortedLeases.filter((l) => selected.has(l.id))
            : sortedLeases;
        exportLeasesToCsv(toExport, `leases-page-${page + 1}.csv`, balanceByLease);
    };

    return (
        <div className="page-container space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                        <Users className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="page-title mb-1">Tenants</h1>
                        <p className="page-subtitle mb-0">Residents, lease terms, and rent status across your portfolio</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportSelected}
                        disabled={sortedLeases.length === 0}
                        className="btn-secondary"
                    >
                        <Download className="h-4 w-4" strokeWidth={2} />
                        Export{selected.size > 0 ? ` (${selected.size})` : ""}
                    </button>
                    {canWrite ? (
                        <button
                            onClick={() => router.push("/dashboard/leases/create")}
                            className="btn-primary"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            New lease
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink/[0.04] border border-border text-xs text-fg-muted dark:text-fg-muted-dark">
                            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            Only owners and managers can create leases
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-fade-in-up">
                <LeaseStatCard
                    label="Total tenants"
                    value={(stats?.totalTenants ?? 0).toLocaleString()}
                    caption="across your portfolio"
                    icon={Users}
                />
                <LeaseStatCard
                    label="Active now"
                    value={(stats?.activeCount ?? 0).toLocaleString()}
                    caption="across your portfolio"
                    icon={CheckCircle2}
                />
                <LeaseStatCard
                    label="Expiring soon"
                    value={(stats?.expiringSoonCount ?? 0).toLocaleString()}
                    caption="within 30 days"
                    icon={CalendarClock}
                    tone={(stats?.expiringSoonCount ?? 0) > 0 ? "warning" : "default"}
                />
                <LeaseStatCard
                    label="Rent overdue"
                    value={overdue.count.toLocaleString()}
                    caption={overdue.count > 0 ? formatCurrency(overdue.amount) : "nothing overdue"}
                    icon={AlertOctagon}
                    tone={overdue.count > 0 ? "danger" : "default"}
                />
                <LeaseStatCard
                    label="Monthly rent"
                    value={formatCurrency(stats?.monthlyRent ?? 0)}
                    caption="active leases, portfolio-wide"
                    icon={Wallet}
                />
            </div>

            <LeaseAttentionPanel leases={rawLeases} />

            <div className="space-y-6">
                <div className="card-sm animate-fade-in-up">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                            <Search className="h-3.5 w-3.5" strokeWidth={2} />
                            Filters
                        </div>
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                            >
                                <X className="h-3 w-3" strokeWidth={2} />
                                Clear filters
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search name, phone, or lease #..."
                                className="form-input !pl-8 w-full"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as LeaseStatus | "");
                                setPage(0);
                            }}
                            className="form-input max-w-xs"
                        >
                            {STATUS_FILTER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selected.size > 0 && (
                    <div className="card-sm flex items-center justify-between bg-brand-50/60 dark:bg-brand-800/40 border-brand-200 dark:border-brand-700">
                        <p className="text-xs font-medium text-fg dark:text-fg-dark">{selected.size} selected</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportSelected}
                                className="btn-secondary text-xs py-1.5"
                            >
                                <Download className="h-3.5 w-3.5" strokeWidth={2} />
                                Export selected
                            </button>
                            <button
                                onClick={() => setSelected(new Set())}
                                className="text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                <div className="card animate-fade-in-up overflow-hidden !p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-2">
                            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg dark:bg-danger-bg-dark">
                                <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                            </div>
                            <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load leases</p>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Please refresh the page. If this keeps happening, contact support.</p>
                        </div>
                    ) : sortedLeases.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                                <Users className="h-5 w-5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                            </div>
                            <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No tenants found</p>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                                {hasFilters
                                    ? "Try a different search term or status filter."
                                    : "No tenants yet — they appear once a lease is created."}
                            </p>
                            {canWrite && (
                                <button
                                    onClick={() => router.push("/dashboard/leases/create")}
                                    className="btn-primary inline-flex mx-auto"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={2} />
                                    New lease
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="max-h-[32rem] overflow-y-auto overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-sm">
                                    <tr className="text-left text-fg-muted dark:text-fg-muted-dark border-b border-border dark:border-border-dark">
                                        <th className="py-2.5 px-3 w-8">
                                            <input
                                                type="checkbox"
                                                checked={selected.size > 0 && selected.size === sortedLeases.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-border dark:border-border-dark"
                                                aria-label="Select all tenants"
                                            />
                                        </th>
                                        <th className="py-2.5 px-3 font-medium text-xs uppercase tracking-wide">
                                            <button onClick={() => toggleSort("tenantFullName")} className="inline-flex items-center gap-1 hover:text-fg dark:hover:text-fg-dark transition-colors">
                                                Tenant <SortIcon column="tenantFullName" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2.5 px-3 font-medium text-xs uppercase tracking-wide">
                                            Property / Unit
                                        </th>
                                        <th className="py-2.5 px-3 font-medium text-xs uppercase tracking-wide">
                                            <button onClick={() => toggleSort("endDate")} className="inline-flex items-center gap-1 hover:text-fg dark:hover:text-fg-dark transition-colors">
                                                Term <SortIcon column="endDate" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2.5 px-3 font-medium text-xs uppercase tracking-wide">
                                            <button onClick={() => toggleSort("rentAmount")} className="inline-flex items-center gap-1 hover:text-fg dark:hover:text-fg-dark transition-colors">
                                                Rent <SortIcon column="rentAmount" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2.5 px-3 font-medium text-xs uppercase tracking-wide">
                                            <button onClick={() => toggleSort("status")} className="inline-flex items-center gap-1 hover:text-fg dark:hover:text-fg-dark transition-colors">
                                                Lease <SortIcon column="status" activeKey={sortKey} dir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="py-2.5 px-3 font-medium text-xs uppercase tracking-wide">
                                            Rent status
                                        </th>
                                        <th className="py-2.5 px-3 w-8" />
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sortedLeases.map((lease) => (
                                        <tr
                                            key={lease.id}
                                            className="border-b border-border-subtle dark:border-border-subtle-dark last:border-0 hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors group"
                                        >
                                            <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(lease.id)}
                                                    onChange={() => toggleSelected(lease.id)}
                                                    className="rounded border-border dark:border-border-dark"
                                                    aria-label={`Select ${displayName(lease)}`}
                                                />
                                            </td>
                                            <td
                                                onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                                className="py-3 px-3 font-medium text-fg dark:text-fg-dark cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-800 text-[11px] font-semibold text-brand-dark dark:text-brand-200">
                                                        {(lease.tenantFullName ?? lease.leaseNumber).slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium group-hover:text-brand dark:group-hover:text-brand-300 transition-colors truncate">
                                                            {lease.tenantFullName || lease.leaseNumber}
                                                        </p>
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark truncate">
                                                                {lease.tenantFullName ? lease.leaseNumber : ""}
                                                                {lease.tenantPhone ? ` · ${lease.tenantPhone}` : ""}
                                                            </p>
                                                            {lease.tenantPhone && (
                                                                <span
                                                                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <a
                                                                        href={`tel:${lease.tenantPhone}`}
                                                                        title={`Call ${lease.tenantPhone}`}
                                                                        className="flex h-5 w-5 items-center justify-center rounded-md text-fg-muted dark:text-fg-muted-dark hover:text-brand hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
                                                                    >
                                                                        <Phone className="h-3 w-3" strokeWidth={2} />
                                                                    </a>
                                                                    <a
                                                                        href={`sms:${lease.tenantPhone}`}
                                                                        title={`Text ${lease.tenantPhone}`}
                                                                        className="flex h-5 w-5 items-center justify-center rounded-md text-fg-muted dark:text-fg-muted-dark hover:text-brand hover:bg-brand-50 dark:hover:bg-brand-800 transition-colors"
                                                                    >
                                                                        <MessageCircle className="h-3 w-3" strokeWidth={2} />
                                                                    </a>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                                className="py-3 px-3 cursor-pointer"
                                            >
                                                {lease.propertyName ? (
                                                    <div className="flex items-start gap-1.5 min-w-0">
                                                        <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                                        <div className="min-w-0">
                                                            <p className="text-fg dark:text-fg-dark truncate">{lease.propertyName}</p>
                                                            {lease.unitLabel && (
                                                                <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark truncate">{lease.unitLabel}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-fg-subtle dark:text-fg-subtle-dark">—</span>
                                                )}
                                            </td>
                                            <td
                                                onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                                className="py-3 px-3 text-fg-muted dark:text-fg-muted-dark cursor-pointer whitespace-nowrap"
                                            >
                                                {formatDate(lease.startDate)} – {formatDate(lease.endDate)}
                                            </td>
                                            <td
                                                onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                                className="py-3 px-3 font-mono-nums text-fg-muted dark:text-fg-muted-dark cursor-pointer"
                                            >
                                                {formatCurrency(lease.rentAmount)}
                                            </td>
                                            <td
                                                onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                                className="py-3 px-3 cursor-pointer"
                                            >
                                                <LeaseStatusBadge status={lease.status} />
                                            </td>
                                            <td
                                                onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                                className="py-3 px-3 cursor-pointer"
                                            >
                                                <RentStatusCell lease={lease} balance={balanceByLease.get(lease.id)} />
                                            </td>
                                            <td
                                                onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                                className="py-3 px-3 cursor-pointer"
                                            >
                                                <ChevronRight
                                                    className="h-3.5 w-3.5 text-fg-muted dark:text-fg-muted-dark opacity-0 group-hover:opacity-100 transition-opacity"
                                                    strokeWidth={2}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between px-3 py-3 border-t border-border dark:border-border-dark">
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    Page {page + 1} of {Math.max(totalPages, 1)} · {totalElements.toLocaleString()} total
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="btn-secondary text-xs py-1.5 px-2.5"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="btn-secondary text-xs py-1.5 px-2.5"
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
        </div>
    );
}

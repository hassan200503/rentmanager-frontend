"use client";

import { useEffect, useState } from "react";
import {
    Wallet,
    Loader2,
    AlertTriangle,
    Lock,
    Building2,
    Trash2,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    EmptyState,
    Pagination,
    PageHeader,
    TableSkeleton,
    formatCurrency,
    formatDate,
    formatRate,
} from "@/features/admin/components/admin-ui";
import {
    useAdminDefaultCommissionQuery,
    useAdminLandlordsQuery,
} from "@/features/admin/hooks/use-admin-queries";
import {
    useSetDefaultCommissionMutation,
    useSetLandlordCommissionMutation,
    useClearLandlordCommissionMutation,
} from "@/features/admin/hooks/use-admin-mutations";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";

const PAGE_SIZE = 10;

function DefaultCommissionCard() {
    const { isPlatformOwner } = usePlatformRole();
    const { data, isPending, isError } = useAdminDefaultCommissionQuery();
    const setDefault = useSetDefaultCommissionMutation();
    const [rate, setRate] = useState("");

    if (isPending) {
        return (
            <div className="card p-5">
                <div className="h-4 w-40 bg-fg-muted/20 dark:bg-fg-muted-dark/20 rounded animate-pulse mb-3" />
                <div className="h-10 w-full bg-fg-muted/10 dark:bg-fg-muted-dark/10 rounded animate-pulse" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card p-5 text-center">
                <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" strokeWidth={2} />
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Couldn&#39;t load default commission.</p>
            </div>
        );
    }

    const onSave = () => {
        const value = Number(rate);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            window.alert("Rate must be between 0 and 100 percent.");
            return;
        }
        setDefault.mutate({ ratePercent: value });
    };

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Platform default commission</h3>
                </div>
                <span className="text-xs text-fg-subtle dark:text-fg-subtle-dark">
                    {data.updatedAt ? `updated ${formatDate(data.updatedAt)}` : "applies to all landlords without an override"}
                </span>
            </div>
            <div className="text-4xl font-bold text-fg dark:text-fg-dark mb-4">
                {formatRate(data.ratePercent)}
                {data.ratePercent !== null && <span className="text-base font-medium text-fg-subtle dark:text-fg-subtle-dark"> / lease payment</span>}
            </div>
            {isPlatformOwner ? (
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="block text-xs text-fg-muted dark:text-fg-muted-dark mb-1">
                            New rate (%)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            placeholder={String(data.ratePercent ?? 0)}
                            className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                    </div>
                    <button
                        onClick={onSave}
                        disabled={setDefault.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                        {setDefault.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                        Save default
                    </button>
                </div>
            ) : (
                <p className="flex items-center gap-1.5 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                    <Lock className="h-3 w-3" strokeWidth={2} />
                    Changing the default commission requires platform owner access.
                </p>
            )}
        </div>
    );
}

function LandlordOverrides() {
    const { isPlatformOwner } = usePlatformRole();
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [page, setPage] = useState(0);
    const setOverride = useSetLandlordCommissionMutation();
    const clearOverride = useClearLandlordCommissionMutation();

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 350);
        return () => clearTimeout(t);
    }, [search, page]);

    const { data, isPending, isError } = useAdminLandlordsQuery({
        search: debounced || undefined,
        page,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
    });

    if (isPending) {
        return <TableSkeleton columns={5} rows={8} />;
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-8">
                <AlertTriangle className="h-6 w-6 text-warning mx-auto mb-2" strokeWidth={2} />
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Couldn&#39;t load landlord rates.</p>
            </div>
        );
    }

    if (data.empty) {
        return (
            <div className="card">
                <EmptyState
                    icon={Building2}
                    title="No landlords found"
                    description="There are no landlords matching the current search."
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <input
                type="search"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                }}
                placeholder="Search landlords…"
                className="w-full sm:w-80 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <div className="rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-border-subtle dark:bg-border-subtle-dark">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <th className="px-4 py-3">Landlord</th>
                                <th className="px-4 py-3">Effective rate</th>
                                <th className="px-4 py-3">Commission (all time)</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {data.content.map((l) => (
                                <tr key={l.id} className="hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                                <Building2 className="h-4 w-4 text-amber-700 dark:text-amber-300" strokeWidth={2} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-fg dark:text-fg-dark">{l.name}</p>
                                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">@{l.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-fg dark:text-fg-dark">
                                        {formatRate(l.effectiveCommissionRate)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                        {formatCurrency(l.commissionAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        {isPlatformOwner ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const input = window.prompt(`Commission rate for ${l.name} (%)`, String(l.effectiveCommissionRate ?? ""));
                                                        if (input === null) return;
                                                        const value = Number(input);
                                                        if (!Number.isFinite(value) || value < 0 || value > 100) {
                                                            window.alert("Rate must be between 0 and 100 percent.");
                                                            return;
                                                        }
                                                        setOverride.mutate({ landlordId: l.id, ratePercent: value });
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand/30 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand/10 transition-colors"
                                                >
                                                    <Wallet className="h-3 w-3" strokeWidth={2} />
                                                    Override
                                                </button>
                                                {l.effectiveCommissionRate !== null && l.effectiveCommissionRate !== undefined && (
                                                    <button
                                                        onClick={() => {
                                                            if (!window.confirm(`Remove the commission override for ${l.name}?`)) return;
                                                            clearOverride.mutate(l.id);
                                                        }}
                                                        className="ml-1.5 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-danger/30 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-3 w-3" strokeWidth={2} />
                                                        Clear
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-fg-subtle dark:text-fg-subtle-dark bg-border-subtle dark:bg-border-subtle-dark">
                                                <Lock className="h-3 w-3" strokeWidth={2} />
                                                Owner only
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
        </div>
    );
}

export default function AdminCommissionPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    <PageHeader
                        title="Commission policy"
                        subtitle="Platform default rate and per-landlord overrides"
                        icon={Wallet}
                        iconTone="from-amber-500 to-amber-600"
                    />
                    <DefaultCommissionCard />
                    <div>
                        <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">Per-landlord rates</h3>
                        <LandlordOverrides />
                    </div>
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
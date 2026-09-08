"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Search,
    Building2,
    Ban,
    UserCheck,
    AlertTriangle,
    Lock,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    BillingModeBadge,
    TenantStatusBadge,
    EmptyState,
    Pagination,
    PageHeader,
    TableSkeleton,
    formatCurrency,
    formatDate,
    formatRate,
} from "@/features/admin/components/admin-ui";
import {
    useAdminLandlordsQuery,
    type AdminLandlordsParams,
} from "@/features/admin/hooks/use-admin-queries";
import { useUpdateLandlordStatusMutation } from "@/features/admin/hooks/use-admin-mutations";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";

const PAGE_SIZE = 10;

function LandlordsContent() {
    const { isPlatformOwner, isLoading: roleLoading } = usePlatformRole();
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [page, setPage] = useState(0);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 350);
        return () => clearTimeout(t);
    }, [search, page]);

    const params: AdminLandlordsParams = {
        search: debounced || undefined,
        page,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
    };

    const { data, isPending, isError } = useAdminLandlordsQuery(params);
    const updateStatus = useUpdateLandlordStatusMutation();

    if (isPending || roleLoading) {
        return (
            <div className="space-y-6">
                <TableSkeleton columns={6} rows={8} />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load landlords</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The admin landlords endpoint is unreachable. Check the backend service and try again.
                </p>
            </div>
        );
    }

    if (data.empty) {
        return (
            <div className="card">
                <EmptyState
                    icon={Building2}
                    title="No landlords found"
                    description={
                        debounced
                            ? `No landlords match "${debounced}". Try a different search term.`
                            : "There are no landlords on the platform yet."
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Search by name, slug or email…"
                        className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 pl-9 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                    <Search className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-border-subtle dark:bg-border-subtle-dark">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <th className="px-4 py-3">Landlord</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Billing</th>
                                <th className="px-4 py-3">Portfolio</th>
                                <th className="px-4 py-3">GMV</th>
                                <th className="px-4 py-3">Commission</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {data.content.map((l) => (
                                <tr key={l.id} className="hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/landlords/${l.id}`} className="flex items-center gap-3 group">
                                            <div className="h-9 w-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                                                <Building2 className="h-4 w-4 text-brand-700 dark:text-brand-300" strokeWidth={2} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-fg dark:text-fg-dark group-hover:text-brand dark:group-hover:text-brand-300">
                                                    {l.name}
                                                </p>
                                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark truncate">@{l.slug} · {l.email}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <TenantStatusBadge status={l.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <BillingModeBadge mode={l.billingMode} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                        {l.propertiesCount} props · {l.unitsCount} units
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-fg dark:text-fg-dark">
                                        {formatCurrency(l.gmvAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                        {formatRate(l.effectiveCommissionRate)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                        {formatDate(l.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {isPlatformOwner ? (
                                            confirmingId === l.id ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => {
                                                            const target = l.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
                                                            updateStatus.mutate({ landlordId: l.id, status: target });
                                                            setConfirmingId(null);
                                                        }}
                                                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-danger/30 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmingId(null)}
                                                        className="px-2 py-1.5 rounded-lg text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : l.status === "SUSPENDED" ? (
                                                <button
                                                    onClick={() => setConfirmingId(l.id)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-success/30 text-xs font-medium text-success-dark dark:text-success hover:bg-success/10 transition-colors"
                                                >
                                                    <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
                                                    Reactivate
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmingId(l.id)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-danger/30 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                                                >
                                                    <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                                                    Suspend
                                                </button>
                                            )
                                        ) : (
                                            <span
                                                title="Requires platform owner"
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-fg-subtle dark:text-fg-subtle-dark bg-border-subtle dark:bg-border-subtle-dark"
                                            >
                                                <Lock className="h-3 w-3" strokeWidth={2} />
                                                Owner only
                                            </span>
                                        )}
                                        <Link
                                            href={`/admin/landlords/${l.id}`}
                                            className="ml-2 inline-flex items-center px-2.5 py-1.5 rounded-lg border border-border dark:border-border-dark text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
                                        >
                                            View
                                        </Link>
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

export default function AdminLandlordsPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    <PageHeader
                        title="Landlords"
                        subtitle="Platform-wide tenant organizations — status, billing mode and portfolio"
                        icon={Building2}
                    />
                    <LandlordsContent />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
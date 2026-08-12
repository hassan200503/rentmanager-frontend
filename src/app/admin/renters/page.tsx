"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Search,
    Users,
    AlertTriangle,
    Mail,
    Phone,
    IdCard,
    FileText,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    EmptyState,
    Pagination,
    PageHeader,
    TableSkeleton,
} from "@/features/admin/components/admin-ui";
import {
    useAdminRentersQuery,
    type AdminRentersParams,
} from "@/features/admin/hooks/use-admin-queries";

const PAGE_SIZE = 10;

function RentersContent() {
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [page, setPage] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 350);
        return () => clearTimeout(t);
    }, [search, page]);

    const params: AdminRentersParams = {
        search: debounced || undefined,
        page,
        size: PAGE_SIZE,
    };

    const { data, isPending, isError } = useAdminRentersQuery(params);

    if (isPending) {
        return <TableSkeleton columns={6} rows={8} />;
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load renters</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The admin renters endpoint is unreachable. Check the backend service and try again.
                </p>
            </div>
        );
    }

    if (data.empty) {
        return (
            <div className="card">
                <EmptyState
                    icon={Users}
                    title="No renters found"
                    description={
                        debounced
                            ? `No renters match "${debounced}". Try a different search term.`
                            : "There are no renters on the platform yet."
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative w-full sm:w-80">
                <input
                    type="search"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                    placeholder="Search by name, email or phone…"
                    className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 pl-9 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <Search className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
            </div>

            <div className="rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-border-subtle dark:bg-border-subtle-dark">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <th className="px-4 py-3">Renter</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">National ID</th>
                                <th className="px-4 py-3">Landlord</th>
                                <th className="px-4 py-3">Active lease</th>
                                <th className="px-4 py-3">Lease status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {data.content.map((r) => (
                                <tr key={r.id} className="hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-emerald-700 dark:text-emerald-300" strokeWidth={2} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-fg dark:text-fg-dark">{r.fullName}</p>
                                                {r.activeLeaseId && (
                                                    <Link
                                                        href={`/admin/landlords/${r.landlordId}`}
                                                        className="text-[11px] text-brand-700 dark:text-brand-300 hover:underline"
                                                    >
                                                        @{r.landlordSlug}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark space-y-0.5">
                                        <p className="flex items-center gap-1.5">
                                            <Mail className="h-3 w-3 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                                            {r.email || "—"}
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <Phone className="h-3 w-3 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                                            {r.phone || "—"}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                        {r.nationalId ? (
                                            <span className="flex items-center gap-1.5">
                                                <IdCard className="h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                                                {r.nationalId}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/landlords/${r.landlordId}`}
                                            className="text-sm font-medium text-brand-700 dark:text-brand-300 hover:underline"
                                        >
                                            {r.landlordName}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                        {r.activeLeaseId ? (
                                            <Link
                                                href={`/admin/landlords/${r.landlordId}`}
                                                className="flex items-center gap-1.5 text-brand-700 dark:text-brand-300 hover:underline"
                                            >
                                                <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                                                {r.activeLeaseId.slice(0, 8)}
                                            </Link>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.activeLeaseStatus ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-info/10 text-info-dark border-info/20">
                                                {r.activeLeaseStatus}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-fg-subtle dark:text-fg-subtle-dark">No lease</span>
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

export default function AdminRentersPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    <PageHeader
                        title="Renters"
                        subtitle="Directory of all renters across every landlord platform"
                        icon={Users}
                        iconTone="from-emerald-500 to-emerald-600"
                    />
                    <RentersContent />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
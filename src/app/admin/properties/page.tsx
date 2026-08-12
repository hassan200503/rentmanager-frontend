"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Search,
    Home,
    AlertTriangle,
    Building2,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    EmptyState,
    Pagination,
    PageHeader,
    TableSkeleton,
    formatDate,
} from "@/features/admin/components/admin-ui";
import {
    useAdminPropertiesQuery,
    type AdminPropertiesParams,
} from "@/features/admin/hooks/use-admin-queries";

const PAGE_SIZE = 10;

const propertyStatusMeta: Record<string, { label: string; chip: string; dot: string }> = {
    ACTIVE: { label: "Active", chip: "bg-success/10 text-success-dark border-success/20", dot: "bg-success" },
    DRAFT: { label: "Draft", chip: "bg-border-subtle text-fg-muted border-border", dot: "bg-fg-subtle" },
    INACTIVE: { label: "Inactive", chip: "bg-border-subtle text-fg-muted border-border", dot: "bg-fg-subtle" },
    UNDER_MAINTENANCE: { label: "Maintenance", chip: "bg-warning/10 text-warning-dark border-warning/20", dot: "bg-warning" },
};

function PropertiesContent() {
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [page, setPage] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 350);
        return () => clearTimeout(t);
    }, [search, page]);

    const params: AdminPropertiesParams = {
        search: debounced || undefined,
        page,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
    };

    const { data, isPending, isError } = useAdminPropertiesQuery(params);

    if (isPending) {
        return <TableSkeleton columns={6} rows={8} />;
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load properties</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The admin properties endpoint is unreachable. Check the backend service and try again.
                </p>
            </div>
        );
    }

    if (data.empty) {
        return (
            <div className="card">
                <EmptyState
                    icon={Home}
                    title="No properties found"
                    description={
                        debounced
                            ? `No properties match "${debounced}". Try a different search term.`
                            : "There are no properties on the platform yet."
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
                    placeholder="Search by property name or reference…"
                    className="w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 pl-9 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <Search className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
            </div>

            <div className="rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-border-subtle dark:bg-border-subtle-dark">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                <th className="px-4 py-3">Property</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Landlord</th>
                                <th className="px-4 py-3">Units</th>
                                <th className="px-4 py-3">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {data.content.map((p) => {
                                const meta = propertyStatusMeta[p.status] ?? { label: p.status, chip: "bg-border-subtle text-fg-muted border-border", dot: "bg-fg-subtle" };
                                return (
                                    <tr key={p.id} className="hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/properties/${p.id}`} className="flex items-center gap-3 group">
                                                <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                                                    <Home className="h-4 w-4 text-violet-700 dark:text-violet-300" strokeWidth={2} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark group-hover:text-brand dark:group-hover:text-brand-300 truncate">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">{p.referenceCode}</p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {p.propertyType} · {p.premisesType}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.chip}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/landlords/${p.landlordId}`}
                                                className="flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-300 hover:underline"
                                            >
                                                <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                                                {p.landlordName}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {p.occupiedUnitsCount}/{p.unitsCount} occupied
                                        </td>
                                        <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                                            {formatDate(p.createdAt)}
                                        </td>
                                    </tr>
                                );
                            })}
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

export default function AdminPropertiesPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    <PageHeader
                        title="Properties"
                        subtitle="Platform-wide property and unit inventory"
                        icon={Home}
                        iconTone="from-violet-500 to-violet-600"
                    />
                    <PropertiesContent />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
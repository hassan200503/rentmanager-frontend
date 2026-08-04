"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { usePropertiesQuery } from "../queries/use-properties-query";
import { PropertyStatusBadge } from "./property-status-badge";
import { PropertyFilterState } from "../hooks/use-property-filters";
import { PropertyResponse } from "../types/property-response";
import { PremisesType, PropertyStatus, premisesTypeLabel } from "../types/property";
import { useActivateProperty } from "../hooks/use-activate-property";
import { useArchiveProperty } from "../hooks/use-archive-property";

type PropertyTableProps = {
    params: PropertyFilterState;
    onFilterChange: (patch: Partial<PropertyFilterState>) => void;
};

const PAGE_SIZES = [10, 25, 50];

function Pagination({ page, totalPages, totalElements, size, first, last, onPageChange, onSizeChange }: {
    page: number;
    totalPages: number;
    totalElements: number;
    size: number;
    first: boolean;
    last: boolean;
    onPageChange: (p: number) => void;
    onSizeChange: (s: number) => void;
}) {
    const isCompact = totalPages <= 7;
    const pages: (number | "...")[] = [];

    if (isCompact) {
        for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
        pages.push(0);
        if (page > 2) pages.push("...");
        for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) {
            pages.push(i);
        }
        if (page < totalPages - 3) pages.push("...");
        pages.push(totalPages - 1);
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border dark:border-border-dark px-4 py-3">
            <div className="flex items-center gap-3 text-xs text-fg-muted dark:text-fg-muted-dark">
                <span>
                    {totalElements === 0
                        ? "No results"
                        : `${page * size + 1}–${Math.min((page + 1) * size, totalElements)} of ${totalElements}`}
                </span>
                <label className="flex items-center gap-1.5">
                    <span className="sr-only">Page size</span>
                    <select
                        value={size}
                        onChange={(e) => onSizeChange(Number(e.target.value))}
                        className="bg-transparent border border-border dark:border-border-dark rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                        {PAGE_SIZES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={first}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                {pages.map((p, idx) =>
                    p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="flex h-7 w-5 items-center justify-center text-xs text-fg-muted dark:text-fg-muted-dark select-none">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`flex h-7 min-w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                                p === page
                                    ? "bg-brand text-white"
                                    : "text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
                            }`}
                            aria-label={`Page ${p + 1}`}
                            aria-current={p === page ? "page" : undefined}
                        >
                            {p + 1}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={last}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}

export const PropertyTable = ({ params, onFilterChange }: PropertyTableProps) => {
    const { data, isLoading, error } = usePropertiesQuery(params);
    const router = useRouter();
    const { activateProperty, isLoading: isActivating } = useActivateProperty();
    const { archiveProperty, isLoading: isArchiving } = useArchiveProperty();

    if (isLoading) {
        return (
            <div className="card space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="card text-center py-8">
                <p className="text-sm text-danger">Failed to load properties.</p>
            </div>
        );
    }

    const properties = data?.content ?? [];

    if (properties.length === 0) {
        return (
            <div className="card text-center py-12">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                    <Plus className="h-5 w-5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No properties found</p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                    {params.search || params.status
                        ? "Try a different search or filter."
                        : "Add your first property to start tracking."}
                </p>
                <button onClick={() => router.push("/dashboard/properties/create")} className="btn-primary inline-flex mx-auto">
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Add property
                </button>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left text-fg-muted dark:text-fg-muted-dark border-b border-border dark:border-border-dark">
                        <th className="p-3 font-medium text-xs uppercase tracking-wide">Name</th>
                        <th className="p-3 font-medium text-xs uppercase tracking-wide">Type</th>
                        <th className="p-3 font-medium text-xs uppercase tracking-wide">Premises</th>
                        <th className="p-3 font-medium text-xs uppercase tracking-wide">Status</th>
                        <th className="p-3 font-medium text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {properties.map((p: PropertyResponse) => {
                        const canActivate =
                            p.status === PropertyStatus.DRAFT ||
                            p.status === PropertyStatus.INACTIVE;
                        const canDeactivate = p.status === PropertyStatus.ACTIVE;

                        return (
                            <tr
                                key={p.propertyId}
                                className="border-b border-border-subtle dark:border-border-subtle-dark last:border-0 hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors group"
                            >
                                <td
                                    className="p-3 text-sm font-medium text-fg dark:text-fg-dark cursor-pointer"
                                    onClick={() => router.push(`/dashboard/properties/${p.propertyId}`)}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-800 text-[11px] font-semibold text-brand-dark dark:text-brand-200">
                                            {p.name?.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="group-hover:text-brand dark:group-hover:text-brand-300 transition-colors">{p.name}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-fg-muted dark:text-fg-muted-dark">{p.propertyType}</td>
                                <td className="p-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                        p.premisesType === PremisesType.COMMERCIAL
                                            ? "bg-brand-600/10 text-brand-600 dark:bg-brand-600/20 dark:text-brand-300"
                                            : p.premisesType === PremisesType.MIXED_USE
                                                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                                                : "bg-border-subtle dark:bg-border-subtle-dark text-fg-muted dark:text-fg-muted-dark"
                                    }`}>
                                        {premisesTypeLabel(p.premisesType ?? PremisesType.RESIDENTIAL)}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <PropertyStatusBadge status={p.status} />
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex gap-2 justify-end flex-wrap">
                                        {canActivate && (
                                            <button
                                                onClick={() => activateProperty(p.propertyId)}
                                                disabled={isActivating}
                                                className="btn-secondary text-xs py-1 px-2"
                                            >
                                                {isActivating ? "Activating..." : "Activate"}
                                            </button>
                                        )}
                                        {canDeactivate && (
                                            <button
                                                onClick={() => archiveProperty(p.propertyId)}
                                                disabled={isArchiving}
                                                className="btn-secondary text-xs py-1 px-2"
                                            >
                                                {isArchiving ? "Archiving..." : "Archive"}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/dashboard/properties/${p.propertyId}`)}
                                            className="btn-secondary text-xs py-1 px-2"
                                        >
                                            View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {data && (
                <Pagination
                    page={data.number}
                    totalPages={data.totalPages}
                    totalElements={data.totalElements}
                    size={data.size}
                    first={data.first}
                    last={data.last}
                    onPageChange={(p) => onFilterChange({ page: p })}
                    onSizeChange={(s) => onFilterChange({ size: s, page: 0 })}
                />
            )}
        </div>
    );
};
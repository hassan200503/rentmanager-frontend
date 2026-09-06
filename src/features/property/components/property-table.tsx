"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    Plus,
    Building2,
    MapPin,
    Archive,
    X,
} from "lucide-react";
import { usePropertiesQuery } from "../queries/use-properties-query";
import { PropertyStatusBadge } from "./property-status-badge";
import { PropertyFilterState } from "../hooks/use-property-filters";
import { PropertyResponse } from "../types/property-response";
import { PremisesType, PropertyStatus, premisesTypeLabel } from "../types/property";
import { useActivateProperty } from "../hooks/use-activate-property";
import { useArchiveProperty } from "../hooks/use-archive-property";
import { usePropertyOccupancyQuery } from "@/features/unit/hooks/use-unit-summary-query";
import { useHasRole } from "@/features/user/hooks/use-has-role";
import { WRITE_ROLES } from "@/features/user/lib/roles";

type PropertyTableProps = {
    params: PropertyFilterState;
    onFilterChange: (patch: Partial<PropertyFilterState>) => void;
};

const PAGE_SIZES = [10, 25, 50, 100];

type SortableField = "name" | "propertyType" | "status";

function nextSort(current: string | undefined, field: SortableField): string {
    if (!current || !current.startsWith(`${field},`)) return `${field},asc`;
    return current.endsWith(",asc") ? `${field},desc` : `${field},asc`;
}

function SortIcon({ current, field }: { current: string | undefined; field: SortableField }) {
    if (!current || !current.startsWith(`${field},`)) {
        return <ChevronsUpDown className="h-3 w-3 opacity-40" strokeWidth={2} />;
    }
    return current.endsWith(",asc")
        ? <ChevronUp className="h-3 w-3 text-brand" strokeWidth={2.5} />
        : <ChevronDown className="h-3 w-3 text-brand" strokeWidth={2.5} />;
}

function SortableHeader({
    label,
    field,
    sort,
    onSort,
    className = "",
}: {
    label: string;
    field: SortableField;
    sort: string | undefined;
    onSort: (sort: string) => void;
    className?: string;
}) {
    return (
        <th className={`p-3.5 font-semibold text-[11px] uppercase tracking-wider text-ink-muted ${className}`}>
            <button
                type="button"
                onClick={() => onSort(nextSort(sort, field))}
                className="flex items-center gap-1 hover:text-ink transition-colors"
            >
                {label}
                <SortIcon current={sort} field={field} />
            </button>
        </th>
    );
}

function Pagination({
    page, totalPages, totalElements, size, first, last, onPageChange, onSizeChange,
}: {
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 bg-ink/[0.015]">
            <div className="flex items-center gap-3 text-xs text-ink-muted">
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
                        className="bg-transparent border border-border rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                        {PAGE_SIZES.map((s) => (
                            <option key={s} value={s}>{s} / page</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={first}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-ink-muted hover:bg-ink/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                {pages.map((p, idx) =>
                    p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="flex h-7 w-5 items-center justify-center text-xs text-ink-muted select-none">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`flex h-7 min-w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                                p === page ? "bg-brand text-white shadow-sm" : "text-ink-muted hover:bg-ink/[0.06]"
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
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-ink-muted hover:bg-ink/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}

function PropertyAvatar({ property }: { property: PropertyResponse }) {
    if (property.thumbnailUrl) {
        return (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-ink/[0.06]">
                <Image
                    src={property.thumbnailUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                />
            </div>
        );
    }
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-[12px] font-semibold text-brand-700 ring-1 ring-brand-200/50">
            {property.name?.slice(0, 2).toUpperCase()}
        </div>
    );
}

function OccupancyChip({ propertyId, occupancy, isLoading }: {
    propertyId: string;
    occupancy: Map<string, { totalUnits: number; occupiedUnits: number; occupancyPercent: number | null }>;
    isLoading: boolean;
}) {
    const data = occupancy.get(propertyId);

    // The occupancy-by-property query groups by unit rows, so a property
    // with zero units never appears in the result at all — indistinguishable
    // from "hasn't loaded yet" unless we check isLoading explicitly. Getting
    // this wrong would show "No units" on a property that genuinely has
    // units, for as long as the query is in flight.
    if (isLoading) {
        return <span className="skeleton inline-block h-3.5 w-16 rounded" />;
    }

    if (!data) {
        return <span className="text-xs text-ink-muted/60">No units</span>;
    }

    const pct = data.occupancyPercent ?? 0;
    const color =
        pct >= 80 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-danger";

    return (
        <div className="flex items-center gap-2 min-w-[92px]">
            <div className="h-1.5 w-12 rounded-full bg-ink/[0.08] overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <span className="text-xs font-medium text-ink-muted whitespace-nowrap">
                {data.occupiedUnits}/{data.totalUnits}
            </span>
        </div>
    );
}

export const PropertyTable = ({ params, onFilterChange }: PropertyTableProps) => {
    const { data, isLoading, error } = usePropertiesQuery(params);
    const router = useRouter();
    const canWrite = useHasRole(WRITE_ROLES);
    const { activateProperty, isLoading: isActivating } = useActivateProperty();
    const { archiveProperty, isLoading: isArchiving } = useArchiveProperty();
    const { data: occupancyData, isLoading: isOccupancyLoading } = usePropertyOccupancyQuery();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkArchiving, setIsBulkArchiving] = useState(false);

    const occupancyByProperty = useMemo(() => {
        const map = new Map<string, { totalUnits: number; occupiedUnits: number; occupancyPercent: number | null }>();
        occupancyData?.forEach((entry) => {
            map.set(entry.propertyId, entry);
        });
        return map;
    }, [occupancyData]);

    const handleSort = (sort: string) => onFilterChange({ sort });

    // Selection is page/filter-scoped — a page turn or filter change can make
    // a selected row disappear from view entirely, so start clean rather than
    // silently carrying an invisible selection into a bulk action. Adjusted
    // during render (React's documented pattern for resetting state when a
    // prop changes) rather than in an effect, which would cascade an extra
    // render after the filter change already committed.
    const filterSignature = JSON.stringify([
        params.page, params.size, params.search, params.status, params.propertyType, params.sort,
    ]);
    const [prevFilterSignature, setPrevFilterSignature] = useState(filterSignature);
    if (filterSignature !== prevFilterSignature) {
        setPrevFilterSignature(filterSignature);
        setSelectedIds(new Set());
    }

    const properties = data?.content ?? [];
    const archivableIds = properties
        .filter((p) => p.status === PropertyStatus.ACTIVE)
        .map((p) => p.propertyId);
    const allArchivableSelected =
        archivableIds.length > 0 && archivableIds.every((id) => selectedIds.has(id));

    const toggleSelectAll = () => {
        setSelectedIds(allArchivableSelected ? new Set() : new Set(archivableIds));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkArchive = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        if (!window.confirm(`Archive ${ids.length} propert${ids.length === 1 ? "y" : "ies"}? They'll be hidden from public listings and can be reactivated later.`)) {
            return;
        }

        setIsBulkArchiving(true);
        const results = await Promise.allSettled(ids.map((id) => archiveProperty(id)));
        setIsBulkArchiving(false);
        setSelectedIds(new Set());

        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0 && failed < ids.length) {
            toast.error(`${failed} of ${ids.length} properties couldn't be archived.`);
        } else if (failed === ids.length) {
            toast.error("Bulk archive failed for all selected properties.");
        }
        // Full success: each mutation's own success toast already fired.
    };

    if (isLoading) {
        return (
            <div className="card !p-0 overflow-hidden">
                <div className="p-4 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton h-14 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card text-center py-10">
                <p className="text-sm text-danger font-medium">Failed to load properties.</p>
                <p className="text-xs text-ink-muted mt-1">Check your connection and try again.</p>
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="card text-center py-14">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.04]">
                    <Building2 className="h-5 w-5 text-ink-muted" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-medium text-ink mb-1">No properties found</p>
                <p className="text-xs text-ink-muted mb-5">
                    {params.search || params.status || params.propertyType
                        ? "Try a different search or filter."
                        : "Add your first property to start tracking rent and occupancy."}
                </p>
                {canWrite && (
                    <button onClick={() => router.push("/dashboard/properties/create")} className="btn-primary inline-flex mx-auto">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Add property
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="card overflow-hidden !p-0">
            {canWrite && selectedIds.size > 0 && (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-brand-50 border-b border-brand-200/50">
                    <span className="text-sm font-medium text-brand-800">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkArchive}
                            disabled={isBulkArchiving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-xs font-medium text-ink border border-border hover:border-danger/40 hover:text-danger transition-colors disabled:opacity-50"
                        >
                            <Archive className="h-3.5 w-3.5" strokeWidth={2} />
                            {isBulkArchiving ? "Archiving…" : "Archive selected"}
                        </button>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-ink-muted hover:text-ink transition-colors"
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={2} />
                            Clear
                        </button>
                    </div>
                </div>
            )}
            <div className="max-h-[32rem] overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm">
                    <tr className="text-left border-b border-border">
                        {canWrite && (
                            <th className="p-3.5 w-10">
                                <input
                                    type="checkbox"
                                    checked={allArchivableSelected}
                                    onChange={toggleSelectAll}
                                    disabled={archivableIds.length === 0}
                                    aria-label="Select all active properties on this page"
                                    className="rounded border-border text-brand focus:ring-brand/30"
                                />
                            </th>
                        )}
                        <SortableHeader label="Name" field="name" sort={params.sort} onSort={handleSort} />
                        <SortableHeader label="Type" field="propertyType" sort={params.sort} onSort={handleSort} />
                        <th className="p-3.5 font-semibold text-[11px] uppercase tracking-wider text-ink-muted">Premises</th>
                        <th className="p-3.5 font-semibold text-[11px] uppercase tracking-wider text-ink-muted">Occupancy</th>
                        <SortableHeader label="Status" field="status" sort={params.sort} onSort={handleSort} />
                        <th className="p-3.5 font-semibold text-[11px] uppercase tracking-wider text-ink-muted text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {properties.map((p: PropertyResponse) => {
                        const canActivate =
                            p.status === PropertyStatus.DRAFT || p.status === PropertyStatus.INACTIVE;
                        const canDeactivate = p.status === PropertyStatus.ACTIVE;

                        return (
                            <tr
                                key={p.propertyId}
                                className="border-b border-ink/[0.04] last:border-0 hover:bg-ink/[0.02] transition-colors group cursor-pointer"
                                onClick={() => router.push(`/dashboard/properties/${p.propertyId}`)}
                            >
                                {canWrite && (
                                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                        {canDeactivate && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(p.propertyId)}
                                                onChange={() => toggleSelectOne(p.propertyId)}
                                                aria-label={`Select ${p.name}`}
                                                className="rounded border-border text-brand focus:ring-brand/30"
                                            />
                                        )}
                                    </td>
                                )}
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <PropertyAvatar property={p} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-ink group-hover:text-brand transition-colors truncate">
                                                {p.name}
                                            </p>
                                            {p.address?.city && (
                                                <p className="flex items-center gap-1 text-xs text-ink-muted/70 truncate">
                                                    <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                                                    {p.address.city}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-ink-muted">{p.propertyType}</td>
                                <td className="p-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                        p.premisesType === PremisesType.COMMERCIAL
                                            ? "bg-brand-600/10 text-brand-700"
                                            : p.premisesType === PremisesType.MIXED_USE
                                                ? "bg-amber-500/10 text-amber-700"
                                                : "bg-ink/[0.05] text-ink-muted"
                                    }`}>
                                        {premisesTypeLabel(p.premisesType ?? PremisesType.RESIDENTIAL)}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <OccupancyChip
                                        propertyId={p.propertyId}
                                        occupancy={occupancyByProperty}
                                        isLoading={isOccupancyLoading}
                                    />
                                </td>
                                <td className="p-3">
                                    <PropertyStatusBadge status={p.status} />
                                </td>
                                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex gap-2 justify-end flex-wrap">
                                        {canWrite && canActivate && (
                                            <button
                                                onClick={() => activateProperty(p.propertyId)}
                                                disabled={isActivating || isBulkArchiving}
                                                className="btn-secondary text-xs py-1 px-2"
                                            >
                                                {isActivating ? "Activating..." : "Activate"}
                                            </button>
                                        )}
                                        {canWrite && canDeactivate && (
                                            <button
                                                onClick={() => archiveProperty(p.propertyId)}
                                                disabled={isArchiving || isBulkArchiving}
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

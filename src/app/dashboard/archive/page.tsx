"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Archive,
    Building2,
    DoorOpen,
    Trash2,
    AlertTriangle,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { propertyApi } from "@/features/property/api/property-api";
import { PropertyStatus, type Property } from "@/features/property/types/property";
import { unitApi } from "@/features/unit/api/unit-api";
import { UnitStatus, type Unit } from "@/features/unit/types/unit";
import { useDeleteProperty } from "@/features/property/hooks/use-delete-property";
import { useDeleteUnit } from "@/features/unit/hooks/use-delete-unit";
import { PropertyStatusBadge } from "@/features/property/components/property-status-badge";
import { UnitStatusBadge } from "@/features/unit/components/unit-status-badge";

type Tab = "properties" | "units";

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

function ConfirmDeleteDialog({
    open,
    title,
    description,
    onConfirm,
    onCancel,
    isLoading,
}: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-surface rounded-2xl border border-border shadow-dropdown p-6 max-w-sm w-full mx-4 animate-fade-in-up">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
                    <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-ink text-center mb-1">{title}</h3>
                <p className="text-sm text-ink-muted text-center mb-6">{description}</p>
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
                        className="flex-1 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger-dark transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
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

export default function ArchivePage() {
    const [tab, setTab] = useState<Tab>("properties");
    const [search, setSearch] = useState("");
    const [propertyPage, setPropertyPage] = useState(0);
    const [unitPage, setUnitPage] = useState(0);
    const [confirmDelete, setConfirmDelete] = useState<{ type: "property" | "unit"; id: string; name: string } | null>(null);

    const { deleteProperty, isLoading: isDeletingProperty } = useDeleteProperty();
    const { deleteUnit, isLoading: isDeletingUnit } = useDeleteUnit();

    const isDeleting = isDeletingProperty || isDeletingUnit;

    const { data: archivedProperties, isLoading: propsLoading } = useQuery({
        queryKey: ["properties", "archived"],
        queryFn: () => propertyApi.list({ status: PropertyStatus.ARCHIVED }),
    });

    const { data: archivedUnits, isLoading: unitsLoading } = useQuery({
        queryKey: ["units", "archived"],
        queryFn: () => unitApi.list({ status: UnitStatus.ARCHIVED, propertyId: "" }),
    });

    const filteredProperties = (archivedProperties?.content ?? []).filter((p) =>
        search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    );

    const filteredUnits = (archivedUnits?.content ?? []).filter((u) =>
        search
            ? `${u.unitNumber} ${u.label ?? ""}`.toLowerCase().includes(search.toLowerCase())
            : true
    );

    const PROP_PAGE_SIZE = 8;
    const UNIT_PAGE_SIZE = 8;

    const propTotalPages = Math.ceil(filteredProperties.length / PROP_PAGE_SIZE);
    const propPaged = filteredProperties.slice(propertyPage * PROP_PAGE_SIZE, (propertyPage + 1) * PROP_PAGE_SIZE);

    const unitTotalPages = Math.ceil(filteredUnits.length / UNIT_PAGE_SIZE);
    const unitPaged = filteredUnits.slice(unitPage * UNIT_PAGE_SIZE, (unitPage + 1) * UNIT_PAGE_SIZE);

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            if (confirmDelete.type === "property") {
                await deleteProperty(confirmDelete.id);
            } else {
                await deleteUnit(confirmDelete.id);
            }
            setConfirmDelete(null);
        } catch {
            // error handled by mutation toast
        }
    };

    const isLoading = propsLoading || unitsLoading;

    return (
        <div className="page-container space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
                <div className="flex items-start gap-4">
                    <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/10 to-danger/5 shadow-sm ring-1 ring-danger/20">
                        <Archive className="h-7 w-7 text-danger-dark" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight font-display">Archived Items</h1>
                        <p className="text-sm text-ink-muted">Manage permanently removed properties and units. Deletion cannot be undone.</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up overflow-hidden">
                <div className="flex border-b border-border">
                    <button
                        onClick={() => { setTab("properties"); setSearch(""); setPropertyPage(0); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors duration-200 ${
                            tab === "properties"
                                ? "text-ink border-b-2 border-brand bg-brand-50/30"
                                : "text-ink-muted hover:text-ink hover:bg-ink/[0.02]"
                        }`}
                    >
                        <Building2 className="w-4 h-4" strokeWidth={1.5} />
                        Archived Properties
                        {archivedProperties && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-ink/[0.05] text-[11px] font-semibold text-ink-muted">
                                {archivedProperties.totalElements}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setTab("units"); setSearch(""); setUnitPage(0); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors duration-200 ${
                            tab === "units"
                                ? "text-ink border-b-2 border-brand bg-brand-50/30"
                                : "text-ink-muted hover:text-ink hover:bg-ink/[0.02]"
                        }`}
                    >
                        <DoorOpen className="w-4 h-4" strokeWidth={1.5} />
                        Archived Units
                        {archivedUnits && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-ink/[0.05] text-[11px] font-semibold text-ink-muted">
                                {archivedUnits.totalElements}
                            </span>
                        )}
                    </button>
                </div>

                <div className="p-5">
                    <div className="relative mb-4 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={1.5} />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPropertyPage(0);
                                setUnitPage(0);
                            }}
                            placeholder={`Search ${tab === "properties" ? "properties" : "units"}...`}
                            className="form-input w-full !pl-10 text-sm"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                            >
                                <X className="w-3.5 h-3.5" strokeWidth={2} />
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="skeleton h-16 rounded-xl" />
                            ))}
                        </div>
                    ) : tab === "properties" ? (
                        filteredProperties.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-ink/[0.05] flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Building2 className="w-7 h-7 text-ink-muted" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm font-semibold text-ink mb-1">
                                    {search ? "No matching properties" : "No archived properties"}
                                </p>
                                <p className="text-sm text-ink-muted">
                                    {search ? "Try a different search term." : "Archived properties will appear here."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {propPaged.map((p: Property) => (
                                    <div
                                        key={p.propertyId}
                                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-border hover:border-border/80 hover:bg-ink/[0.02] transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-ink/[0.05] flex items-center justify-center shrink-0 shadow-sm">
                                                <Building2 className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                                                <p className="text-xs text-ink-muted/70 mt-0.5">
                                                    {p.propertyType?.toLowerCase().replace(/_/g, " ") ?? "—"}
                                                    {p.address?.city ? ` · ${p.address.city}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <PropertyStatusBadge status={p.status} />
                                            <button
                                                onClick={() => setConfirmDelete({ type: "property", id: p.propertyId, name: p.name })}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/20 text-xs font-medium text-danger hover:bg-danger/5 hover:border-danger/40 transition-all duration-200"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {propTotalPages > 1 && (
                                    <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                                        <p className="text-xs text-ink-muted">
                                            Showing {propertyPage * PROP_PAGE_SIZE + 1}–{Math.min((propertyPage + 1) * PROP_PAGE_SIZE, filteredProperties.length)} of {filteredProperties.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPropertyPage((p) => Math.max(0, p - 1))}
                                                disabled={propertyPage === 0}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-ink-muted hover:text-ink hover:border-brand-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                Prev
                                            </button>
                                            <span className="text-xs text-ink-muted px-1">{propertyPage + 1} / {propTotalPages}</span>
                                            <button
                                                onClick={() => setPropertyPage((p) => Math.min(propTotalPages - 1, p + 1))}
                                                disabled={propertyPage >= propTotalPages - 1}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-ink-muted hover:text-ink hover:border-brand-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Next
                                                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        filteredUnits.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-ink/[0.05] flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <DoorOpen className="w-7 h-7 text-ink-muted" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm font-semibold text-ink mb-1">
                                    {search ? "No matching units" : "No archived units"}
                                </p>
                                <p className="text-sm text-ink-muted">
                                    {search ? "Try a different search term." : "Archived units will appear here."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {unitPaged.map((u: Unit) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-border hover:border-border/80 hover:bg-ink/[0.02] transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-ink/[0.05] flex items-center justify-center shrink-0 shadow-sm">
                                                <DoorOpen className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-ink truncate">
                                                    Unit {u.unitNumber}{u.label ? ` — ${u.label}` : ""}
                                                </p>
                                                <p className="text-xs text-ink-muted/70 mt-0.5">
                                                    Property ID: {u.propertyId}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <UnitStatusBadge status={u.status} />
                                            <button
                                                onClick={() => setConfirmDelete({ type: "unit", id: u.id, name: `Unit ${u.unitNumber}` })}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/20 text-xs font-medium text-danger hover:bg-danger/5 hover:border-danger/40 transition-all duration-200"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {unitTotalPages > 1 && (
                                    <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                                        <p className="text-xs text-ink-muted">
                                            Showing {unitPage * UNIT_PAGE_SIZE + 1}–{Math.min((unitPage + 1) * UNIT_PAGE_SIZE, filteredUnits.length)} of {filteredUnits.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setUnitPage((p) => Math.max(0, p - 1))}
                                                disabled={unitPage === 0}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-ink-muted hover:text-ink hover:border-brand-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                Prev
                                            </button>
                                            <span className="text-xs text-ink-muted px-1">{unitPage + 1} / {unitTotalPages}</span>
                                            <button
                                                onClick={() => setUnitPage((p) => Math.min(unitTotalPages - 1, p + 1))}
                                                disabled={unitPage >= unitTotalPages - 1}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-ink-muted hover:text-ink hover:border-brand-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Next
                                                <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                open={confirmDelete !== null}
                title={confirmDelete ? `Permanently delete ${confirmDelete.type === "property" ? "property" : "unit"}?` : ""}
                description={
                    confirmDelete
                        ? `"${confirmDelete.name}" will be permanently removed from the system. This action cannot be undone.`
                        : ""
                }
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
                isLoading={isDeleting}
            />
        </div>
    );
}

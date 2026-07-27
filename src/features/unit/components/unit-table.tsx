"use client";

import { useRouter } from "next/navigation";
import { useUnitsQuery } from "../queries/use-units-query";
import { UnitStatusBadge } from "./unit-status-badge";
import { DEFAULT_UNIT_FILTERS, UnitFilterState } from "../hooks/use-unit-filters";
import { UnitResponse } from "../types/unit-request";
import { useUnitLifecycle } from "../hooks/use-unit-lifecycle";
import { UnitStatus } from "../types/unit";
import { Eye, PencilLine, CheckCircle2, PauseCircle, Home } from "lucide-react";

type UnitTableProps = {
    propertyId: string;
    params?: Partial<UnitFilterState>;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0,
    }).format(amount);

const occupancyConfig: Record<string, { label: string; className: string; dot: string }> = {
    VACANT: {
        label: "Vacant",
        className: "bg-success-bg text-success-dark",
        dot: "bg-success shadow-sm shadow-success/30",
    },
    OCCUPIED: {
        label: "Occupied",
        className: "bg-warning-bg text-warning-dark",
        dot: "bg-warning shadow-sm shadow-warning/30",
    },
    RESERVED: {
        label: "Reserved",
        className: "bg-info-bg text-info-dark",
        dot: "bg-info shadow-sm shadow-info/30",
    },
    PENDING_PAYMENT: {
        label: "Pending Payment",
        className: "bg-warning-bg text-warning-dark",
        dot: "bg-warning shadow-sm shadow-warning/30",
    },
};

export const UnitTable = ({ propertyId, params }: UnitTableProps) => {
    const filters: UnitFilterState = { ...DEFAULT_UNIT_FILTERS, ...params };
    const { data, isLoading, error } = useUnitsQuery({ propertyId, ...filters });
    const router = useRouter();
    const { activateUnit, deactivateUnit, isActivating, isDeactivating } =
        useUnitLifecycle();

    if (isLoading) {
        return (
            <div className="overflow-hidden rounded-2xl border border-border shadow-sm bg-surface">
                <div className="skeleton h-14 w-full rounded-none" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 w-full rounded-none border-t border-border/50" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger-dark font-medium">
                Failed to load units.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm bg-surface">
            <table className="min-w-full">
                <thead>
                <tr className="border-b border-border bg-ink/[0.02]">
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                        Unit
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                        Status
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                        Rent
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                        Floor
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                        Occupancy
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
                        Actions
                    </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-border/50">
                {data?.content?.map((u: UnitResponse) => {
                    const canActivate = u.status === UnitStatus.INACTIVE;
                    const canDeactivate = u.status === UnitStatus.ACTIVE;

                    const occCfg = occupancyConfig[u.occupancyStatus] ?? {
                        label: u.occupancyStatus,
                        className: "bg-ink/[0.05] text-ink-muted",
                        dot: "bg-ink-muted/40",
                    };

                    return (
                        <tr
                            key={u.id}
                            className="hover:bg-ink/[0.02] transition-colors duration-150"
                        >
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 shadow-sm">
                                        <Home className="w-4 h-4 text-brand-600" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-ink leading-snug">
                                            {u.label || u.unitNumber}
                                        </p>
                                        {u.label && (
                                            <p className="text-xs text-ink-muted/70 mt-0.5 font-medium">{u.unitNumber}</p>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4">
                                <UnitStatusBadge status={u.status} />
                            </td>
                            <td className="px-5 py-4 font-data text-sm font-semibold text-ink tabular-nums">
                                {formatCurrency(u.rentAmount)}
                            </td>
                            <td className="px-5 py-4 text-sm text-ink-muted">
                                {u.floor ?? <span className="text-ink-muted/30">&mdash;</span>}
                            </td>
                            <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${occCfg.className}`}>
                                    <span className={`w-2 h-2 rounded-full ${occCfg.dot}`} />
                                    {occCfg.label}
                                </span>
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex items-center justify-end gap-1">
                                    {canActivate && (
                                        <button
                                            onClick={() => activateUnit(u.id)}
                                            disabled={isActivating}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success-bg text-success-dark text-xs font-semibold hover:bg-success/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                                            Activate
                                        </button>
                                    )}
                                    {canDeactivate && (
                                        <button
                                            onClick={() => deactivateUnit(u.id)}
                                            disabled={isDeactivating}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-danger/25 text-danger text-xs font-semibold hover:bg-danger/[0.07] hover:border-danger/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <PauseCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            Deactivate
                                        </button>
                                    )}
                                    <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-border/60">
                                        <button
                                            onClick={() =>
                                                router.push(`/dashboard/properties/${propertyId}/units/${u.id}`)
                                            }
                                            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-ink-muted hover:text-brand hover:bg-brand-50 transition-all duration-200 group"
                                            title="View unit details"
                                        >
                                            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            <span className="text-xs font-medium">View</span>
                                        </button>
                                        <button
                                            onClick={() =>
                                                router.push(`/dashboard/properties/${propertyId}/units/${u.id}/edit`)
                                            }
                                            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-ink-muted hover:text-brand hover:bg-brand-50 transition-all duration-200 group"
                                            title="Edit unit"
                                        >
                                            <PencilLine className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            <span className="text-xs font-medium">Edit</span>
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    );
                })}

                {(!data?.content || data.content.length === 0) && (
                    <tr>
                        <td colSpan={6}>
                            <div className="py-20 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-ink/[0.05] flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Home className="w-7 h-7 text-ink-muted" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm font-semibold text-ink">No units found</p>
                                <p className="text-sm text-ink-muted mt-1">
                                    Add your first unit to get started.
                                </p>
                            </div>
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};

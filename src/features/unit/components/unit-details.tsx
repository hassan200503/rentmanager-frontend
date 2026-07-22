"use client";

import { Unit, UnitStatus } from "../types/unit";
import { UnitMediaManager } from "@/features/unit/components/unit-media-manager";
import { useUnitLifecycle } from "@/features/unit/hooks/use-unit-lifecycle";
import {
    Images,
    Wallet,
    Settings2,
    FileText,
    EyeOff,
    CheckCircle2,
    PauseCircle,
} from "lucide-react";

type UnitDetailsProps = {
    unit: Unit;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

// Cosmetic only -- turns "UNDER_MAINTENANCE" into "Under Maintenance" for
// display. Does not touch the raw unit.status / occupancyStatus values.
const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const statusPillClasses: Record<string, string> = {
    [UnitStatus.INACTIVE]: "pill-neutral",
    [UnitStatus.ACTIVE]: "pill-success",
    [UnitStatus.ARCHIVED]: "pill-danger",
};

function SectionCard({
                         icon: Icon,
                         title,
                         children,
                     }: {
    icon: typeof Images;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="card">
            <h2 className="section-header inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                {title}
            </h2>
            {children}
        </div>
    );
}

export function UnitDetails({ unit }: UnitDetailsProps) {
    const { activateUnit, deactivateUnit, isActivating, isDeactivating } =
        useUnitLifecycle();

    const canActivate = unit.status === UnitStatus.INACTIVE;
    const canDeactivate = unit.status === UnitStatus.ACTIVE;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="page-title mb-1">
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </h1>
                        {unit.label && (
                            <p className="text-sm text-ink-muted">
                                Unit {unit.unitNumber}
                            </p>
                        )}
                        {!unit.label && (
                            <p className="text-sm text-ink-muted">
                                Property unit details
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <span
                            className={
                                statusPillClasses[unit.status] ?? "pill-neutral"
                            }
                        >
                            {formatEnumLabel(unit.status)}
                        </span>

                        {canActivate && (
                            <button
                                onClick={() => activateUnit(unit.id)}
                                disabled={isActivating}
                                className="btn-success inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                                {isActivating ? "Activating…" : "Activate"}
                            </button>
                        )}

                        {canDeactivate && (
                            <button
                                onClick={() => deactivateUnit(unit.id)}
                                disabled={isDeactivating}
                                className="btn-danger inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PauseCircle className="h-4 w-4" strokeWidth={2} />
                                {isDeactivating ? "Deactivating…" : "Deactivate"}
                            </button>
                        )}
                    </div>
                </div>

                {unit.status === UnitStatus.INACTIVE && (
                    <p className="pill-warning inline-flex items-center gap-1 mt-3">
                        <EyeOff className="h-3 w-3" strokeWidth={2} />
                        Not visible in public listings until activated
                    </p>
                )}
            </div>

            {/* Photos */}
            <SectionCard icon={Images} title="Photos">
                <UnitMediaManager unitId={unit.id} />
            </SectionCard>

            {/* Pricing */}
            <SectionCard icon={Wallet} title="Pricing">
                <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Rent amount</p>
                        <p className="mt-1.5 font-data text-xl font-semibold text-ink">
                            {unit.rentAmount != null ? formatCurrency(unit.rentAmount) : "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Deposit amount</p>
                        <p className="mt-1.5 font-data text-xl font-semibold text-ink">
                            {unit.depositAmount != null ? formatCurrency(unit.depositAmount) : "—"}
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* Configuration */}
            <SectionCard icon={Settings2} title="Configuration">
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Floor</p>
                        <p className="mt-1.5 text-sm font-medium text-ink">
                            {unit.floor ?? "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Occupancy status</p>
                        <span className="mt-1.5 inline-flex pill-neutral">
                            {formatEnumLabel(unit.occupancyStatus)}
                        </span>
                    </div>
                </div>
            </SectionCard>

            {/* Description */}
            <SectionCard icon={FileText} title="Description">
                <p className="whitespace-pre-wrap text-sm text-ink">
                    {unit.description?.trim() || "No description provided."}
                </p>
            </SectionCard>
        </div>
    );
}
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
    MapPin,
    Tag,
} from "lucide-react";
import { formatCurrency } from "@/shared/utils/money";

type UnitDetailsProps = {
    unit: Unit;
};

const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">{label}</p>
            <div className="text-sm font-medium text-ink">{children}</div>
        </div>
    );
}

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
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-5 transition-shadow hover:shadow-md">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink tracking-tight">
                <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-brand-600" strokeWidth={2} />
                </div>
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
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <Tag className="w-3 h-3" strokeWidth={1.5} />
                            <span>Unit {unit.unitNumber}</span>
                        </div>
                        <h1 className="text-2xl font-semibold text-ink tracking-tight font-display">
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                unit.status === UnitStatus.ACTIVE
                                    ? "bg-success-bg text-success-dark"
                                    : unit.status === UnitStatus.INACTIVE
                                        ? "bg-ink/[0.05] text-ink-muted"
                                        : unit.status === UnitStatus.ARCHIVED
                                            ? "bg-danger/10 text-danger-dark"
                                            : "bg-warning-bg text-warning-dark"
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                unit.status === UnitStatus.ACTIVE
                                    ? "bg-success"
                                    : unit.status === UnitStatus.INACTIVE
                                        ? "bg-ink-muted/40"
                                        : unit.status === UnitStatus.ARCHIVED
                                            ? "bg-danger"
                                            : "bg-warning"
                            }`} />
                            {formatEnumLabel(unit.status)}
                        </span>

                        {canActivate && (
                            <button
                                onClick={() => activateUnit(unit.id)}
                                disabled={isActivating}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                            >
                                <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                                {isActivating ? "Activating…" : "Activate"}
                            </button>
                        )}

                        {canDeactivate && (
                            <button
                                onClick={() => deactivateUnit(unit.id)}
                                disabled={isDeactivating}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger text-white text-sm font-medium hover:bg-danger-dark transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-danger/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                            >
                                <PauseCircle className="w-4 h-4" strokeWidth={2} />
                                {isDeactivating ? "Deactivating…" : "Deactivate"}
                            </button>
                        )}
                    </div>
                </div>

                {unit.status === UnitStatus.INACTIVE && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-warning-bg border border-warning/20">
                        <EyeOff className="w-4 h-4 text-warning shrink-0" strokeWidth={1.5} />
                        <p className="text-sm text-warning-dark font-medium">
                            Not visible in public listings until activated
                        </p>
                    </div>
                )}
            </div>

            {/* Photos */}
            <SectionCard icon={Images} title="Photos">
                <UnitMediaManager unitId={unit.id} />
            </SectionCard>

            {/* Pricing */}
            <SectionCard icon={Wallet} title="Pricing">
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="p-4 rounded-xl bg-ink/[0.02] border border-border/50">
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Rent amount</p>
                        <p className="mt-1.5 font-data text-2xl font-semibold text-ink">
                            {unit.rentAmount != null ? formatCurrency(unit.rentAmount) : "—"}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-ink/[0.02] border border-border/50">
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Deposit amount</p>
                        <p className="mt-1.5 font-data text-2xl font-semibold text-ink">
                            {unit.depositAmount != null ? formatCurrency(unit.depositAmount) : "—"}
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* Configuration */}
            <SectionCard icon={Settings2} title="Configuration">
                <div className="grid gap-6 md:grid-cols-2">
                    <DetailRow label="Floor">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.5} />
                            {unit.floor ?? "—"}
                        </div>
                    </DetailRow>
                    <div>
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">Occupancy status</p>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-ink/[0.05] text-ink-muted">
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-muted/40" />
                            {formatEnumLabel(unit.occupancyStatus)}
                        </span>
                    </div>
                </div>
            </SectionCard>

            {/* Description */}
            <SectionCard icon={FileText} title="Description">
                <div className="p-4 rounded-xl bg-ink/[0.02] border border-border/50">
                    <p className="whitespace-pre-wrap text-sm text-ink leading-relaxed">
                        {unit.description?.trim() || (
                            <span className="text-ink-muted/60 italic">No description provided.</span>
                        )}
                    </p>
                </div>
            </SectionCard>
        </div>
    );
}

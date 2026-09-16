"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Building2,
    EyeOff,
    Save,
    CheckCircle2,
    Archive,
    FileQuestion,
    Circle,
    Undo2,
    Images,
    Tag,
    Home,
    Layers,
    KeyRound,
    ScrollText,
    Radio,
    Landmark,
    Lock,
} from "lucide-react";

import { useProperty } from "@/features/property/hooks/use-property";
import { useUpdateProperty } from "@/features/property/hooks/use-update-property";
import { useActivateProperty } from "@/features/property/hooks/use-activate-property";
import { useArchiveProperty } from "@/features/property/hooks/use-archive-property";
import { useUnitsQuery } from "@/features/unit/queries/use-units-query";
import { useHasRole } from "@/features/user/hooks/use-has-role";
import { WRITE_ROLES } from "@/features/user/lib/roles";
import { useUnsavedChanges } from "@/stores/unsaved-changes-store";
import { usePropertyRegistrationQuery, useInitiateRegistrationMutation } from "@/features/tax/hooks/use-tax-queries";
import { toast } from "sonner";

import { PropertyStatusBadge } from "@/features/property/components/property-status-badge";
import { UnitTable } from "@/features/unit/components/unit-table";
import { PropertyMediaManager } from "@/features/property/components/upload-gallery";
import { PremisesType, PropertyStatus, premisesTypeLabel } from "@/features/property/types/property";

const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

function SectionCard({ icon: Icon, title, trailing, children }: {
    icon: typeof Building2;
    title: string;
    trailing?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-brand-600" strokeWidth={2} />
                    </div>
                    {title}
                </h3>
                {trailing}
            </div>
            {children}
        </div>
    );
}

function UnsavedTag() {
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-warning-bg border border-warning/20 text-[11px] font-medium text-warning-dark">
            <Circle className="h-1.5 w-1.5 fill-current" />
            Unsaved
        </span>
    );
}

function EritsRegistrationCard({ propertyId, canWrite }: { propertyId: string; canWrite: boolean }) {
    const { data: reg, isLoading } = usePropertyRegistrationQuery(propertyId);
    const initiate = useInitiateRegistrationMutation();

    const handleInitiate = async () => {
        try {
            await initiate.mutateAsync(propertyId);
            toast.success("eRITS registration initiated. Complete registration on the KRA portal.");
        } catch {
            toast.error("Failed to initiate registration.");
        }
    };

    const statusLabel: Record<string, string> = {
        PENDING: "Pending",
        READY_FOR_MANUAL: "Register manually on eRITS",
        TRANSMITTED: "Submitted to KRA",
        ACCEPTED: "Registered",
        REJECTED: "Rejected by KRA",
    };

    return (
        <div className="animate-fade-in-up bg-surface rounded-2xl border border-border shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Landmark className="w-3.5 h-3.5 text-brand-600" strokeWidth={2} />
                    </div>
                    eRITS Registration
                </h3>
            </div>

            {isLoading ? (
                <div className="skeleton h-8 rounded-xl" />
            ) : reg ? (
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        reg.status === "ACCEPTED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : reg.status === "REJECTED"
                                ? "bg-danger/10 text-danger"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel[reg.status] ?? reg.status}
                    </span>
                    {reg.krPropertyRegistrationId && (
                        <span className="text-xs font-mono text-ink-muted">
                            KRA ref: {reg.krPropertyRegistrationId}
                        </span>
                    )}
                    {reg.lastError && (
                        <span className="text-xs text-danger">{reg.lastError}</span>
                    )}
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-ink-muted">
                        Not registered on eRITS. Required for monthly MRI filing.
                    </p>
                    {canWrite && (
                        <button
                            type="button"
                            onClick={handleInitiate}
                            disabled={initiate.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                            <Landmark className="w-3.5 h-3.5" strokeWidth={2} />
                            {initiate.isPending ? "Initiating…" : "Register on eRITS"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function PropertyDetailPage() {
    const { propertyId } = useParams<{ propertyId: string }>();
    const router = useRouter();

    const { data: property, isLoading } = useProperty(propertyId);
    const { data: unitsData } = useUnitsQuery({ propertyId, page: 0, size: 100 });
    const canWrite = useHasRole(WRITE_ROLES);

    const { updateProperty, isLoading: isUpdating } = useUpdateProperty();
    const { activateProperty, isLoading: isActivating } = useActivateProperty();
    const { archiveProperty, isLoading: isArchiving } = useArchiveProperty();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const updateInProgressRef = useRef(false);

    const isNameDirty = name !== "" && property ? name !== property.name : false;
    const isDescriptionDirty =
        description !== "" && property ? description !== (property.description || "") : false;
    const hasUnsavedChanges = isNameDirty || isDescriptionDirty;

    const handleDiscardChanges = () => {
        setName("");
        setDescription("");
    };

    const setDirty = useUnsavedChanges((s) => s.setDirty);

    useEffect(() => {
        setDirty(hasUnsavedChanges);
        if (!hasUnsavedChanges) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => {
            window.removeEventListener("beforeunload", handler);
        };
    }, [hasUnsavedChanges, setDirty]);

    // Always clear the dirty flag when this page unmounts.
    useEffect(() => () => setDirty(false), [setDirty]);

    const handleBackClick = () => {
        if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Leave without saving?")) {
            return;
        }
        router.push("/dashboard/properties");
    };

    const handleUpdate = async () => {
        if (!property) return;
        if (updateInProgressRef.current) return;
        updateInProgressRef.current = true;

        try {
            await updateProperty(property.propertyId, {
                name: name || property.name,
                description: description || property.description,
            });
            setName("");
            setDescription("");
        } catch (err) {
            console.error("Failed to update property:", err);
        } finally {
            updateInProgressRef.current = false;
        }
    };

    if (isLoading) {
        return (
            <div className="page-container space-y-6">
                <div className="space-y-2">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton h-8 w-64" />
                    <div className="skeleton h-4 w-48" />
                </div>
                <div className="skeleton h-40 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="skeleton h-24 rounded-2xl" />
                    <div className="skeleton h-24 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="skeleton h-36 rounded-2xl" />
                    <div className="skeleton h-36 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="page-container">
                <div className="max-w-md mx-auto mt-16 bg-surface rounded-2xl border border-border shadow-sm p-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/[0.05]">
                        <FileQuestion className="h-7 w-7 text-ink-muted" strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-semibold text-ink mb-1">Property not found</p>
                    <p className="text-sm text-ink-muted mb-5">
                        It may have been removed, or the link is out of date.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard/properties")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-ink hover:bg-ink/[0.02] hover:border-brand-200 transition-all duration-200"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                        Back to properties
                    </button>
                </div>
            </div>
        );
    }

    const isArchived = property.status === PropertyStatus.ARCHIVED;
    const isActive = property.status === PropertyStatus.ACTIVE;
    const canActivate =
        property.status === PropertyStatus.DRAFT ||
        property.status === PropertyStatus.INACTIVE;
    const canEdit = canWrite && !isArchived;

    const totalUnits = unitsData?.totalElements ?? 0;
    const vacantUnits = unitsData?.content?.filter(
        (u) => u.occupancyStatus === "VACANT"
    ).length ?? 0;

    return (
        <div className="page-container space-y-8">
            {/* Header */}
            <div className="animate-fade-in-up space-y-4">
                <button
                    onClick={handleBackClick}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors group"
                >
                    <div className="w-6 h-6 rounded-lg bg-ink/[0.05] flex items-center justify-center group-hover:bg-ink/[0.08] transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    Back to properties
                </button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <PropertyStatusBadge status={property.status} />
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ink/[0.05] text-xs font-medium text-ink-muted">
                                <Building2 className="w-3 h-3" strokeWidth={1.5} />
                                {property.propertyType}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                property.premisesType === PremisesType.COMMERCIAL
                                    ? "bg-brand-600/10 text-brand-600"
                                    : property.premisesType === PremisesType.MIXED_USE
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        : "bg-brand-50 text-brand dark:bg-brand-800 dark:text-brand-300"
                            }`}>
                                <Landmark className="w-3 h-3" strokeWidth={1.5} />
                                {premisesTypeLabel(property.premisesType)}
                            </span>
                            {!isActive && !isArchived && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-bg border border-warning/20 text-xs font-medium text-warning-dark">
                                    <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                                    Hidden from listings
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight font-display leading-tight">
                            {property.name}
                        </h1>
                    </div>

                    {!isArchived && (
                        canWrite ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                {canActivate && (
                                    <button
                                        onClick={() => activateProperty(property.propertyId)}
                                        disabled={isActivating}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                                    >
                                        <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                                        {isActivating ? "Activating…" : "Activate"}
                                    </button>
                                )}
                                {isActive && (
                                    <button
                                        onClick={() => archiveProperty(property.propertyId)}
                                        disabled={isArchiving}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-ink-muted hover:text-danger hover:border-danger/30 hover:bg-danger/[0.03] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Archive className="w-4 h-4" strokeWidth={2} />
                                        {isArchiving ? "Archiving…" : "Archive"}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink/[0.04] border border-border text-xs text-ink-muted">
                                <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                View only — owners and managers can change this property
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Archived notice */}
            {isArchived && (
                <div className="animate-fade-in-up flex items-start gap-4 p-5 rounded-2xl bg-ink/[0.02] border border-ink/[0.08] shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-ink/[0.06] flex items-center justify-center shrink-0">
                        <Archive className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-ink">This property is archived</p>
                        <p className="text-sm text-ink-muted mt-0.5">
                            It&apos;s read-only and hidden from listings. Editing and status actions are disabled.
                        </p>
                    </div>
                </div>
            )}

            {/* Photos */}
            <div className="animate-fade-in-up">
                <SectionCard icon={Images} title="Photos">
                    <PropertyMediaManager propertyId={property.propertyId} />
                </SectionCard>
            </div>

            {/* Unit Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up transition-all hover:shadow-md hover:border-brand-200">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-ink/[0.04] flex items-center justify-center shadow-sm">
                            <Layers className="w-4 h-4 text-ink-muted" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">Total units</p>
                        </div>
                    </div>
                    <p className="font-data text-3xl font-bold text-ink tracking-tight">{totalUnits}</p>
                </div>
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up transition-all hover:shadow-md hover:border-brand-200">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center shadow-sm">
                            <KeyRound className="w-4 h-4 text-success-dark" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-success-dark/70 uppercase tracking-widest">Vacant units</p>
                        </div>
                    </div>
                    <p className="font-data text-3xl font-bold text-success-dark tracking-tight">{vacantUnits}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="animate-fade-in-up">
                    <SectionCard icon={ScrollText} title="Description" trailing={isDescriptionDirty && <UnsavedTag />}>
                        {canEdit ? (
                            <div className="space-y-2">
                                <textarea
                                    value={description || property.description || ""}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="form-input min-h-[100px] text-sm leading-relaxed"
                                    placeholder="Write a description for this property…"
                                />
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-ink/[0.02] border border-border/50">
                                <p className="text-sm text-ink-muted leading-relaxed">
                                    {property.description || (
                                        <span className="italic text-ink-muted/60">No description provided.</span>
                                    )}
                                </p>
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="animate-fade-in-up space-y-5">
                    <SectionCard icon={Radio} title="Occupancy">
                        <div className="p-4 rounded-xl bg-ink/[0.02] border border-border/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-ink-muted">Current status</span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-bg text-success-dark shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-success shadow-sm shadow-success/30" />
                                    {formatEnumLabel(property.occupancyStatus)}
                                </span>
                            </div>
                        </div>
                    </SectionCard>

                    {canEdit && (
                        <SectionCard icon={Tag} title="Name" trailing={isNameDirty && <UnsavedTag />}>
                            <input
                                type="text"
                                value={name || property.name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input font-medium text-ink"
                            />
                        </SectionCard>
                    )}
                </div>
            </div>

            {/* eRITS Registration */}
            <EritsRegistrationCard propertyId={propertyId} canWrite={canWrite} />

            {/* Units Section */}
            <section className="animate-fade-in-up space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                            <Home className="w-4 h-4 text-brand-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-ink">Units</h2>
                            <p className="text-xs text-ink-muted">Manage units under this property</p>
                        </div>
                    </div>
                    {canWrite && (
                        <button
                            onClick={() =>
                                router.push(`/dashboard/properties/${propertyId}/units/create`)
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-brand/20"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            Add unit
                        </button>
                    )}
                </div>

                <UnitTable propertyId={propertyId} params={{}} />
            </section>

            {/* Actions */}
            {canEdit && (
                <div className="flex items-center gap-3 flex-wrap animate-fade-in-up pt-2">
                    <button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-700 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none ${
                            hasUnsavedChanges ? "ring-2 ring-brand/30 ring-offset-2" : ""
                        }`}
                    >
                        <Save className="w-4 h-4" strokeWidth={2} />
                        {isUpdating ? "Saving…" : "Save changes"}
                    </button>

                    {hasUnsavedChanges && !isUpdating && (
                        <button
                            onClick={handleDiscardChanges}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-ink-muted hover:text-ink hover:border-ink/20 transition-all duration-200"
                        >
                            <Undo2 className="w-3.5 h-3.5" strokeWidth={2} />
                            Discard
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

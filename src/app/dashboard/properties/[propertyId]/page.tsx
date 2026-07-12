"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Building2,
    DoorOpen,
    EyeOff,
    Save,
    CheckCircle2,
    Archive,
    FileQuestion,
    Circle,
    Undo2,
    Images,
    FileText,
    Activity,
    Tag,
    Home,
} from "lucide-react";

import { useProperty } from "@/features/property/hooks/use-property";
import { useUpdateProperty } from "@/features/property/hooks/use-update-property";
import { useActivateProperty } from "@/features/property/hooks/use-activate-property";
import { useArchiveProperty } from "@/features/property/hooks/use-archive-property";
import { useUnitsQuery } from "@/features/unit/queries/use-units-query";

import { PropertyStatusBadge } from "@/features/property/components/property-status-badge";
import { UnitTable } from "@/features/unit/components/unit-table";
import { PropertyMediaManager } from "@/features/property/components/upload-gallery";
import { PropertyStatus } from "@/features/property/types/property";

// Cosmetic only -- turns "FULLY_OCCUPIED" into "Fully Occupied" for display.
// Does not touch the raw occupancyStatus value used anywhere else.
const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

function SectionTitle({
                          icon: Icon,
                          children,
                          trailing,
                      }: {
    icon: typeof Building2;
    children: React.ReactNode;
    trailing?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-3">
            <h3 className="section-header mb-0 inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                {children}
            </h3>
            {trailing}
        </div>
    );
}

function UnsavedTag() {
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-dark">
        <Circle className="h-1.5 w-1.5 fill-current" />
        Unsaved
      </span>
    );
}

export default function PropertyDetailPage() {
    const { propertyId } = useParams<{ propertyId: string }>();
    const router = useRouter();

    const { data: property, isLoading } = useProperty(propertyId);
    const { data: unitsData } = useUnitsQuery({ propertyId, page: 0, size: 100 });

    const { updateProperty, isLoading: isUpdating } = useUpdateProperty();
    const { activateProperty, isLoading: isActivating } = useActivateProperty();
    const { archiveProperty, isLoading: isArchiving } = useArchiveProperty();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const updateInProgressRef = useRef(false);

    // Dirty-state tracking, additive only -- mirrors the exact semantics
    // handleUpdate already uses (empty string = "no change", per the existing
    // fallback-to-original behavior noted below). Does not change what gets
    // submitted; only drives the "unsaved changes" indicator and discard button.
    const isNameDirty = name !== "" && property ? name !== property.name : false;
    const isDescriptionDirty =
        description !== "" && property ? description !== (property.description || "") : false;
    const hasUnsavedChanges = isNameDirty || isDescriptionDirty;

    const handleDiscardChanges = () => {
        setName("");
        setDescription("");
    };

    // Warn on tab close / refresh while there are unsaved edits. Does not
    // (and cannot, without a routing library hook) intercept Next.js
    // client-side navigation to other pages -- see the "Back to properties"
    // button below for that case specifically.
    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [hasUnsavedChanges]);

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
            // TODO: name/description fall back to the original value whenever the
            // local state is an empty string, which makes it impossible to
            // intentionally clear either field. Confirm whether empty name/description
            // should be allowed before changing this — depends on backend validation.
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
                <div>
                    <div className="skeleton h-4 w-32 mb-4" />
                    <div className="skeleton h-8 w-64 mb-2" />
                    <div className="skeleton h-4 w-48" />
                </div>
                <div className="card skeleton h-40" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="card-sm skeleton h-20" />
                    <div className="card-sm skeleton h-20" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card skeleton h-28" />
                    <div className="card skeleton h-28" />
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="page-container">
                <div className="card text-center max-w-md mx-auto mt-12">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                        <FileQuestion className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-ink mb-1">Property not found</p>
                    <p className="text-xs text-ink-muted mb-4">
                        It may have been removed, or the link is out of date.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard/properties")}
                        className="btn-outline inline-flex items-center gap-1.5 w-fit mx-auto"
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

    const totalUnits = unitsData?.totalElements ?? 0;
    const vacantUnits = unitsData?.content?.filter(
        (u) => u.occupancyStatus === "VACANT"
    ).length ?? 0;

    return (
        <div className="page-container space-y-6">
            {/* Header */}
            <div className="animate-fade-in-up">
                <button
                    onClick={handleBackClick}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-2"
                >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    Back to properties
                </button>
                <h1 className="page-title mb-1">{property.name}</h1>
                <div className="flex flex-wrap gap-2 items-center">
                    <PropertyStatusBadge status={property.status} />
                    <span className="text-sm text-ink-muted">{property.propertyType}</span>
                    {!isActive && !isArchived && (
                        <span className="pill-warning inline-flex items-center gap-1">
                  <EyeOff className="h-3 w-3" strokeWidth={2} />
                  Not visible in listings until activated
                </span>
                    )}
                </div>
            </div>

            {/* Archived notice -- moved up from the bottom action bar so it's the
            first thing you see on a read-only property, not something you
            find by scrolling to the actions row. */}
            {isArchived && (
                <div className="card-sm animate-fade-in-up border-l-4 border-ink/15 bg-ink/[0.02] flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.06]">
                        <Archive className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-ink">This property is archived</p>
                        <p className="text-xs text-ink-muted mt-0.5">
                            It&#39;s read-only and hidden from listings. Editing and status actions are disabled.
                        </p>
                    </div>
                </div>
            )}

            {/* Photos */}
            <section className="card animate-fade-in-up">
                <SectionTitle icon={Images}>Photos</SectionTitle>
                <PropertyMediaManager propertyId={property.propertyId} />
            </section>

            {/* Unit Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="card-sm animate-fade-in-up">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Building2 className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Total units</p>
                    </div>
                    <p className="font-data text-2xl font-semibold text-ink">{totalUnits}</p>
                </div>
                <div className="card-sm animate-fade-in-up">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <DoorOpen className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Vacant units</p>
                    </div>
                    <p className="font-data text-2xl font-semibold text-primary">{vacantUnits}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card animate-fade-in-up">
                    <SectionTitle icon={FileText} trailing={isDescriptionDirty && <UnsavedTag />}>
                        Description
                    </SectionTitle>
                    {!isArchived ? (
                        <>
                  <textarea
                      value={description || property.description || ""}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-input"
                      rows={3}
                      placeholder="No description"
                  />
                            <p className="text-xs text-ink-muted mt-2">
                                Saved together with the name field via Update, below.
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-ink-muted">
                            {property.description || "No description"}
                        </p>
                    )}
                </div>

                <div className="card animate-fade-in-up">
                    <SectionTitle icon={Activity}>Occupancy</SectionTitle>
                    <span className="pill-neutral">{formatEnumLabel(property.occupancyStatus)}</span>
                </div>
            </div>

            {/* Name field (editable) */}
            {!isArchived && (
                <div className="card max-w-md animate-fade-in-up">
                    <SectionTitle icon={Tag} trailing={isNameDirty && <UnsavedTag />}>
                        Name
                    </SectionTitle>
                    <input
                        type="text"
                        value={name || property.name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                    />
                </div>
            )}

            {/* Units Section */}
            <section className="space-y-4 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <h2 className="section-header mb-0 inline-flex items-center gap-1.5">
                        <Home className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                        Units
                    </h2>
                    <button
                        onClick={() =>
                            router.push(`/dashboard/properties/${propertyId}/units/create`)
                        }
                        className="btn-primary inline-flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2} />
                        Add unit
                    </button>
                </div>

                <UnitTable propertyId={propertyId} params={{}} />
            </section>

            {/* Actions */}
            {!isArchived && (
                <div className="flex items-center gap-3 flex-wrap animate-fade-in-up">
                    <button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className={`btn-primary inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                            hasUnsavedChanges ? "ring-2 ring-primary/30 ring-offset-2" : ""
                        }`}
                    >
                        <Save className="h-4 w-4" strokeWidth={2} />
                        {isUpdating ? "Updating…" : "Update"}
                    </button>

                    {hasUnsavedChanges && !isUpdating && (
                        <button
                            onClick={handleDiscardChanges}
                            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
                        >
                            <Undo2 className="h-3.5 w-3.5" strokeWidth={2} />
                            Discard changes
                        </button>
                    )}

                    {canActivate && (
                        <button
                            onClick={() => activateProperty(property.propertyId)}
                            disabled={isActivating}
                            className="btn-success inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                            {isActivating ? "Activating…" : "Activate"}
                        </button>
                    )}

                    {isActive && (
                        <button
                            onClick={() => archiveProperty(property.propertyId)}
                            disabled={isArchiving}
                            className="btn-danger inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Archive className="h-4 w-4" strokeWidth={2} />
                            {isArchiving ? "Deactivating…" : "Deactivate"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
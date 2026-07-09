"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { useProperty } from "@/features/property/hooks/use-property";
import { useUpdateProperty } from "@/features/property/hooks/use-update-property";
import { useActivateProperty } from "@/features/property/hooks/use-activate-property";
import { useArchiveProperty } from "@/features/property/hooks/use-archive-property";
import { useUnitsQuery } from "@/features/unit/queries/use-units-query";

import { PropertyStatusBadge } from "@/features/property/components/property-status-badge";
import { UnitTable } from "@/features/unit/components/unit-table";
import { PropertyMediaManager } from "@/features/property/components/upload-gallery";
import { PropertyStatus } from "@/features/property/types/property";

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
    } catch (err) {
      console.error("Failed to update property:", err);
    } finally {
      updateInProgressRef.current = false;
    }
  };

  if (isLoading) {
    return (
        <div className="page-container">
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-48 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <div className="card-sm skeleton h-20" />
            <div className="card-sm skeleton h-20" />
          </div>
        </div>
    );
  }

  if (!property) {
    return (
        <div className="page-container">
          <div className="card text-center max-w-md mx-auto mt-12">
            <p className="text-sm text-ink-muted">Property not found.</p>
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
        <div className="flex justify-between items-start animate-fade-in-up">
          <div>
            <button
                onClick={() => router.push("/dashboard/properties")}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to properties
            </button>
            <h1 className="page-title mb-1">{property.name}</h1>
            <div className="flex gap-2 items-center">
              <PropertyStatusBadge status={property.status} />
              <span className="text-sm text-ink-muted">{property.propertyType}</span>
              {!isActive && !isArchived && (
                  <span className="pill-warning">
                    Not visible in listings until activated
                  </span>
              )}
            </div>
          </div>
        </div>

        {/* Photos */}
        <section className="card animate-fade-in-up">
          <h3 className="section-header">Photos</h3>
          <PropertyMediaManager propertyId={property.propertyId} />
        </section>

        {/* Unit Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card-sm animate-fade-in-up">
            <p className="text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wide">Total units</p>
            <p className="font-data text-2xl font-semibold text-ink">{totalUnits}</p>
          </div>
          <div className="card-sm animate-fade-in-up">
            <p className="text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wide">Vacant units</p>
            <p className="font-data text-2xl font-semibold text-primary">{vacantUnits}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card animate-fade-in-up">
            <h3 className="section-header">Description</h3>
            {!isArchived ? (
                <textarea
                    defaultValue={property.description || ""}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="No description"
                />
            ) : (
                <p className="text-sm text-ink-muted">
                  {property.description || "No description"}
                </p>
            )}
          </div>

          <div className="card animate-fade-in-up">
            <h3 className="section-header">Occupancy</h3>
            <p className="text-sm text-ink-muted">{property.occupancyStatus}</p>
          </div>
        </div>

        {/* Name field (editable) */}
        {!isArchived && (
            <div className="card max-w-md animate-fade-in-up">
              <h3 className="section-header">Name</h3>
              <input
                  type="text"
                  defaultValue={property.name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
              />
            </div>
        )}

        {/* Units Section */}
        <section className="space-y-4 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <h2 className="section-header mb-0">Units</h2>
            <button
                onClick={() =>
                    router.push(`/dashboard/properties/${propertyId}/units/create`)
                }
                className="btn-primary inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add unit
            </button>
          </div>

          <UnitTable propertyId={propertyId} params={{}} />
        </section>

        {/* Actions */}
        <div className="flex gap-3 animate-fade-in-up">
          {!isArchived && (
              <>
                <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Updating…" : "Update"}
                </button>

                {canActivate && (
                    <button
                        onClick={() => activateProperty(property.propertyId)}
                        disabled={isActivating}
                        className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActivating ? "Activating…" : "Activate"}
                    </button>
                )}

                {isActive && (
                    <button
                        onClick={() => archiveProperty(property.propertyId)}
                        disabled={isArchiving}
                        className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isArchiving ? "Deactivating…" : "Deactivate"}
                    </button>
                )}
              </>
          )}

          {isArchived && (
              <div className="pill-neutral">
                This property is archived (read-only)
              </div>
          )}
        </div>
      </div>
  );
}
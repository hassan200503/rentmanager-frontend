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
    return <div className="p-6">Loading...</div>;
  }

  if (!property) {
    return <div className="p-6">Property not found</div>;
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
      <div className="space-y-6 p-6 bg-gray-50">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {property.name}
            </h1>
            <div className="flex gap-2 mt-2 items-center">
              <PropertyStatusBadge status={property.status} />
              <span className="text-sm text-gray-500">{property.propertyType}</span>
              {!isActive && !isArchived && (
                  <span className="text-xs text-amber-600">
                    Not visible in public listings until activated
                  </span>
              )}
            </div>
          </div>

          <button
              onClick={() => router.push("/dashboard/properties")}
              className="text-sm text-primary underline"
          >
            Back
          </button>
        </div>

        {/* Photos */}
        <section className="card bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-3 text-gray-800">Photos</h3>
          <PropertyMediaManager propertyId={property.propertyId} />
        </section>

        {/* Unit Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-2xl font-semibold text-gray-900">{totalUnits}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-gray-500">Vacant Units</p>
            <p className="text-2xl font-semibold text-green-600">{vacantUnits}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2 text-gray-800">Description</h3>
            {!isArchived ? (
                <textarea
                    defaultValue={property.description || ""}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm text-gray-700 border border-gray-300 rounded p-2"
                    rows={3}
                    placeholder="No description"
                />
            ) : (
                <p className="text-sm text-gray-600">
                  {property.description || "No description"}
                </p>
            )}
          </div>

          <div className="card bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2 text-gray-800">Occupancy</h3>
            <p className="text-sm text-gray-600">{property.occupancyStatus}</p>
          </div>
        </div>

        {/* Name field (editable) */}
        {!isArchived && (
            <div className="card bg-white p-4 rounded shadow max-w-md">
              <h3 className="font-medium mb-2 text-gray-800">Name</h3>
              <input
                  type="text"
                  defaultValue={property.name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded p-2"
              />
            </div>
        )}

        {/* Units Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Units</h2>
            <button
                onClick={() =>
                    router.push(`/dashboard/properties/${propertyId}/units/create`)
                }
                className="btn-primary"
            >
              Add Unit
            </button>
          </div>

          <UnitTable propertyId={propertyId} params={{}} />
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          {!isArchived && (
              <>
                <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </button>

                {canActivate && (
                    <button
                        onClick={() => activateProperty(property.propertyId)}
                        disabled={isActivating}
                        className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActivating ? "Activating..." : "Activate"}
                    </button>
                )}

                {isActive && (
                    <button
                        onClick={() => archiveProperty(property.propertyId)}
                        disabled={isArchiving}
                        className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isArchiving ? "Deactivating..." : "Deactivate"}
                    </button>
                )}
              </>
          )}

          {isArchived && (
              <div className="text-sm text-gray-500">
                This property is archived (read‑only)
              </div>
          )}
        </div>
      </div>
  );
}
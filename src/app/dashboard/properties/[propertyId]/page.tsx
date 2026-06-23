"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { useProperty } from "@/features/property/hooks/use-property";
import { useUpdateProperty } from "@/features/property/hooks/use-update-property";
import { useArchiveProperty } from "@/features/property/hooks/use-archive-property";

import { PropertyStatusBadge } from "@/features/property/components/property-status-badge";
import { UnitTable } from "@/features/unit/components/unit-table";

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();

  const { data: property, isLoading } = useProperty(propertyId);

  const { updateProperty, isLoading: isUpdating } = useUpdateProperty();
  const { archiveProperty } = useArchiveProperty();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // -----------------------------------------------------------------
  // Guard to prevent the update handler from running twice (e.g. React
  // Strict Mode double‑mount). The ref persists across renders but does
  // not trigger re‑renders.
  // -----------------------------------------------------------------
  const updateInProgressRef = useRef(false);

  const handleUpdate = async () => {
    // ---- added guard for TypeScript ----
    if (!property) {
      return;
    }
    // ------------------------------------

    if (updateInProgressRef.current) {
      // Already processing an update – ignore subsequent calls
      return;
    }
    updateInProgressRef.current = true;

    try {
      await updateProperty(property.propertyId, {
        name: name || property.name,
        description: description || property.description,
      });
    } catch (err) {
      console.error("Failed to update property:", err);
    } finally {
      // Reset the guard so the user can try again if needed
      updateInProgressRef.current = false;
    }
  };
  // -----------------------------------------------------------------

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!property) {
    return <div className="p-6">Property not found</div>;
  }

  const isArchived = property.status === "ARCHIVED";

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {property.name}
          </h1>
          <div className="flex gap-2 mt-2">
            <PropertyStatusBadge status={property.status} />
            <span className="text-sm text-gray-500">{property.propertyType}</span>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/properties")}
          className="text-sm text-primary underline"
        >
          Back
        </button>
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
              router.push(
                `/dashboard/properties/${propertyId}/units/create`
              )
            }
            className="btn-primary"
          >
            Add Unit
          </button>
        </div>

        {/* Unit table – uses the existing UnitTable component */}
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

            <button
              onClick={() => archiveProperty(property.propertyId)}
              className="btn-danger"
            >
              Archive
            </button>
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

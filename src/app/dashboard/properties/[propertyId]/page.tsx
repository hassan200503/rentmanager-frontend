"use client";

import { useParams, useRouter } from "next/navigation";

import { useProperty } from "@/features/property/hooks/use-property";
import { useUpdateProperty } from "@/features/property/hooks/use-update-property";
import { useArchiveProperty } from "@/features/property/hooks/use-archive-property";

import { PropertyStatusBadge } from "@/features/property/components/property-status-badge";

export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();

  const { data: property, isLoading } = useProperty(propertyId);

  const { updateProperty } = useUpdateProperty();
  const { archiveProperty } = useArchiveProperty();

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
            <span className="text-sm text-gray-500">
              {property.propertyType}
            </span>
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
          <p className="text-sm text-gray-600">
            {property.description || "No description"}
          </p>
        </div>

        <div className="card bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2 text-gray-800">Occupancy</h3>
          <p className="text-sm text-gray-600">{property.occupancyStatus}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!isArchived && (
          <>
            <button
              onClick={() =>
                updateProperty(property.propertyId, {
                  name: property.name,
                })
              }
              className="btn-primary"
            >
              Update
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

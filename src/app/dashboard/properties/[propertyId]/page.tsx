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
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-start">

                <div>
                    <h1 className="text-xl font-semibold">
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
                    className="text-sm underline"
                >
                    Back
                </button>
            </div>

            {/* INFO GRID */}
            <div className="grid grid-cols-2 gap-6">

                <div className="p-4 border rounded">
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-gray-600">
                        {property.description || "No description"}
                    </p>
                </div>

                <div className="p-4 border rounded">
                    <h3 className="font-medium mb-2">Occupancy</h3>
                    <p className="text-sm">
                        {property.occupancyStatus}
                    </p>
                </div>

            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">

                {!isArchived && (
                    <>
                        <button
                            onClick={() => updateProperty(property.propertyId, {
                                name: property.name,
                            })}
                            className="px-3 py-2 border rounded"
                        >
                            Update
                        </button>

                        <button
                            onClick={() => archiveProperty(property.propertyId)}
                            className="px-3 py-2 bg-red-600 text-white rounded"
                        >
                            Archive
                        </button>
                    </>
                )}

                {isArchived && (
                    <div className="text-sm text-gray-500">
                        This property is archived (read-only)
                    </div>
                )}

            </div>

        </div>
    );
}
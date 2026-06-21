import { useState } from "react";
import { usePropertiesQuery } from "../queries/use-properties-query";
import { PropertyStatusBadge } from "./property-status-badge";
import { PropertyFilterState } from "../hooks/use-property-filters";
import { PropertyResponse } from "../types/property-response";
import { PropertyDialog } from "./property-dialog";
import { PropertyForm } from "./property-form";
import { useUpdateProperty } from "../hooks/use-update-property";

type PropertyTableProps = {
  params: PropertyFilterState;
};

export const PropertyTable = ({ params }: PropertyTableProps) => {
  const { data, isLoading, error } = usePropertiesQuery(params);
  const [selectedProperty, setSelectedProperty] = useState<PropertyResponse | null>(null);
  const { updateProperty, isLoading: isUpdating } = useUpdateProperty();

  const handleEdit = (property: PropertyResponse) => {
    setSelectedProperty(property);
  };

  const handleClose = () => {
    setSelectedProperty(null);
  };

  const handleUpdate = async (values: any) => {
    if (selectedProperty) {
      await updateProperty(selectedProperty.propertyId, values);
      handleClose();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-white">Loading properties...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400">
        Failed to load properties.
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-white border-collapse">
        <thead>
          <tr className="bg-card">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Occupancy</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {data?.content?.map((p: PropertyResponse) => (
            <tr key={p.propertyId} className="border-b border-card-border">
              <td className="p-3">{p.name}</td>
              <td className="p-3">{p.propertyType}</td>
              <td className="p-3">
                <PropertyStatusBadge status={p.status} />
              </td>
              <td className="p-3">{p.occupancyStatus}</td>
              <td className="p-3">
                <button
                  onClick={() => handleEdit(p)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
          {data?.empty && (
            <tr>
              <td
                className="py-4 text-sm text-gray-500 text-center"
                colSpan={5}
              >
                No properties found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <PropertyDialog open={!!selectedProperty}>
        {selectedProperty && (
          <PropertyForm
            onSubmit={handleUpdate}
            loading={isUpdating}
            submitLabel="Update Property"
            defaultValues={{
              name: selectedProperty.name,
              propertyType: selectedProperty.propertyType,
              description: selectedProperty.description || "",
              address: selectedProperty.address,
              geoLocation: selectedProperty.geoLocation,
              dimensions: selectedProperty.dimensions,
              imageUrl: selectedProperty.imageUrl || "",
            }}
          />
        )}
      </PropertyDialog>
    </div>
  );
};

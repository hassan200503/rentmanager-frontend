import { usePropertiesQuery } from "../queries/use-properties-query";
import { PropertyStatusBadge } from "./property-status-badge";
import { PropertyFilterState } from "../hooks/use-property-filters";
import { PropertyResponse } from "../types/property-response";

type PropertyTableProps = {
  params: PropertyFilterState;
};

export const PropertyTable = ({ params }: PropertyTableProps) => {
  const { data, isLoading, error } = usePropertiesQuery(params);

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-gray-600">Loading properties...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-danger">
        Failed to load properties.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Name
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Type
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Status
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {data?.content?.map((p: PropertyResponse) => (
            <tr
              key={p.propertyId}
              className="border-b border-gray-200 hover:bg-gray-50 transition"
            >
              <td className="p-3 text-sm text-gray-800">{p.name}</td>
              <td className="p-3 text-sm text-gray-800">{p.propertyType}</td>
              <td className="p-3">
                <PropertyStatusBadge status={p.status} />
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={() => router.push(`/dashboard/properties/${p.propertyId}/edit`)}
                  className="btn-primary text-sm px-3 py-2 rounded"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}

          {data?.empty && (
            <tr>
              <td
                colSpan={4}
                className="py-4 text-center text-sm text-gray-500"
              >
                No properties found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

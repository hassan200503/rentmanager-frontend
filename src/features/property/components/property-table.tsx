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
            </tr>
          ))}
          {data?.empty && (
            <tr>
              <td
                className="py-4 text-sm text-gray-500 text-center"
                colSpan={4}
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

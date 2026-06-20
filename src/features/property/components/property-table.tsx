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
        return <div className="rounded border p-4 text-sm">Loading properties...</div>;
    }

    if (error) {
        return (
            <div className="rounded border border-red-200 p-4 text-sm text-red-700">
                Failed to load properties.
            </div>
        );
    }

    return (
        <div className="w-full overflow-auto">
            <table className="w-full">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Occupancy</th>
                </tr>
                </thead>

                <tbody>
                {data?.content?.map((p: PropertyResponse) => (
                    <tr key={p.propertyId}>
                        <td>{p.name}</td>
                        <td>{p.propertyType}</td>
                        <td>
                            <PropertyStatusBadge status={p.status} />
                        </td>
                        <td>{p.occupancyStatus}</td>
                    </tr>
                ))}
                {data?.empty && (
                    <tr>
                        <td className="py-4 text-sm text-gray-500" colSpan={4}>
                            No properties found.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};

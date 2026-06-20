import { useState } from "react";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import {
    PropertyStatus,
    OccupancyStatus,
    PropertyType,
} from "@/features/property/types/property";

import PropertyTable from "@/features/property/components/property-table";

/**
 * Hook that manages the filter state.
 */
export function usePropertyFilters() {
    const [filters, setFilters] = useState(/** @type {PropertyFilterState} */ ({}));

    const updateFilter = (patch) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    };

    return { filters, updateFilter };
}

/**
 * UI component that renders the filter controls and the property table.
 *
 * @param {{ onChange: (filters: Partial<PropertyFilterState>) => void }} props
 */
export function PropertyFilters({ onChange }) {
    const { filters, updateFilter } = usePropertyFilters();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [occupancy, setOccupancy] = useState("");

    // -------------------------------------------------------------------------
    // Handlers – each one updates local UI state and notifies the parent via
    // onChange. They also keep the internal filter state in sync.
    // -------------------------------------------------------------------------
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        onChange({ search: value });
        updateFilter({ search: value });
    };

    const handleStatusChange = (e) => {
        const value = e.target.value;
        setStatus(value);
        const enumValue = value ? PropertyStatus[value] : undefined;
        onChange({ status: enumValue });
        updateFilter({ status: enumValue });
    };

    const handleOccupancyChange = (e) => {
        const value = e.target.value;
        setOccupancy(value);
        const enumValue = value ? OccupancyStatus[value] : undefined;
        onChange({ occupancyStatus: enumValue });
        updateFilter({ occupancyStatus: enumValue });
    };

    const handlePropertyTypeChange = (e) => {
        const value = e.target.value;
        const enumValue = value ? PropertyType[value] : undefined;
        onChange({ propertyType: enumValue });
        updateFilter({ propertyType: enumValue });
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    return (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 mb-4 md:mb-0">
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search properties"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                />

                <select
                    value={status}
                    onChange={handleStatusChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                >
                    <option value="">All statuses</option>
                    {Object.keys(PropertyStatus).map((key) => (
                        <option key={key} value={key}>
                            {key.replace("_", " ")}
                        </option>
                    ))}
                </select>

                <select
                    value={occupancy}
                    onChange={handleOccupancyChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                >
                    <option value="">All occupancies</option>
                    {Object.keys(OccupancyStatus).map((key) => (
                        <option key={key} value={key}>
                            {key.replace("_", " ")}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.propertyType ?? ""}
                    onChange={handlePropertyTypeChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All types</option>
                    {Object.keys(PropertyType).map((key) => (
                        <option key={key} value={key}>
                            {key.replace("_", " ")}
                        </option>
                    ))}
                </select>
            </div>

            {/* Property table receives the *current* filter state */}
            <PropertyTable filters={filters} />
        </div>
    );
}

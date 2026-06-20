import { useState, useEffect } from "react";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import { PropertyStatus, OccupancyStatus, PropertyType } from "@/features/property/types/property";

export interface PropertyFilterState {
    search?: string;
    status?: PropertyStatus;
    occupancyStatus?: OccupancyStatus;
    propertyType?: PropertyType;
    page?: number;
    size?: number;
}

export function usePropertyFilters() {
    const [filters, setFilters] = useState<PropertyFilterState>({});

    const updateFilter = (patch: Partial<PropertyFilterState>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    };

    return { filters, updateFilter };
}

export function PropertyFilters({
    onChange,
}) {
    const { filters, updateFilter } = usePropertyFilters();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [occupancy, setOccupancy] = useState<string | null>(null);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        onChange({ search: e.target.value });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        onChange({ status: value === "" ? null : PropertyStatus[value] });
    };

    const handleOccupancyChange = (value: string) => {
        setOccupancy(value);
        onChange({ status: occupancy ? PropertyType[value] : null });
    };

    return (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 mb-4 md:mb-0">
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search properties"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                    value={status}
                    onChange={handleStatusChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="FULLY_OCCUPIED">Fully Occupied</option>
                </select>
                <select
                    value={occupancy}
                    onChange={handleOccupancyChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Select occupancy</option>
                    <option value="VACANT">VACANT</option>
                    <option value="FULLY_OCCUPIED">Fully Occupied</option>
                </select>
            </div>

            <PropertyTable filters={filters} />
        </div>
    );
}

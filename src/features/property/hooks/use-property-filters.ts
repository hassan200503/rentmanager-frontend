import { useState } from "react";
import { PropertyStatus, OccupancyStatus, PropertyType } from "../types/property";

export interface PropertyFilterState {
    search?: string;
    status?: PropertyStatus;
    occupancyStatus?: OccupancyStatus;
    propertyType?: PropertyType;
    page?: number;
    size?: number;
}

export const usePropertyFilters = () => {
    const [filters, setFilters] = useState<PropertyFilterState>({
        page: 0,
        size: 10,
    });

    const updateFilter = (patch: Partial<PropertyFilterState>) => {
        setFilters((prev) => ({
            ...prev,
            ...patch,
            page: patch.search !== undefined || patch.status !== undefined ? 0 : prev.page,
        }));
    };

    const resetFilters = () => {
        setFilters({
            page: 0,
            size: 10,
        });
    };

    return {
        filters,
        updateFilter,
        resetFilters,
    };
};

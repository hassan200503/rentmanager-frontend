import { useState } from "react";
import { PropertyStatus, OccupancyStatus, PropertyType } from "../types/property";

export interface PropertyFilterState {
    search?: string;
    status?: PropertyStatus;
    occupancyStatus?: OccupancyStatus;
    propertyType?: PropertyType;
    /** Spring Data sort expression, e.g. "name,asc". */
    sort?: string;
    page?: number;
    size?: number;
}

const DEFAULT_FILTERS: PropertyFilterState = {
    page: 0,
    size: 10,
};

export const usePropertyFilters = () => {
    const [filters, setFilters] = useState<PropertyFilterState>(DEFAULT_FILTERS);

    const updateFilter = (patch: Partial<PropertyFilterState>) => {
        setFilters((prev) => ({
            ...prev,
            ...patch,
            page:
                patch.search !== undefined ||
                patch.status !== undefined ||
                patch.propertyType !== undefined
                    ? 0
                    : (patch.page ?? prev.page),
        }));
    };

    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
    };

    return {
        filters,
        updateFilter,
        resetFilters,
    };
};

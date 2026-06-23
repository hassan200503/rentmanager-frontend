"use client";

import { useState } from "react";
import { UnitStatus } from "../types/unit";

export interface UnitFilterState {
    search: string;
    status: UnitStatus | "";
    minRent: number | "";
    maxRent: number | "";
}

export const DEFAULT_UNIT_FILTERS: UnitFilterState = {
    search: "",
    status: "",
    minRent: "",
    maxRent: "",
};

export const useUnitFilters = () => {
    const [filters, setFilters] = useState<UnitFilterState>(DEFAULT_UNIT_FILTERS);

    const updateFilter = (patch: Partial<UnitFilterState>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    };

    const resetFilters = () => {
        setFilters(DEFAULT_UNIT_FILTERS);
    };

    return { filters, updateFilter, resetFilters };
};
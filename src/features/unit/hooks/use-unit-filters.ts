"use client";

import { useState } from "react";
import { UnitStatus } from "../types/unit";

export interface UnitFilterState {
    search: string;
    status: UnitStatus | "";
    minRent: number | "";
    maxRent: number | "";
}

const defaultFilters: UnitFilterState = {
    search: "",
    status: "",
    minRent: "",
    maxRent: "",
};

export const useUnitFilters = () => {
    const [filters, setFilters] = useState<UnitFilterState>(defaultFilters);

    const updateFilter = (patch: Partial<UnitFilterState>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    };

    const resetFilters = () => {
        setFilters(defaultFilters);
    };

    return { filters, updateFilter, resetFilters };
};
"use client";

import { useState, useEffect } from "react";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import { PropertyStatus } from "@/features/property/types/property";

/**
 * PropertyFilters component
 *
 * - Receives an `onChange` callback from the parent page.
 * - Calls `onChange` with a **partial** filter state whenever the user
 *   updates the search text or the status dropdown.
 * - The component is fully typed, SaaS‑grade and does not expose any
 *   internal state outside of the callback.
 */
export function PropertyFilters({
    onChange,
}: {
    /** Called with a partial filter patch whenever a filter changes */
    onChange: (patch: Partial<PropertyFilterState>) => void;
}) {
    // Local UI state – mirrors the global filter but does not write to it directly.
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<PropertyStatus | null>(null);

    // Keep local UI in sync if the parent updates the global filter (e.g. on page load).
    useEffect(() => {
        // No external sync needed now; placeholder for future enhancements.
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        onChange({ search: value });
    };

    const handleStatusChange = (value: PropertyStatus | null) => {
        setStatus(value);
        onChange({ status: value });
    };

    return (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Search input */}
            <div className="flex-1 mb-4 md:mb-0">
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search properties"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Status selector */}
            <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                    value={status ?? ""}
                    onChange={(e) =>
                        handleStatusChange(
                            e.target.value === "" ? null : (e.target.value as PropertyStatus)
                        )
                    }
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="FULLY_OCCUPIED">Fully Occupied</option>
                </select>
            </div>
        </div>
    );
}

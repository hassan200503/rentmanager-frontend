"use client";

import { useState, useEffect } from "react";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import { PropertyStatus } from "@/features/property/types/property";

export function PropertyFilters({
  onChange,
}: {
  onChange: (patch: Partial<PropertyFilterState>) => void;
}) {
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<PropertyStatus | null>(null);

  useEffect(() => {
    // Placeholder for future sync with external filter state
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onChange({ search: value });
  };

  const handleStatusChange = (value: PropertyStatus | null) => {
    setStatus(value);
    onChange({ status: value ?? undefined });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search properties"
          value={search}
          onChange={handleSearchChange}
          className="input-field"
        />
      </div>

      {/* Status */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={status ?? ""}
          onChange={(e) =>
            handleStatusChange(
              e.target.value === "" ? null : (e.target.value as PropertyStatus)
            )
          }
          className="input-field"
        >
          <option value="">All</option>
          <option value="AVAILABLE">Available</option>
          <option value="FULLY_OCCUPIED">Fully Occupied</option>
        </select>
      </div>
    </div>
  );
}

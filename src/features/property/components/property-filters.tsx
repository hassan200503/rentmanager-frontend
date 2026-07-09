"use client";

import { useState, useEffect } from "react";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import { PropertyStatus } from "@/features/property/types/property";

const formatStatusLabel = (status: string) =>
    status
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export function PropertyFilters({
                                  onChange,
                                }: {
  onChange: (patch: Partial<PropertyFilterState>) => void;
}) {
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<PropertyStatus | null>(null);

  // NOTE: no debounce on search — every keystroke calls onChange upward, likely
  // triggering a refetch per character. Flagging as a behavior/perf decision,
  // not fixing here since it may need a debounce utility not yet confirmed as
  // installed in this project.

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
              className="form-input"
          />
        </div>

        {/* Status */}
        <div className="flex-1">
          <label className="form-label block mb-1">
            Status
          </label>
          {/*
          FIXED: previous options ("AVAILABLE", "FULLY_OCCUPIED") matched neither
          PropertyStatus nor OccupancyStatus and would have silently returned no
          results. Confirmed against types/property.ts — this state is already
          typed as PropertyStatus | null, so options now match that enum exactly,
          same pattern PropertyForm already uses for PropertyType options.
        */}
          <select
              value={status ?? ""}
              onChange={(e) =>
                  handleStatusChange(
                      e.target.value === "" ? null : (e.target.value as PropertyStatus)
                  )
              }
              className="form-input"
          >
            <option value="">All</option>
            {Object.values(PropertyStatus).map((value) => (
                <option key={value} value={value}>
                  {formatStatusLabel(value)}
                </option>
            ))}
          </select>
        </div>
      </div>
  );
}
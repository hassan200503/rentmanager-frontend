"use client";

import { useState } from "react";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import { PropertyStatus } from "@/features/property/types/property";
import { Search } from "lucide-react";

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
        <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                <input
                    type="text"
                    placeholder="Search properties"
                    value={search}
                    onChange={handleSearchChange}
                    className="form-input !pl-8"
                />
            </div>
            <div className="w-full md:w-48">
                <select
                    value={status ?? ""}
                    onChange={(e) =>
                        handleStatusChange(
                            e.target.value === "" ? null : (e.target.value as PropertyStatus)
                        )
                    }
                    className="form-input"
                >
                    <option value="">All statuses</option>
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
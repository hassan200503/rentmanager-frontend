"use client";

import { useEffect, useRef, useState } from "react";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import { PropertyStatus, PropertyType } from "@/features/property/types/property";
import { Search, X } from "lucide-react";

const formatLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const SEARCH_DEBOUNCE_MS = 300;

export function PropertyFilters({
    onChange,
}: {
    onChange: (patch: Partial<PropertyFilterState>) => void;
}) {
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState<PropertyStatus | null>(null);
    const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced so every keystroke doesn't trigger a refetch — only fires
    // once typing pauses for SEARCH_DEBOUNCE_MS.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onChange({ search: searchInput || undefined });
        }, SEARCH_DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    const handleStatusChange = (value: PropertyStatus | null) => {
        setStatus(value);
        onChange({ status: value ?? undefined });
    };

    const handleTypeChange = (value: PropertyType | null) => {
        setPropertyType(value);
        onChange({ propertyType: value ?? undefined });
    };

    const hasActiveFilters = Boolean(searchInput || status || propertyType);

    const clearAll = () => {
        setSearchInput("");
        setStatus(null);
        setPropertyType(null);
        onChange({ search: undefined, status: undefined, propertyType: undefined });
    };

    return (
        <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60" strokeWidth={2} />
                <input
                    type="text"
                    placeholder="Search by property name"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="form-input !pl-9"
                />
                {searchInput && (
                    <button
                        type="button"
                        onClick={() => setSearchInput("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-ink-muted/60 hover:bg-ink/[0.06] hover:text-ink-muted transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                )}
            </div>

            <div className="w-full md:w-44">
                <select
                    value={status ?? ""}
                    onChange={(e) =>
                        handleStatusChange(e.target.value === "" ? null : (e.target.value as PropertyStatus))
                    }
                    className="form-input"
                >
                    <option value="">All statuses</option>
                    {Object.values(PropertyStatus).map((value) => (
                        <option key={value} value={value}>
                            {formatLabel(value)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="w-full md:w-44">
                <select
                    value={propertyType ?? ""}
                    onChange={(e) =>
                        handleTypeChange(e.target.value === "" ? null : (e.target.value as PropertyType))
                    }
                    className="form-input"
                >
                    <option value="">All types</option>
                    {Object.values(PropertyType).map((value) => (
                        <option key={value} value={value}>
                            {formatLabel(value)}
                        </option>
                    ))}
                </select>
            </div>

            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink hover:bg-ink/[0.05] transition-colors shrink-0"
                >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                    Clear filters
                </button>
            )}
        </div>
    );
}

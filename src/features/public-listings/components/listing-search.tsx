// listing-search.tsx
"use client";

import { ChangeEvent } from "react";
import { Search } from "lucide-react";

interface ListingSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function ListingSearch({
                                  value,
                                  onChange,
                                  placeholder = "Search...",
                              }: ListingSearchProps) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" />
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="form-input w-full pl-10 text-sm shadow-sm"
            />
        </div>
    );
}
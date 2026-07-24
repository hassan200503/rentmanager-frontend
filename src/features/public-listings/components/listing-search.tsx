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
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-ink-muted" />
            </div>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="form-input w-full !pl-10 text-sm shadow-sm transition-shadow duration-200 focus:shadow-md focus:shadow-brand/10"
            />
        </div>
    );
}
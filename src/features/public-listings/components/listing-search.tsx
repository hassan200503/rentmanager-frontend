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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
        </div>
    );
}
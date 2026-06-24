"use client";

import { ChangeEvent } from "react";

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
    const handleChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        onChange(event.target.value);
    };

    return (
        <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full border rounded-md px-3 py-2"
        />
    );
}
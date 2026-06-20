import { useState } from "react";
import { usePropertyFilters } from "../hooks/use-property-filters";
import { PropertyStatus } from "../../types/property";

export default function PropertyFilters() {
    const { filters, updateFilter } = usePropertyFilters();
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState<PropertyStatus | null>(filters.status);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        updateFilter({ search: e.target.value });
    };

    const handleStatusChange = (value: PropertyStatus | null) => {
        setStatus(value);
        updateFilter({ status: value });
    };

    return (
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 mb-4 md:mb-0">
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search properties"
                    className="w-full p-2 border rounded-md"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value as PropertyStatus)}
                    className="w-full p-2 border rounded-md"
                >
                    <option value={null} className="px-4 py-2">All</option>
                    <option value="AVAILABLE" className="px-4 py-2">Available</option>
                    <option value="FULLY_OCCUPIED" className="px-4 py-2">Fully Occupied</option>
                </select>
            </div>
        </div>
    );
}

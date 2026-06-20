import { PropertyFilterState } from "../hooks/use-property-filters";
import type { components } from "@/shared/api/schema";

type RawPropertyStatus =
    components["schemas"]["PropertyResponse"]["status"];

type PropertyStatus = Exclude<RawPropertyStatus, undefined>;

type PropertyFiltersProps = {
    onChange: (patch: { search: string }) => void;
};

const isPropertyStatus = (value: string): value is PropertyStatus => {
    return (
        value === "ACTIVE" ||
        value === "DRAFT" ||
        value === "ARCHIVED"
    );
};

const PROPERTY_STATUS_OPTIONS: (PropertyStatus | "")[] = [
    "",
    "ACTIVE",
    "DRAFT",
    "ARCHIVED",
];

export const PropertyFilters = ({ onChange }: PropertyFiltersProps) => {
    return (
        <div className="flex gap-2">
            <input
                placeholder="Search"
                onChange={(e) =>
                    onChange({ search: e.target.value })
                }
            />

            <select
                onChange={(e) => {
                    const value = e.target.value;

                    onChange({
                        status: isPropertyStatus(value)
                            ? value
                            : undefined,
                    });
                }}
            >
                {PROPERTY_STATUS_OPTIONS.map((status) => (
                    <option key={status || "ALL"} value={status}>
                        {status === ""
                            ? "All"
                            : status.charAt(0) + status.slice(1).toLowerCase()}
                    </option>
                ))}
            </select>
        </div>
    );
};
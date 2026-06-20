import { useQuery } from "@tanstack/react-query";
import { PropertyListParams } from "@/types/property-list";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";
import { PropertyTable } from "@/features/property/components/property-table";
import { PropertyFilters } from "@/features/property/hooks/use-property-filters";

export function PropertyTable({ filters }: { filters: PropertyFilterState }) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["properties", filters],
        queryFn: () => fetchProperties(filters),
        keepPreviousData: true,
    });

    const { filters, updateFilter } = usePropertyFilters();

    const handleSearch = () => {
        updateFilter({ search: searchParams.search });
    };

    const handleStatusChange = (value: string) => {
        updateFilter({ status: value });
    };

    const handleOccupancyChange = (value: string) => {
        updateFilter({ occupancy: value });
    };

    return (
        <PropertyTable
            filters={filters}
            onSearch={handleSearch}
            onStatusChange={handleStatusChange}
            onOccupancyChange={handleOccupancyChange}
        />
    );
}

interface FiltersProps {
    filters: PropertyFilterState;
}

export interface PropertyTableProps {
    filters: PropertyFilterState;
}

export const PropertyTableProps = PropertyTableProps;

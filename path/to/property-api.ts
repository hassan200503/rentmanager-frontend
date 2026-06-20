import { propertyApi } from "@/features/property/api";
import { PropertyListParams } from "@/types/property-list";
import { PropertyTableProps } from "./property-types";
import { PropertyFilterState } from "@/features/property/hooks/use-property-filters";

export interface PropertyPageProps {
    filters: PropertyFilterState;
}

export interface PropertyPagePropsData {
    data: PropertyListResponse;
}

export const PropertyPage = ({ filters }: PropertyPagePropsData }: PropertyPageProps) => {
    const { data } = await propertyApi.get<PropertyListResponse>({
        query: { page: 1, size: 10 },
        params: { page: 1, size: 10 },
    });

    const { filters, updateFilter } = usePropertyFilters();

    return (
        <PropertyTable
            filters={filters}
            onSearch={() => updateFilter({ search: "" })}
            onStatusChange={() => updateFilter({ status: "" })}
            onOccupancyChange={() => updateFilter({ occupancy: "" })}
        />
    );
};

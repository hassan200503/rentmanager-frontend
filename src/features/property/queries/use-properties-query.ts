import { useQuery } from "@tanstack/react-query";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { PropertyFilterState } from "../hooks/use-property-filters";

export const usePropertiesQuery = (params?: PropertyFilterState) => {
    return useQuery({
        queryKey: propertyKeys.list(params),
        queryFn: () => propertyApi.list(params),
    });
};

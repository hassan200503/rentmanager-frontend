import { useQuery } from "@tanstack/react-query";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";

export const usePropertyQuery = (id: string) => {
    return useQuery({
        queryKey: propertyKeys.detail(id),
        queryFn: () => propertyApi.get(id),
        enabled: !!id,
    });
};
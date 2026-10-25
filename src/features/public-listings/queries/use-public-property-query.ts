import { useQuery } from "@tanstack/react-query";
import { publicPropertyApi } from "../api/public-property-api";

export const usePublicPropertyQuery = (propertyId: string) => {
    return useQuery({
        queryKey: ["public-property", propertyId],
        queryFn: () => publicPropertyApi.get(propertyId),
        enabled: !!propertyId,
    });
};
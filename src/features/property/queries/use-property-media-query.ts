import { useQuery } from "@tanstack/react-query";
import { propertyMediaService } from "../services/property-media-service";

export const propertyMediaKeys = {
    all: (propertyId: string) => ["property-media", propertyId] as const,
};

export const usePropertyMediaQuery = (propertyId: string) => {
    return useQuery({
        queryKey: propertyMediaKeys.all(propertyId),
        queryFn: () => propertyMediaService.list(propertyId),
        enabled: !!propertyId,
    });
};
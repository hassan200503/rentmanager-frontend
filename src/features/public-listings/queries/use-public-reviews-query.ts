import { useQuery } from "@tanstack/react-query";
import { publicReviewsApi } from "../api/public-reviews-api";
import { publicUnitKeys } from "./public-unit-keys";
import { publicPropertyKeys } from "./public-property-keys";

export const usePublicUnitReviewsQuery = (unitId: string) => {
    return useQuery({
        queryKey: [...publicUnitKeys.detail(unitId), "reviews"] as const,
        queryFn: () => publicReviewsApi.getForUnit(unitId),
        enabled: !!unitId,
    });
};

export const usePublicPropertyReviewsQuery = (propertyId: string) => {
    return useQuery({
        queryKey: [...publicPropertyKeys.detail(propertyId), "reviews"] as const,
        queryFn: () => publicReviewsApi.getForProperty(propertyId),
        enabled: !!propertyId,
    });
};

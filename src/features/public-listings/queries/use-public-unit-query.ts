import { useQuery } from "@tanstack/react-query";
import { publicUnitApi } from "../api/public-unit-api";

export const usePublicUnitQuery = (unitId: string) => {
    return useQuery({
        queryKey: ["public-unit", unitId],
        queryFn: () => publicUnitApi.get(unitId),
        enabled: !!unitId,
    });
};
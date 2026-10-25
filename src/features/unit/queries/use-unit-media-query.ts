import { useQuery } from "@tanstack/react-query";
import { unitMediaService } from "../services/unit-media-service";

export const unitMediaKeys = {
    all: (unitId: string) => ["unit-media", unitId] as const,
};

export const useUnitMediaQuery = (unitId: string) => {
    return useQuery({
        queryKey: unitMediaKeys.all(unitId),
        queryFn: () => unitMediaService.list(unitId),
        enabled: !!unitId,
    });
};
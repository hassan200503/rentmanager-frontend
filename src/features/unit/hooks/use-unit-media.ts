import { useUnitMediaQuery } from "../queries/use-unit-media-query";

export const useUnitMedia = (unitId: string) => {
    return useUnitMediaQuery(unitId);
};
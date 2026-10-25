import { usePublicUnitQuery } from "../queries/use-public-unit-query";

export const usePublicUnit = (
    unitId: string
) => {
    return usePublicUnitQuery(unitId);
};
import { useUnitQuery } from "../queries/use-unit-query";

export const useUnit = (id: string) => {
    return useUnitQuery(id);
};

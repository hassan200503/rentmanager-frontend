import { usePropertyQuery } from "../queries/use-property-query";

export const useProperty = (id: string) => {
    return usePropertyQuery(id);
};
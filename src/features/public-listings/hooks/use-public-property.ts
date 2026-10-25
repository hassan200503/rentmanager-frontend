import { usePublicPropertyQuery } from "../queries/use-public-property-query";

export const usePublicProperty = (
    propertyId: string
) => {
    return usePublicPropertyQuery(propertyId);
};
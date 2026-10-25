import { usePropertyUnitsQuery } from "../queries/use-property-units-query";

export const usePropertyUnits = (
    propertyId: string
) => {
    return usePropertyUnitsQuery(propertyId);
};
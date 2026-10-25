import { usePublicUnitsQuery } from "../queries/use-public-units-query";
import { PublicListingFilters } from "../types/public-listing-filters";

export const usePublicUnits = (
    filters?: PublicListingFilters
) => {
    return usePublicUnitsQuery(filters);
};
import { PublicListingFilters } from "../types/public-listing-filters";

import {usePublicPropertiesQuery} from "@/features/public-listings/queries/ use-public-properties-query";

export const usePublicProperties = (
    filters: PublicListingFilters
) => {
    return usePublicPropertiesQuery(filters);
};
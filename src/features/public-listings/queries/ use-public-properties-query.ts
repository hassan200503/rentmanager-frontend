"use client";

import { useQuery } from "@tanstack/react-query";
import { publicPropertyApi } from "../api/public-property-api";
import { publicPropertyKeys } from "./public-property-keys";
import { PublicListingFilters } from "../types/public-listing-filters";

export const usePublicPropertiesQuery = (
    filters?: PublicListingFilters
) => {
    return useQuery({
        queryKey: publicPropertyKeys.list(filters),

        queryFn: () =>
            publicPropertyApi.list(filters),
    });
};
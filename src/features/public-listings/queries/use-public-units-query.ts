"use client";

import { useQuery } from "@tanstack/react-query";
import { publicUnitApi } from "../api/public-unit-api";
import { publicUnitKeys } from "./public-unit-keys";
import { PublicListingFilters } from "@/features/public-listings/types/public-listing-filters";

export const usePublicUnitsQuery = (
    filters: PublicListingFilters = {}
) => {
    return useQuery({
        queryKey: publicUnitKeys.list(filters),

        queryFn: () =>
            publicUnitApi.list(filters),
    });
};
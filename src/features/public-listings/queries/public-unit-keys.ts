import { PublicListingFilters } from "../types/public-listing-filters";

export const publicUnitKeys = {
    all: ["public-units"] as const,

    lists: () =>
        [...publicUnitKeys.all, "list"] as const,

    list: (
        filters?: PublicListingFilters
    ) =>
        [
            ...publicUnitKeys.lists(),
            filters,
        ] as const,

    propertyUnits: (propertyId: string) =>
        [
            ...publicUnitKeys.all,
            "property",
            propertyId,
        ] as const,

    details: () =>
        [...publicUnitKeys.all, "detail"] as const,

    detail: (id: string) =>
        [...publicUnitKeys.details(), id] as const,
};
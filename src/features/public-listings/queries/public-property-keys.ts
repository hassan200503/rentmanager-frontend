import { PublicListingFilters } from "../types/public-listing-filters";

export const publicPropertyKeys = {
    all: ["public-properties"] as const,

    lists: () =>
        [...publicPropertyKeys.all, "list"] as const,

    list: (
        filters?: PublicListingFilters
    ) =>
        [
            ...publicPropertyKeys.lists(),
            filters,
        ] as const,

    details: () =>
        [...publicPropertyKeys.all, "detail"] as const,

    detail: (id: string) =>
        [...publicPropertyKeys.details(), id] as const,
};
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "./public-endpoints";
import {
    PublicPropertyPageResponse,
    PublicPropertyResponse,
} from "../types/public-property";
import { PublicListingFilters } from "../types/public-listing-filters";

const buildQuery = (filters?: PublicListingFilters) => {
    const query = new URLSearchParams();

    query.set("page", String(filters?.page ?? 0));
    query.set("size", String(filters?.size ?? 20));

    if (filters?.keyword?.trim()) {
        query.set("keyword", filters.keyword.trim());
    }

    return query.toString();
};

export const publicPropertyApi = {
    list: async (
        filters?: PublicListingFilters
    ): Promise<PublicPropertyPageResponse> => {
        const query = buildQuery(filters);

        return apiClient.get<PublicPropertyPageResponse>(
            `${publicEndpoints.properties}?${query}`
        );
    },

    get: async (
        propertyId: string
    ): Promise<PublicPropertyResponse> => {
        return apiClient.get<PublicPropertyResponse>(
            publicEndpoints.propertyById(propertyId)
        );
    },
};
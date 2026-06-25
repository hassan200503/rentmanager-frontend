import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "./public-endpoints";
import {
    PublicUnitPageResponse,
    PublicUnitResponse,
} from "../types/public-unit";
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

export const publicUnitApi = {
    list: async (
        filters?: PublicListingFilters
    ): Promise<PublicUnitPageResponse> => {
        const query = buildQuery(filters);

        return apiClient.get<PublicUnitPageResponse>(
            `${publicEndpoints.units}?${query}`
        );
    },

    getByProperty: async (
        propertyId: string,
        page = 0,
        size = 20
    ): Promise<PublicUnitPageResponse> => {
        const query = new URLSearchParams({
            page: String(page),
            size: String(size),
        });

        return apiClient.get<PublicUnitPageResponse>(
            `${publicEndpoints.unitsByProperty(propertyId)}?${query}`
        );
    },

    get: async (unitId: string): Promise<PublicUnitResponse> => {
        return apiClient.get<PublicUnitResponse>(
            publicEndpoints.unitById(unitId)
        );
    },
};
import { propertyEndpoints } from "./property-endpoints";
import {
    CreatePropertyRequest,
    PropertyListParams,
    UpdatePropertyRequest,
} from "../types/property-request";
import { PropertyPageResponse, PropertyResponse } from "../types/property-response";
import { PropertyTypeMetadataResponse } from "../types/property";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

const buildPageQuery = (params?: PropertyListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 10));
    if (params?.sort) {
        query.set("sort", params.sort);
    }
    return query;
};

export const propertyApi = {
    list: async (params?: PropertyListParams, preloadedToken?: string): Promise<PropertyPageResponse> => {
        const { token: contextToken, tenantId } = await getAuthContext();
        const token = preloadedToken ?? contextToken;

        const query = buildPageQuery(params);
        const hasFilter = Boolean(params?.search || params?.status || params?.propertyType);

        if (!hasFilter) {
            return apiClient.get<PropertyPageResponse>(
                `${propertyEndpoints.base}?${query.toString()}`,
                token,
                tenantId
            );
        }

        // /properties/search takes keyword, status and propertyType together,
        // all optional and combinable — this is the one endpoint that lets a
        // free-text search and a status/type filter apply at the same time,
        // always paginated server-side (unlike /properties/status/{status},
        // which returns every matching row unpaginated).
        if (params?.search) query.set("keyword", params.search);
        if (params?.status) query.set("status", params.status);
        if (params?.propertyType) query.set("propertyType", params.propertyType);

        return apiClient.get<PropertyPageResponse>(
            `${propertyEndpoints.search}?${query.toString()}`,
            token,
            tenantId
        );
    },

    get: async (id: string): Promise<PropertyResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<PropertyResponse>(
            propertyEndpoints.byId(id),
            token,
            tenantId
        );
    },

    getTypes: async (): Promise<PropertyTypeMetadataResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<PropertyTypeMetadataResponse>(
            propertyEndpoints.types,
            token,
            tenantId
        );
    },

    create: async (payload: CreatePropertyRequest) => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<PropertyResponse>(
            propertyEndpoints.base,
            payload,
            token,
            tenantId
        );
    },

    update: async (id: string, payload: UpdatePropertyRequest) => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<PropertyResponse>(
            propertyEndpoints.byId(id),
            payload,
            token,
            tenantId
        );
    },

    activate: async (id: string) => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<PropertyResponse>(
            propertyEndpoints.activate(id),
            undefined,
            token,
            tenantId
        );
    },

    archive: async (id: string) => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<PropertyResponse>(
            propertyEndpoints.archive(id),
            undefined,
            token,
            tenantId
        );
    },

    remove: async (id: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.delete<void>(
            propertyEndpoints.remove(id),
            token,
            tenantId
        );
    },
};
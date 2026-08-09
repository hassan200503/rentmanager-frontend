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
    return query.toString();
};

const toPage = (
    content: PropertyResponse[],
    params?: PropertyListParams
): PropertyPageResponse => {
    const page = params?.page ?? 0;
    const size = params?.size ?? content.length;

    return {
        content,
        totalElements: content.length,
        totalPages: content.length === 0 ? 0 : 1,
        number: page,
        size,
        first: page === 0,
        last: true,
        empty: content.length === 0,
    };
};

export const propertyApi = {
    list: async (params?: PropertyListParams, preloadedToken?: string): Promise<PropertyPageResponse> => {
        const { token: contextToken, tenantId } = await getAuthContext();
        const token = preloadedToken ?? contextToken;

        if (params?.status) {
            const result = await apiClient.get<PropertyResponse[] | PropertyPageResponse>(
                propertyEndpoints.byStatus(params.status),
                token,
                tenantId
            );
            if (Array.isArray(result)) {
                return toPage(result, params);
            }
            return result;
        }

        const query = buildPageQuery(params);
        const endpoint = params?.search
            ? `${propertyEndpoints.search}?keyword=${encodeURIComponent(params.search)}&${query}`
            : `${propertyEndpoints.base}?${query}`;

        return apiClient.get<PropertyPageResponse>(endpoint, token, tenantId);
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
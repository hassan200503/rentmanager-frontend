import { v5 as uuidv5 } from "uuid";
import { propertyEndpoints } from "./property-endpoints";
import {
    CreatePropertyRequest,
    PropertyListParams,
    UpdatePropertyRequest,
} from "../types/property-request";
import { PropertyPageResponse, PropertyResponse } from "../types/property-response";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";

type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const getAuthContext = async () => {
    if (typeof window === "undefined") {
        return {};
    }

    const rawTenantId = useOrgStore.getState().tenantId ?? getTenantIdFromSession() ?? undefined;

    const tenantId = rawTenantId
        ? uuidv5(rawTenantId, TENANT_NAMESPACE)
        : undefined;

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token, tenantId };
};

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
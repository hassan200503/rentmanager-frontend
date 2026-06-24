import { v5 as uuidv5 } from "uuid";
import { unitEndpoints } from "./unit-endpoints";
import {
    CreateUnitRequest,
    UnitListParams,
    UnitPageResponse,
    UnitResponse,
    UpdateUnitRequest,
} from "../types/unit-request";
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

    const rawTenantId =
        useOrgStore.getState().tenantId ?? getTenantIdFromSession() ?? undefined;

    const tenantId = rawTenantId
        ? uuidv5(rawTenantId, TENANT_NAMESPACE)
        : undefined;

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token, tenantId };
};

const buildPageQuery = (params?: UnitListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 10));
    return query.toString();
};

const toPage = (
    content: UnitResponse[],
    params?: UnitListParams
): UnitPageResponse => {
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

export const unitApi = {
    list: async (params: UnitListParams): Promise<UnitPageResponse> => {
        const { token, tenantId } = await getAuthContext();

        if (params.status) {
            const units = await apiClient.get<UnitResponse[]>(
                unitEndpoints.byStatus(params.propertyId, params.status),
                token,
                tenantId
            );
            return toPage(units, params);
        }

        const query = buildPageQuery(params);

        const endpoint = params.search
            ? `${unitEndpoints.search}?keyword=${encodeURIComponent(params.search)}&propertyId=${encodeURIComponent(params.propertyId)}&${query}`
            : `${unitEndpoints.byProperty(params.propertyId)}?${query}`;

        return apiClient.get<UnitPageResponse>(endpoint, token, tenantId);
    },

    get: async (id: string): Promise<UnitResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<UnitResponse>(
            unitEndpoints.byId(id),
            token,
            tenantId
        );
    },

    create: async (payload: CreateUnitRequest): Promise<UnitResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<UnitResponse>(
            unitEndpoints.base,
            payload,
            token,
            tenantId
        );
    },

    update: async (
        id: string,
        payload: UpdateUnitRequest
    ): Promise<UnitResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<UnitResponse>(
            unitEndpoints.byId(id),
            payload,
            token,
            tenantId
        );
    },

    uploadImage: async (
        id: string,
        file: File
    ): Promise<{ url: string }> => {
        const { token, tenantId } = await getAuthContext();

        const formData = new FormData();
        formData.append("image", file);

        return apiClient.post<{ url: string }>(
            unitEndpoints.uploadImage(id),
            formData,
            token,
            tenantId,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    },
};
import { propertyMediaEndpoints } from "../api/property-media-endpoints";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";
import { v5 as uuidv5 } from "uuid";


import {
    MediaUploadResponse,
    PropertyMediaResponse,
} from "@/lib/api/types/media-response";


type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const getAuthContext = async () => {
    if (typeof window === "undefined") return {};

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

export const propertyMediaApi = {
    list: async (propertyId: string): Promise<PropertyMediaResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<PropertyMediaResponse[]>(
            propertyMediaEndpoints.list(propertyId),
            token,
            tenantId
        );
    },

    upload: async (
        propertyId: string,
        file: File,
        primary: boolean = false
    ): Promise<MediaUploadResponse> => {
        const { token, tenantId } = await getAuthContext();
        const formData = new FormData();
        formData.append("file", file);

        return apiClient.post<MediaUploadResponse>(
            `${propertyMediaEndpoints.upload(propertyId)}?primary=${primary}`,
            formData,
            token,
            tenantId
        );
    },

    delete: async (propertyId: string, mediaId: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.delete<void>(
            propertyMediaEndpoints.delete(propertyId, mediaId),
            token,
            tenantId
        );
    },

    setPrimary: async (propertyId: string, mediaId: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<void>(
            propertyMediaEndpoints.setPrimary(propertyId, mediaId),
            undefined,
            token,
            tenantId
        );
    },

    updateCaption: async (
        propertyId: string,
        mediaId: string,
        caption: string
    ): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<void>(
            propertyMediaEndpoints.updateCaption(propertyId, mediaId),
            { caption },
            token,
            tenantId
        );
    },

    reorder: async (
        propertyId: string,
        items: { mediaId: string; sortOrder: number }[]
    ): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<void>(
            propertyMediaEndpoints.reorder(propertyId),
            { items },
            token,
            tenantId
        );
    },
};
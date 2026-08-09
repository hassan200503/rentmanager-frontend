import { propertyMediaEndpoints } from "../api/property-media-endpoints";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import {
    MediaUploadResponse,
    PropertyMediaResponse,
} from "@/lib/api/types/media-response";

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
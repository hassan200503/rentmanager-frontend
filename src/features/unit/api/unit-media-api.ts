import { unitMediaEndpoints } from "../api/unit-media-endpoints";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import { MediaUploadResponse } from "@/lib/api/types/media-response";

export const unitMediaApi = {
    list: async (unitId: string): Promise<MediaUploadResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<MediaUploadResponse[]>(
            unitMediaEndpoints.list(unitId),
            token,
            tenantId
        );
    },

    upload: async (
        unitId: string,
        file: File,
        primary: boolean = false
    ): Promise<MediaUploadResponse> => {
        const { token, tenantId } = await getAuthContext();
        const formData = new FormData();
        formData.append("file", file);

        return apiClient.post<MediaUploadResponse>(
            `${unitMediaEndpoints.upload(unitId)}?primary=${primary}`,
            formData,
            token,
            tenantId
        );
    },

    delete: async (unitId: string, mediaId: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.delete<void>(
            unitMediaEndpoints.delete(unitId, mediaId),
            token,
            tenantId
        );
    },

    setPrimary: async (unitId: string, mediaId: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<void>(
            unitMediaEndpoints.setPrimary(unitId, mediaId),
            undefined,
            token,
            tenantId
        );
    },

    updateCaption: async (
        unitId: string,
        mediaId: string,
        caption: string
    ): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<void>(
            unitMediaEndpoints.updateCaption(unitId, mediaId),
            { caption },
            token,
            tenantId
        );
    },

    reorder: async (unitId: string, mediaIds: string[]): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<void>(
            unitMediaEndpoints.reorder(unitId),
            { mediaIds },
            token,
            tenantId
        );
    },
};
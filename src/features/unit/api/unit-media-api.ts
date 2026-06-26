import { unitMediaEndpoints } from "../api/unit-media-endpoints";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";
import { v5 as uuidv5 } from "uuid";
import { MediaUploadResponse } from "@/lib/api/types/media-response";

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
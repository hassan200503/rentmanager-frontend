// api/announcements-api.ts
// Landlord-facing announcements endpoints (compose, preview, history).
import { v5 as uuidv5 } from "uuid";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";
import { announcementsEndpoints } from "./announcements-endpoints";
import {
    AnnouncementHistoryItem,
    AnnouncementPreviewResponse,
    AnnouncementResponse,
    CreateAnnouncementRequest,
} from "../types/announcement-response";

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

export const announcementsApi = {
    create: async (request: CreateAnnouncementRequest): Promise<AnnouncementResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<AnnouncementResponse>(
            announcementsEndpoints.create(),
            request,
            token,
            tenantId,
        );
    },

    preview: async (channels: string[]): Promise<AnnouncementPreviewResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<AnnouncementPreviewResponse>(
            announcementsEndpoints.preview(channels),
            token,
            tenantId,
        );
    },

    history: async (): Promise<AnnouncementHistoryItem[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<AnnouncementHistoryItem[]>(
            announcementsEndpoints.history(),
            token,
            tenantId,
        );
    },
};

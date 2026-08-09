// api/announcements-api.ts
// Landlord-facing announcements endpoints (compose, preview, history).
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import { announcementsEndpoints } from "./announcements-endpoints";
import {
    AnnouncementHistoryItem,
    AnnouncementPreviewResponse,
    AnnouncementResponse,
    CreateAnnouncementRequest,
} from "../types/announcement-response";

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

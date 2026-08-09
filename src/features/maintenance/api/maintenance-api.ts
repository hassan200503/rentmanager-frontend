// api/maintenance-api.ts
// Landlord-facing maintenance endpoints (Requests hub).
import { endpoints } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import {
    MaintenanceListParams,
    MaintenanceRequestResponse,
    MaintenanceSlaSummaryResponse,
} from "../types/maintenance-response";

const buildListQuery = (params?: MaintenanceListParams) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.direction) query.set("direction", params.direction);
    return query.toString();
};

export const maintenanceApi = {
    list: async (params?: MaintenanceListParams): Promise<MaintenanceRequestResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        const query = buildListQuery(params);
        return apiClient.get<MaintenanceRequestResponse[]>(
            query ? `${endpoints.maintenance}?${query}` : endpoints.maintenance,
            token,
            tenantId,
        );
    },

    sla: async (): Promise<MaintenanceSlaSummaryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<MaintenanceSlaSummaryResponse>(
            `${endpoints.maintenance}/sla`,
            token,
            tenantId,
        );
    },

    unviewedCount: async (): Promise<number> => {
        const { token, tenantId } = await getAuthContext();
        const response = await apiClient.get<{ count: number }>(
            `${endpoints.maintenance}/unviewed-count`,
            token,
            tenantId,
        );
        return response.count;
    },

    markAllViewed: async (): Promise<number> => {
        const { token, tenantId } = await getAuthContext();
        const response = await apiClient.post<{ count: number }>(
            `${endpoints.maintenance}/read`,
            undefined,
            token,
            tenantId,
        );
        return response.count;
    },

    updateStatus: async (id: string, status: string): Promise<MaintenanceRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<MaintenanceRequestResponse>(
            `${endpoints.maintenance}/${id}/status`,
            { status },
            token,
            tenantId,
        );
    },
};

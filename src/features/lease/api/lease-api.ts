import { leaseEndpoints } from "./lease-endpoints";
import {
    CreateLeaseRequest,
    UpdateLeaseRequest,
    LeaseActionRequest,
    LeaseSearchParams,
} from "../types/lease-request";
import { LeaseResponse, LeaseDetailResponse, LeaseActionResponse, LeasePageResponse } from "../types/lease-response";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

const buildSearchQuery = (params?: LeaseSearchParams) => {
    const query = new URLSearchParams();
    if (params?.propertyId) query.set("propertyId", params.propertyId);
    if (params?.status) query.set("status", params.status);
    if (params?.fromDate) query.set("fromDate", params.fromDate);
    if (params?.toDate) query.set("toDate", params.toDate);
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 10));
    return query.toString();
};

export const leaseApi = {
    search: async (params?: LeaseSearchParams): Promise<LeasePageResponse> => {
        const { token, tenantId } = await getAuthContext();
        const query = buildSearchQuery(params);
        return apiClient.get<LeasePageResponse>(`${leaseEndpoints.base}?${query}`, token, tenantId);
    },

    get: async (id: string): Promise<LeaseDetailResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<LeaseDetailResponse>(leaseEndpoints.byId(id), token, tenantId);
    },

    create: async (payload: CreateLeaseRequest): Promise<LeaseResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<LeaseResponse>(leaseEndpoints.base, payload, token, tenantId);
    },

    update: async (id: string, payload: UpdateLeaseRequest): Promise<LeaseResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<LeaseResponse>(leaseEndpoints.byId(id), payload, token, tenantId);
    },

    action: async (id: string, payload: LeaseActionRequest): Promise<LeaseActionResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<LeaseActionResponse>(leaseEndpoints.action(id), payload, token, tenantId);
    },

    remove: async (id: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.delete<void>(leaseEndpoints.byId(id), token, tenantId);
    },
};
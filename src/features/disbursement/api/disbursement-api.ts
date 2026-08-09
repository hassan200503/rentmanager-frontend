import { disbursementEndpoints } from "./disbursement-endpoints";
import {
    DisbursementResponse,
    InitiateDisbursementRequest,
} from "../types/disbursement-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

export const disbursementApi = {
    list: async (status?: string): Promise<DisbursementResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<DisbursementResponse[]>(
            disbursementEndpoints.list(status),
            token,
            tenantId
        );
    },

    getById: async (id: string): Promise<DisbursementResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<DisbursementResponse>(
            disbursementEndpoints.byId(id),
            token,
            tenantId
        );
    },

    initiate: async (request: InitiateDisbursementRequest): Promise<DisbursementResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<DisbursementResponse>(
            disbursementEndpoints.initiate(),
            request,
            token,
            tenantId
        );
    },
};

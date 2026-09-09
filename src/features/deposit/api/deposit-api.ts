import { depositEndpoints } from "./deposit-endpoints";
import type { DepositResponse, RefundDepositRequest } from "../types/deposit-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

export const depositApi = {
    getByLease: async (leaseId: string): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<DepositResponse>(depositEndpoints.byLease(leaseId), token, tenantId);
    },

    refund: async (depositId: string, request: RefundDepositRequest): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<DepositResponse>(depositEndpoints.refund(depositId), request, token, tenantId);
    },

    forfeit: async (depositId: string): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<DepositResponse>(depositEndpoints.forfeit(depositId), {}, token, tenantId);
    },
};

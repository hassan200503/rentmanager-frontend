import { depositEndpoints } from "./deposit-endpoints";
import type { DepositResponse, InitiateDepositRefundRequest, RefundDepositRequest } from "../types/deposit-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

export const depositApi = {
    list: async (status?: string): Promise<DepositResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<DepositResponse[]>(depositEndpoints.list(status), token, tenantId);
    },

    getByLease: async (leaseId: string): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<DepositResponse>(depositEndpoints.byLease(leaseId), token, tenantId);
    },

    getById: async (depositId: string): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<DepositResponse>(depositEndpoints.byId(depositId), token, tenantId);
    },

    refund: async (depositId: string, request: RefundDepositRequest): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<DepositResponse>(depositEndpoints.refund(depositId), request, token, tenantId);
    },

    initiateRefundViaStk: async (depositId: string, request: InitiateDepositRefundRequest): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<DepositResponse>(depositEndpoints.initiateRefund(depositId), request, token, tenantId);
    },

    cancelPendingRefund: async (depositId: string): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<DepositResponse>(depositEndpoints.cancelRefund(depositId), {}, token, tenantId);
    },

    forfeit: async (depositId: string): Promise<DepositResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<DepositResponse>(depositEndpoints.forfeit(depositId), {}, token, tenantId);
    },
};

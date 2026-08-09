import { commissionEndpoints } from "./commission-endpoints";
import type { CommissionPolicy, SetCommissionRateRequest } from "../types/commission-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

export const commissionApi = {
    getDefault: async (): Promise<CommissionPolicy> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<CommissionPolicy>(
            commissionEndpoints.default(),
            token,
            tenantId
        );
    },

    setDefault: async (request: SetCommissionRateRequest): Promise<CommissionPolicy> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<CommissionPolicy>(
            commissionEndpoints.default(),
            request,
            token,
            tenantId
        );
    },

    getLandlordRate: async (landlordOrgId: string): Promise<CommissionPolicy> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<CommissionPolicy>(
            commissionEndpoints.landlord(landlordOrgId),
            token,
            tenantId
        );
    },

    setLandlordRate: async (landlordOrgId: string, request: SetCommissionRateRequest): Promise<CommissionPolicy> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<CommissionPolicy>(
            commissionEndpoints.landlord(landlordOrgId),
            request,
            token,
            tenantId
        );
    },

    getEffectiveRate: async (landlordOrgId: string): Promise<{ ratePercent: number }> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<{ ratePercent: number }>(
            commissionEndpoints.effectiveRate(landlordOrgId),
            token,
            tenantId
        );
    },
};

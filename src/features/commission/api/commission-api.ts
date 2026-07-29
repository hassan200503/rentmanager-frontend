import { v5 as uuidv5 } from "uuid";
import { commissionEndpoints } from "./commission-endpoints";
import type { CommissionPolicy, SetCommissionRateRequest } from "../types/commission-types";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";

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

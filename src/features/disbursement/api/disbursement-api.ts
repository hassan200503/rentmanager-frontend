import { v5 as uuidv5 } from "uuid";
import { disbursementEndpoints } from "./disbursement-endpoints";
import {
    DisbursementResponse,
    InitiateDisbursementRequest,
} from "../types/disbursement-types";
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

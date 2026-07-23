// api/rent-ledger-api.ts
import { v5 as uuidv5 } from "uuid";
import { rentLedgerEndpoints } from "./rent-ledger-endpoints";
import { RentLedgerEntryResponse, RentLedgerStatus, RentTransactionResponse, RentTransactionSummaryResponse } from "../types/rent-ledger-response";
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

export const rentLedgerApi = {
    getById: async (entryId: string): Promise<RentLedgerEntryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RentLedgerEntryResponse>(
            rentLedgerEndpoints.byId(entryId),
            token,
            tenantId
        );
    },

    getByLease: async (leaseId: string): Promise<RentLedgerEntryResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RentLedgerEntryResponse[]>(
            rentLedgerEndpoints.byLease(leaseId),
            token,
            tenantId
        );
    },

    getByStatus: async (status: RentLedgerStatus): Promise<RentLedgerEntryResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RentLedgerEntryResponse[]>(
            rentLedgerEndpoints.byStatus(status),
            token,
            tenantId
        );
    },

    getTransactionsForEntry: async (entryId: string): Promise<RentTransactionResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RentTransactionResponse[]>(
            rentLedgerEndpoints.transactionsForEntry(entryId),
            token,
            tenantId
        );
    },

    getAllTransactions: async (): Promise<RentTransactionSummaryResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RentTransactionSummaryResponse[]>(
            rentLedgerEndpoints.allTransactions(),
            token,
            tenantId
        );
    },
};
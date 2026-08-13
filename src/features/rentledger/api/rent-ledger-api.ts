// api/rent-ledger-api.ts
import { rentLedgerEndpoints } from "./rent-ledger-endpoints";
import { RentLedgerEntryResponse, RentLedgerStatus, RentTransactionResponse, RentTransactionSummaryResponse, UnmatchedPaymentResponse, ResolveUnmatchedPaymentRequest } from "../types/rent-ledger-response";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

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

    getUnmatchedPayments: async (): Promise<UnmatchedPaymentResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<UnmatchedPaymentResponse[]>(
            rentLedgerEndpoints.unmatchedPayments(),
            token,
            tenantId
        );
    },

    resolveUnmatchedPayment: async (request: ResolveUnmatchedPaymentRequest): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        // The backend DTO accepts only { unitId } — the transaction id lives
        // in the URL path. Sending extra fields risks strict deserializers.
        return apiClient.post<void>(
            rentLedgerEndpoints.resolveUnmatched(request.transactionId),
            { unitId: request.unitId },
            token,
            tenantId
        );
    },

    remove: async (transactionId: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.delete<void>(
            rentLedgerEndpoints.deleteTransaction(transactionId),
            token,
            tenantId
        );
    },
};
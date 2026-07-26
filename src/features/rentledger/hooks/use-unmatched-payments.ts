// hooks/use-unmatched-payments.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentLedgerApi } from "../api/rent-ledger-api";
import { rentLedgerKeys } from "./rent-ledger-keys";
import { ResolveUnmatchedPaymentRequest } from "../types/rent-ledger-response";

export const useUnmatchedPaymentsQuery = () => {
    return useQuery({
        queryKey: rentLedgerKeys.unmatchedPayments,
        queryFn: () => rentLedgerApi.getUnmatchedPayments(),
    });
};

export const useResolveUnmatchedPaymentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: ResolveUnmatchedPaymentRequest) =>
            rentLedgerApi.resolveUnmatchedPayment(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rentLedgerKeys.unmatchedPayments });
            queryClient.invalidateQueries({ queryKey: rentLedgerKeys.allTransactions });
        },
    });
};
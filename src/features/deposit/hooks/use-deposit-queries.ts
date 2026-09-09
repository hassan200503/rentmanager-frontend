import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depositApi } from "../api/deposit-api";
import { depositKeys } from "./deposit-keys";
import type { RefundDepositRequest } from "../types/deposit-types";

export const useLeaseDeposit = (leaseId: string) => {
    return useQuery({
        queryKey: depositKeys.byLease(leaseId),
        queryFn: () => depositApi.getByLease(leaseId),
        enabled: !!leaseId,
        // 404 = no deposit yet for this lease — not an error we want to surface
        retry: (failureCount, error) => {
            const status = (error as { status?: number })?.status;
            if (status === 404) return false;
            return failureCount < 2;
        },
    });
};

export const useRefundDepositMutation = (leaseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ depositId, request }: { depositId: string; request: RefundDepositRequest }) =>
            depositApi.refund(depositId, request),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: depositKeys.byLease(leaseId) });
        },
    });
};

export const useForfeitDepositMutation = (leaseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (depositId: string) => depositApi.forfeit(depositId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: depositKeys.byLease(leaseId) });
        },
    });
};

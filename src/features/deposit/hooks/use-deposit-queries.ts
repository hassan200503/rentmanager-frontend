import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depositApi } from "../api/deposit-api";
import { depositKeys } from "./deposit-keys";
import type { DepositStatus, InitiateDepositRefundRequest, RefundDepositRequest } from "../types/deposit-types";

export const useDepositsQuery = (status?: DepositStatus) => {
    return useQuery({
        queryKey: depositKeys.list(status),
        queryFn: () => depositApi.list(status),
        // Poll every 5s while any deposit has a pending refund
        refetchInterval: (query) =>
            query.state.data?.some((d) => d.hasPendingRefund) ? 5_000 : false,
    });
};

export const useLeaseDeposit = (leaseId: string) => {
    return useQuery({
        queryKey: depositKeys.byLease(leaseId),
        queryFn: () => depositApi.getByLease(leaseId),
        enabled: !!leaseId,
        // Poll every 5 s while an STK push refund is in flight, then stop
        refetchInterval: (query) => (query.state.data?.hasPendingRefund ? 5_000 : false),
        // 404 = no deposit yet for this lease — not an error we want to surface
        retry: (failureCount, error) => {
            const status = (error as { status?: number })?.status;
            if (status === 404) return false;
            return failureCount < 2;
        },
    });
};

export const useDepositById = (depositId: string | null, pollWhilePending: boolean) => {
    return useQuery({
        queryKey: depositKeys.byId(depositId ?? ""),
        queryFn: () => depositApi.getById(depositId!),
        enabled: !!depositId,
        refetchInterval: pollWhilePending ? 5_000 : false,
    });
};

export const useRefundDepositMutation = (leaseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ depositId, request }: { depositId: string; request: RefundDepositRequest }) =>
            depositApi.refund(depositId, request),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: depositKeys.byLease(leaseId) });
            void queryClient.invalidateQueries({ queryKey: [...depositKeys.all, "list"] });
        },
    });
};

export const useInitiateRefundMutation = (leaseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ depositId, request }: { depositId: string; request: InitiateDepositRefundRequest }) =>
            depositApi.initiateRefundViaStk(depositId, request),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: depositKeys.byLease(leaseId) });
            void queryClient.invalidateQueries({ queryKey: [...depositKeys.all, "list"] });
        },
    });
};

export const useCancelPendingRefundMutation = (leaseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (depositId: string) => depositApi.cancelPendingRefund(depositId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: depositKeys.byLease(leaseId) });
            void queryClient.invalidateQueries({ queryKey: [...depositKeys.all, "list"] });
        },
    });
};

export const useForfeitDepositMutation = (leaseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (depositId: string) => depositApi.forfeit(depositId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: depositKeys.byLease(leaseId) });
            void queryClient.invalidateQueries({ queryKey: [...depositKeys.all, "list"] });
        },
    });
};

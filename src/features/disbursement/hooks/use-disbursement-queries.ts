import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disbursementApi } from "../api/disbursement-api";
import { disbursementKeys } from "./disbursement-keys";
import type { InitiateDisbursementRequest } from "../types/disbursement-types";

export const useDisbursementsQuery = (status?: string) => {
    return useQuery({
        queryKey: disbursementKeys.list(status),
        queryFn: () => disbursementApi.list(status),
    });
};

export const useDisbursementQuery = (id: string) => {
    return useQuery({
        queryKey: disbursementKeys.detail(id),
        queryFn: () => disbursementApi.getById(id),
        enabled: !!id,
    });
};

export const useInitiateDisbursementMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: InitiateDisbursementRequest) =>
            disbursementApi.initiate(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: disbursementKeys.all });
        },
    });
};

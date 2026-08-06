import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { adminKeys } from "./admin-keys";
import type { SetLandlordCommissionRequest } from "../types/admin-types";

export const useSetDefaultCommissionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: SetLandlordCommissionRequest) =>
            adminApi.setDefaultCommission(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.defaultCommission() });
            queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlords() });
        },
    });
};

export const useSetLandlordCommissionMutation = (landlordId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: SetLandlordCommissionRequest) =>
            adminApi.setLandlordCommission(landlordId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.landlordCommission(landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlord(landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlords() });
        },
    });
};

export const useClearLandlordCommissionMutation = (landlordId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => adminApi.clearLandlordCommission(landlordId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.landlordCommission(landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlord(landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlords() });
        },
    });
};

export const useUpdateLandlordStatusMutation = (landlordId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (status: "ACTIVE" | "SUSPENDED") =>
            adminApi.updateLandlordStatus(landlordId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.landlord(landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlords() });
            queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
        },
    });
};

export const useRetryDisbursementMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (disbursementId: string) =>
            adminApi.retryDisbursement(disbursementId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.disbursements() });
            queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
        },
    });
};

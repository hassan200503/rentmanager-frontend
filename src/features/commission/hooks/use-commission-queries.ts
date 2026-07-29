import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionApi } from "../api/commission-api";
import { commissionKeys } from "./commission-keys";
import type { SetCommissionRateRequest } from "../types/commission-types";

export const useDefaultCommissionQuery = () => {
    return useQuery({
        queryKey: commissionKeys.default(),
        queryFn: () => commissionApi.getDefault(),
    });
};

export const useLandlordCommissionQuery = (landlordOrgId: string) => {
    return useQuery({
        queryKey: commissionKeys.landlord(landlordOrgId),
        queryFn: () => commissionApi.getLandlordRate(landlordOrgId),
        enabled: !!landlordOrgId,
    });
};

export const useEffectiveRateQuery = (landlordOrgId: string) => {
    return useQuery({
        queryKey: commissionKeys.effectiveRate(landlordOrgId),
        queryFn: () => commissionApi.getEffectiveRate(landlordOrgId),
        enabled: !!landlordOrgId,
    });
};

export const useSetDefaultCommissionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: SetCommissionRateRequest) =>
            commissionApi.setDefault(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commissionKeys.all });
        },
    });
};

export const useSetLandlordCommissionMutation = (landlordOrgId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: SetCommissionRateRequest) =>
            commissionApi.setLandlordRate(landlordOrgId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commissionKeys.all });
        },
    });
};

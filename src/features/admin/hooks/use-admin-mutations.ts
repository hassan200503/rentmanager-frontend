import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { adminKeys } from "./admin-keys";
import type { PlatformReviewType, SetLandlordCommissionRequest, UpdatePlatformSettingsRequest } from "../types/admin-types";

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

export const useSetLandlordCommissionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { landlordId: string; ratePercent: number }) =>
            adminApi.setLandlordCommission(input.landlordId, { ratePercent: input.ratePercent }),
        onSuccess: (_data, input) => {
            queryClient.invalidateQueries({ queryKey: adminKeys.landlordCommission(input.landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlord(input.landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlords() });
        },
    });
};

export const useClearLandlordCommissionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (landlordId: string) => adminApi.clearLandlordCommission(landlordId),
        onSuccess: (_data, landlordId) => {
            queryClient.invalidateQueries({ queryKey: adminKeys.landlordCommission(landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlord(landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlords() });
        },
    });
};

export const useUpdateLandlordStatusMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { landlordId: string; status: "ACTIVE" | "SUSPENDED" }) =>
            adminApi.updateLandlordStatus(input.landlordId, input.status),
        onSuccess: (_data, input) => {
            queryClient.invalidateQueries({ queryKey: adminKeys.landlord(input.landlordId) });
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

export const useUpdatePlatformSettingsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: UpdatePlatformSettingsRequest) =>
            adminApi.updateSettings(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
        },
    });
};

export const useUploadPlatformLogoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => adminApi.uploadLogo(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
            queryClient.invalidateQueries({ queryKey: adminKeys.branding() });
        },
    });
};

export const useRemovePlatformLogoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => adminApi.removeLogo(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
            queryClient.invalidateQueries({ queryKey: adminKeys.branding() });
        },
    });
};

export const useReviewModerationMutation = () => {
    const queryClient = useQueryClient();
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: adminKeys.reviews() });
        queryClient.invalidateQueries({ queryKey: adminKeys.reviewStats() });
    };
    const approve = useMutation({
        mutationFn: (input: { type: PlatformReviewType; reviewId: string }) =>
            adminApi.reviewApprove(input.type, input.reviewId),
        onSuccess: invalidate,
    });
    const hide = useMutation({
        mutationFn: (input: { type: PlatformReviewType; reviewId: string }) =>
            adminApi.reviewHide(input.type, input.reviewId),
        onSuccess: invalidate,
    });
    return { approve, hide };
};

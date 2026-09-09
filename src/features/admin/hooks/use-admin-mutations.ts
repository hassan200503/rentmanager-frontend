import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { adminKeys } from "./admin-keys";
import { subscriptionKeys } from "@/features/subscription/queries/use-subscription-queries";
import type { AdminActivateSubscriptionRequest, PlatformReviewType, SubscriptionPlanAdminRequest, UpdatePlatformSettingsRequest } from "../types/admin-types";

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

const invalidatePlans = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: adminKeys.subscriptionPlans() });
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.plans });
};

export const useCreateSubscriptionPlanMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (request: SubscriptionPlanAdminRequest) =>
            adminApi.createSubscriptionPlan(request),
        onSuccess: () => invalidatePlans(queryClient),
    });
};

export const useUpdateSubscriptionPlanMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { id: string; request: Omit<SubscriptionPlanAdminRequest, "code"> }) =>
            adminApi.updateSubscriptionPlan(input.id, input.request),
        onSuccess: () => invalidatePlans(queryClient),
    });
};

export const useDeactivateSubscriptionPlanMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.deactivateSubscriptionPlan(id),
        onSuccess: () => invalidatePlans(queryClient),
    });
};

export const useActivateLandlordSubscriptionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { landlordId: string; request: AdminActivateSubscriptionRequest }) =>
            adminApi.activateLandlordSubscription(input.landlordId, input.request),
        onSuccess: (_data, input) => {
            queryClient.invalidateQueries({ queryKey: adminKeys.landlord(input.landlordId) });
            queryClient.invalidateQueries({ queryKey: adminKeys.landlords() });
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

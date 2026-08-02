// hooks/use-tenant-portal-mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantPortalApi, type ToggleAutoPayRequest, type UpdateAutoPayPhoneRequest } from "../api/tenant-portal-api";
import { tenantPortalKeys } from "./use-tenant-portal-queries";
import { toast } from "sonner";

export const useToggleAutoPayMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: ToggleAutoPayRequest) => tenantPortalApi.toggleAutoPay(request),
        onSuccess: (data) => {
            queryClient.setQueryData(tenantPortalKeys.autoPay(), data);
            toast.success(data.enabled ? "Auto-pay enabled" : "Auto-pay disabled");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update auto-pay settings");
        },
    });
};

export const useUpdateAutoPayPhoneMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: UpdateAutoPayPhoneRequest) => tenantPortalApi.updateAutoPayPhone(request),
        onSuccess: (data) => {
            queryClient.setQueryData(tenantPortalKeys.autoPay(), data);
            toast.success("Auto-pay phone number updated");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update phone number");
        },
    });
};

export const useMarkAnnouncementReadMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => tenantPortalApi.markAnnouncementRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.announcements() });
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.unreadAnnouncementCount() });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to mark announcement as read");
        },
    });
};

export const useUpdateWhatsAppOptInMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (enabled: boolean) => tenantPortalApi.updateWhatsAppOptIn(enabled),
        onSuccess: (data) => {
            queryClient.setQueryData(tenantPortalKeys.whatsAppOptIn(), data);
            toast.success(
                data.enabled
                    ? "WhatsApp broadcasts enabled - your landlord can message you there"
                    : "WhatsApp broadcasts disabled",
            );
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update WhatsApp preference");
        },
    });
};

// features/settings/hooks/use-tenant-settings-query.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { tenantSettingsApi, UpdateTenantProfileRequest } from "../api/tenant-settings-api";
import { UpdateTenantSettingsRequest } from "../types/tenant-settings-response";
import { tenantApi } from "@/features/tenant/api/tenant-api";

export const tenantSettingsKeys = {
    all: ["tenant-settings"] as const,
    settings: (tenantId?: string) =>
        [...tenantSettingsKeys.all, "settings", tenantId ?? ""] as const,
    profile: (tenantId?: string) =>
        [...tenantSettingsKeys.all, "profile", tenantId ?? ""] as const,
};

export const useLandlordProfileQuery = () => {
    const { user } = useCurrentUser();
    const tenantId: string = user?.tenantId ?? "";

    return useQuery({
        queryKey: tenantSettingsKeys.profile(tenantId || undefined),
        queryFn: () => tenantApi.get(tenantId),
        enabled: !!tenantId,
        staleTime: 2 * 60 * 1000,
    });
};

export const useTenantSettingsQuery = () => {
    const { user } = useCurrentUser();
    const tenantId: string = user?.tenantId ?? "";

    return useQuery({
        queryKey: tenantSettingsKeys.settings(tenantId || undefined),
        queryFn: () => tenantSettingsApi.get(tenantId),
        enabled: !!tenantId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useUpdateTenantSettingsMutation = () => {
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();
    const tenantId: string = user?.tenantId ?? "";

    return useMutation({
        mutationFn: (payload: UpdateTenantSettingsRequest) => {
            if (!tenantId) {
                throw new Error("Tenant context could not be resolved");
            }
            return tenantSettingsApi.update(tenantId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.all });
        },
    });
};

export const useUpdateTenantProfileMutation = () => {
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();
    const tenantId: string = user?.tenantId ?? "";

    return useMutation({
        mutationFn: (payload: UpdateTenantProfileRequest) => {
            if (!tenantId) {
                throw new Error("Tenant context could not be resolved");
            }
            return tenantSettingsApi.updateProfile(tenantId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.profile(tenantId) });
        },
    });
};

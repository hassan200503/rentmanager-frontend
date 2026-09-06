// hooks/use-maintenance-query.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi } from "../api/maintenance-api";
import { MaintenanceListParams } from "../types/maintenance-response";
import { useOrgStore } from "@/stores/org-store";

export const maintenanceKeys = {
    all: ["maintenance"] as const,
    list: (params?: MaintenanceListParams) => ["maintenance", "list", params ?? {}] as const,
    sla: ["maintenance", "sla"] as const,
    unviewedCount: ["maintenance", "unviewed-count"] as const,
};

export const useMaintenanceRequestsQuery = (params?: MaintenanceListParams) => {
    return useQuery({
        queryKey: maintenanceKeys.list(params),
        queryFn: () => maintenanceApi.list(params),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useMaintenanceSlaQuery = () => {
    return useQuery({
        queryKey: maintenanceKeys.sla,
        queryFn: () => maintenanceApi.sla(),
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

/**
 * V54: unviewed-requests count for the sidebar badge. Refreshes instantly
 * when a maintenance activity arrives over SSE (NotificationSync invalidates
 * it), with a quiet 60s poll + window-focus refetch as a safety net so the
 * badge never drifts stale even if the SSE stream is down.
 */
export const useUnviewedRequestsCountQuery = () => {
    // Gate on tenant resolution so the badge never fires a doomed pre-auth
    // request (same pattern as NotificationSync's activity feed).
    const tenantId = useOrgStore((s) => s.tenantId);
    return useQuery({
        queryKey: maintenanceKeys.unviewedCount,
        queryFn: () => maintenanceApi.unviewedCount(),
        enabled: Boolean(tenantId),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
    });
};

/**
 * V54: marks every unviewed request as viewed (landlord opened the Requests
 * hub). Invalidates the badge count so the sidebar clears instantly.
 */
export const useMarkAllRequestsViewedMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => maintenanceApi.markAllViewed(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.unviewedCount });
        },
    });
};

export const useUpdateMaintenanceStatusMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
            maintenanceApi.updateStatus(id, status, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
        },
    });
};

// hooks/use-maintenance-query.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi } from "../api/maintenance-api";
import { MaintenanceListParams } from "../types/maintenance-response";

export const maintenanceKeys = {
    all: ["maintenance"] as const,
    list: (params?: MaintenanceListParams) => ["maintenance", "list", params ?? {}] as const,
    sla: ["maintenance", "sla"] as const,
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

export const useUpdateMaintenanceStatusMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            maintenanceApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
        },
    });
};

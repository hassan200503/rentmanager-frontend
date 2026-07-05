import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

const refreshUnitViews = (
    queryClient: ReturnType<typeof useQueryClient>,
    unitId: string
) => {
    queryClient.invalidateQueries({ queryKey: unitKeys.detail(unitId) });
    queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ["unit-summary"] });
    queryClient.invalidateQueries({ queryKey: ["public-units"] });
};

export const useActivateUnitMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unitApi.activate,
        onSuccess: (_data, unitId) => {
            refreshUnitViews(queryClient, unitId);
            toast.success("Unit activated and eligible for public listings");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to activate unit. Please try again.")
            );
        },
    });
};

export const useArchiveUnitMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unitApi.archive,
        onSuccess: (_data, unitId) => {
            refreshUnitViews(queryClient, unitId);
            toast.success("Unit deactivated and removed from public listings");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to deactivate unit. Please try again.")
            );
        },
    });
};

export const useMarkUnitOccupiedMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unitApi.markOccupied,
        onSuccess: (_data, unitId) => {
            refreshUnitViews(queryClient, unitId);
            toast.success("Unit marked as occupied");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to update occupancy. Please try again.")
            );
        },
    });
};

export const useMarkUnitVacantMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unitApi.markVacant,
        onSuccess: (_data, unitId) => {
            refreshUnitViews(queryClient, unitId);
            toast.success("Unit marked as vacant");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to update vacancy. Please try again.")
            );
        },
    });
};

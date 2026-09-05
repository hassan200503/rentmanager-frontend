// features/settings/hooks/use-rent-reminder-cadence.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentReminderCadenceApi } from "../api/rent-reminder-cadence-api";
import { UpdateRentReminderCadenceRequest } from "../types/rent-reminder-cadence";

export const rentReminderCadenceKeys = {
    all: ["rent-reminder-cadence"] as const,
};

export const useRentReminderCadenceQuery = () =>
    useQuery({
        queryKey: rentReminderCadenceKeys.all,
        queryFn: rentReminderCadenceApi.get,
        staleTime: 5 * 60 * 1000,
    });

export const useUpdateRentReminderCadenceMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateRentReminderCadenceRequest) =>
            rentReminderCadenceApi.update(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: rentReminderCadenceKeys.all });
        },
    });
};

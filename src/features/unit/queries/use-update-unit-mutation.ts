import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { UpdateUnitRequest } from "../types/unit-request";

export const useUpdateUnitMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateUnitRequest }) =>
            unitApi.update(id, payload),
        onSuccess: async (data) => {
            await Promise.all([
                queryClient.refetchQueries({ queryKey: unitKeys.detail(data.id) }),
                queryClient.invalidateQueries({ queryKey: unitKeys.lists() }),
            ]);
            toast.success("Unit updated successfully");
        },
        onError: () => {
            toast.error("Failed to update unit. Please try again.");
        },
    });
};
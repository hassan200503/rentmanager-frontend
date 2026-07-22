import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { UpdateUnitRequest } from "../types/unit-request";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

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
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            toast.success("Unit updated successfully");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to update unit. Please try again.")
            );
        },
    });
};

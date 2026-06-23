import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { CreateUnitRequest } from "../types/unit-request";

export const useCreateUnitMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateUnitRequest) => unitApi.create(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
            toast.success(`Unit ${data.unitNumber} created successfully`);
        },
        onError: () => {
            toast.error("Failed to create unit. Please try again.");
        },
    });
};
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { CreateUnitRequest } from "../types/unit-request";
import { ApiError } from "@/lib/api/errors";

export const useCreateUnitMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               payload,
                               imageFile,
                           }: {
            payload: CreateUnitRequest;
            imageFile?: File;
        }) => {
            const unit = await unitApi.create(payload);
            if (imageFile) {
                await unitApi.uploadImage(unit.id, imageFile);
            }
            return unit;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
            toast.success(`Unit ${data.unitNumber} created successfully`);
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 409) {
                // Let the page handle showing the field error — don't toast
                return;
            }
            toast.error("Failed to create unit. Please try again.");
        },
    });
};
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { CreateUnitRequest } from "../types/unit-request";
import { ApiError } from "@/lib/api/errors";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

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
                try {
                    await unitApi.uploadImage(unit.id, imageFile);
                    toast.success("Unit photo uploaded successfully");
                } catch (error) {
                    toast.error(
                        getProcessErrorMessage(error, "Unit was created, but photo upload failed.")
                    );
                }
            }
            return unit;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ["unit-summary"] });
            toast.success(
                `Unit ${data.unitNumber} created as inactive. Activate it to publish publicly.`
            );
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 409) {
                toast.error(error.message || "A unit with this number already exists.");
                return;
            }

            toast.error(
                getProcessErrorMessage(error, "Failed to create unit. Please try again.")
            );
        },
    });
};

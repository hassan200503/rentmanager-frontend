import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";

export const useUploadUnitImageMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) =>
            unitApi.uploadImage(id, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: unitKeys.detail(variables.id),
            });
            toast.success("Image uploaded successfully");
        },
        onError: () => {
            toast.error("Failed to upload image. Please try again.");
        },
    });
};

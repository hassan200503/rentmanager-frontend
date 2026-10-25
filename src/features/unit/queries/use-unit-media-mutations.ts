import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitMediaService } from "../services/unit-media-service";
import { unitMediaKeys } from "./use-unit-media-query";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useUploadUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, primary }: { file: File; primary?: boolean }) =>
            unitMediaService.upload(unitId, file, primary),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
            queryClient.invalidateQueries({ queryKey: ["public-units"] });
            toast.success("Unit photo uploaded successfully");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to upload unit photo.")
            );
        },
    });
};

export const useDeleteUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaId: string) => unitMediaService.delete(unitId, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
            queryClient.invalidateQueries({ queryKey: ["public-units"] });
            toast.success("Unit photo deleted");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to delete unit photo.")
            );
        },
    });
};

export const useSetPrimaryUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaId: string) => unitMediaService.setPrimary(unitId, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
            queryClient.invalidateQueries({ queryKey: ["public-units"] });
            toast.success("Primary unit photo updated");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to set primary unit photo.")
            );
        },
    });
};

export const useReorderUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaIds: string[]) => unitMediaService.reorder(unitId, mediaIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
            queryClient.invalidateQueries({ queryKey: ["public-units"] });
            toast.success("Unit photo order updated");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to reorder unit photos.")
            );
        },
    });
};

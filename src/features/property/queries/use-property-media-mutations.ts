import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertyMediaService } from "../services/property-media-service";
import { propertyMediaKeys } from "../queries/use-property-media-query";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useUploadPropertyMedia = (propertyId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, primary }: { file: File; primary?: boolean }) =>
            propertyMediaService.upload(propertyId, file, primary),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: propertyMediaKeys.all(propertyId),
            });
            queryClient.invalidateQueries({ queryKey: ["public-properties"] });
            toast.success("Property photo uploaded successfully");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to upload property photo.")
            );
        },
    });
};

export const useDeletePropertyMedia = (propertyId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaId: string) =>
            propertyMediaService.delete(propertyId, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: propertyMediaKeys.all(propertyId),
            });
            queryClient.invalidateQueries({ queryKey: ["public-properties"] });
            toast.success("Property photo deleted");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to delete property photo.")
            );
        },
    });
};

export const useSetPrimaryPropertyMedia = (propertyId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaId: string) =>
            propertyMediaService.setPrimary(propertyId, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: propertyMediaKeys.all(propertyId),
            });
            queryClient.invalidateQueries({ queryKey: ["public-properties"] });
            toast.success("Primary property photo updated");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to set primary property photo.")
            );
        },
    });
};

export const useReorderPropertyMedia = (propertyId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (items: { mediaId: string; sortOrder: number }[]) =>
            propertyMediaService.reorder(propertyId, items),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: propertyMediaKeys.all(propertyId),
            });
            queryClient.invalidateQueries({ queryKey: ["public-properties"] });
            toast.success("Property photo order updated");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to reorder property photos.")
            );
        },
    });
};

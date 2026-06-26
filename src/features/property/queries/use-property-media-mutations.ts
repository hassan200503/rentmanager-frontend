import { useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyMediaService } from "../services/property-media-service";
import { propertyMediaKeys } from "../queries/use-property-media-query";

export const useUploadPropertyMedia = (propertyId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, primary }: { file: File; primary?: boolean }) =>
            propertyMediaService.upload(propertyId, file, primary),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: propertyMediaKeys.all(propertyId),
            });
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
        },
    });
};
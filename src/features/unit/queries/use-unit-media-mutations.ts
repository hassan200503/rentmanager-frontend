import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unitMediaService } from "../services/unit-media-service";
import { unitMediaKeys } from "./use-unit-media-query";

export const useUploadUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, primary }: { file: File; primary?: boolean }) =>
            unitMediaService.upload(unitId, file, primary),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
        },
    });
};

export const useDeleteUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaId: string) => unitMediaService.delete(unitId, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
        },
    });
};

export const useSetPrimaryUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaId: string) => unitMediaService.setPrimary(unitId, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
        },
    });
};

export const useReorderUnitMedia = (unitId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mediaIds: string[]) => unitMediaService.reorder(unitId, mediaIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitMediaKeys.all(unitId) });
        },
    });
};
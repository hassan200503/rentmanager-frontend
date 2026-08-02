// hooks/use-announcements-query.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { announcementsApi } from "../api/announcements-api";
import { CreateAnnouncementRequest } from "../types/announcement-response";

export const announcementsKeys = {
    all: ["announcements"] as const,
    history: () => [...announcementsKeys.all, "history"] as const,
    preview: (channels: string[]) => [...announcementsKeys.all, "preview", channels] as const,
};

export const useAnnouncementsHistoryQuery = () => {
    return useQuery({
        queryKey: announcementsKeys.history(),
        queryFn: () => announcementsApi.history(),
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};

export const useAnnouncementPreviewQuery = (channels: string[], enabled: boolean) => {
    return useQuery({
        queryKey: announcementsKeys.preview(channels),
        queryFn: () => announcementsApi.preview(channels),
        enabled,
        staleTime: 30 * 1000,
    });
};

export const useCreateAnnouncementMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateAnnouncementRequest) => announcementsApi.create(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementsKeys.all });
            toast.success("Announcement sent to your renters");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to send announcement");
        },
    });
};

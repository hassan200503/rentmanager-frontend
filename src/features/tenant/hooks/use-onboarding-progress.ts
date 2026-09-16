import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "../api/tenant-api";

const PROGRESS_KEY = ["onboarding", "progress"] as const;

export function useOnboardingProgressQuery(enabled = true) {
    return useQuery({
        queryKey: PROGRESS_KEY,
        queryFn: () => tenantApi.getOnboardingProgress(),
        enabled,
        staleTime: 30_000,
        retry: 1,
    });
}

export function useCompleteOnboardingMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => tenantApi.completeOnboarding(),
        onSuccess: (data) => {
            qc.setQueryData(PROGRESS_KEY, data);
        },
    });
}

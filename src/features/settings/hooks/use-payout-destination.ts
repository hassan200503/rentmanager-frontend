// features/settings/hooks/use-payout-destination.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { payoutDestinationApi } from "../api/payout-destination-api";
import { UpdatePayoutDestinationRequest } from "../types/payout-destination";

export const payoutDestinationKeys = {
    all: ["payout-destination"] as const,
};

export const usePayoutDestinationQuery = () =>
    useQuery({
        queryKey: payoutDestinationKeys.all,
        queryFn: payoutDestinationApi.get,
        staleTime: 5 * 60 * 1000,
    });

export const useUpdatePayoutDestinationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdatePayoutDestinationRequest) =>
            payoutDestinationApi.update(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: payoutDestinationKeys.all });
        },
    });
};

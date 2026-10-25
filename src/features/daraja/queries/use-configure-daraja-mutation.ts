import { useMutation, useQueryClient } from "@tanstack/react-query";
import { configureDarajaCredentials } from "../api/daraja-api";
import type { ConfigureDarajaCredentialsRequest } from "../types/daraja-types";
import {darajaStatusQueryKey} from "@/features/daraja/queries/use-daraja-status-query";


export function useConfigureDarajaMutation(tenantId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ConfigureDarajaCredentialsRequest) => {
            if (!tenantId) {
                throw new Error("Missing tenant id");
            }
            return configureDarajaCredentials(tenantId, payload);
        },
        onSuccess: () => {
            // Refetch rather than trust optimistic state, same pattern as
            // useActivatePropertyMutation / useArchiveUnitMutation elsewhere.
            if (tenantId) {
                queryClient.invalidateQueries({ queryKey: darajaStatusQueryKey(tenantId) });
            }
        },
    });
}
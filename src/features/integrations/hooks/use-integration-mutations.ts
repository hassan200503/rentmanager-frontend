import { useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationApi } from "../api/integration-api";
import { integrationKeys } from "./integration-keys";

/**
 * Mutations for the Integrations control plane. Every write invalidates the
 * provider detail, the list and the audit trail for the touched provider so
 * statuses, verification metadata and the audit log stay fresh.
 */
const useInvalidateProvider = (providerKey: string) => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: integrationKeys.provider(providerKey) });
        queryClient.invalidateQueries({ queryKey: integrationKeys.providers() });
        queryClient.invalidateQueries({ queryKey: integrationKeys.audit(providerKey) });
    };
};

export const useSaveIntegrationCredentialsMutation = (providerKey: string) => {
    const invalidate = useInvalidateProvider(providerKey);
    return useMutation({
        mutationFn: (input: {
            environment: string;
            credentials: Record<string, string>;
        }) => integrationApi.saveCredentials(providerKey, input.environment, input.credentials),
        onSuccess: invalidate,
    });
};

export const useActivateIntegrationMutation = (providerKey: string) => {
    const invalidate = useInvalidateProvider(providerKey);
    return useMutation({
        mutationFn: (environment: string) =>
            integrationApi.activate(providerKey, environment),
        onSuccess: invalidate,
    });
};

export const useTestIntegrationMutation = (providerKey: string) => {
    const invalidate = useInvalidateProvider(providerKey);
    return useMutation({
        mutationFn: (input: { environment: string; target?: string }) =>
            integrationApi.test(providerKey, input.environment, input.target),
        onSuccess: invalidate,
    });
};

export const useRollToProductionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => integrationApi.rollout(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: integrationKeys.providers() });
        },
    });
};

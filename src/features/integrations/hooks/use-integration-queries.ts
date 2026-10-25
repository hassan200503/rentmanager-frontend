import { useQuery } from "@tanstack/react-query";
import { integrationApi } from "../api/integration-api";
import { integrationKeys } from "./integration-keys";

export const useIntegrationProvidersQuery = () => {
    return useQuery({
        queryKey: integrationKeys.providers(),
        queryFn: () => integrationApi.list(),
        retry: false,
    });
};

export const useIntegrationProviderQuery = (providerKey: string) => {
    return useQuery({
        queryKey: integrationKeys.provider(providerKey),
        queryFn: () => integrationApi.get(providerKey),
        enabled: !!providerKey,
        placeholderData: (prev) => prev,
    });
};

export const useIntegrationAuditQuery = (providerKey: string, enabled = true) => {
    return useQuery({
        queryKey: integrationKeys.audit(providerKey),
        queryFn: () => integrationApi.audit(providerKey, 50),
        enabled: enabled && !!providerKey,
        placeholderData: (prev) => prev,
    });
};

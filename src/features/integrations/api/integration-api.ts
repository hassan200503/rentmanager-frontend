import { integrationEndpoints } from "./integration-endpoints";
import type {
    IntegrationActivateResult,
    IntegrationAuditEntry,
    IntegrationProviderView,
    IntegrationRolloutView,
    IntegrationTestResult,
} from "../types/integration-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

// Integrations control-plane endpoints are unscoped (platform-level, like the
// rest of /admin): the backend derives the platform role from the JWT and
// ignores X-Tenant-Id. Return token only, no tenantId.

export const integrationApi = {
    list: async (): Promise<IntegrationProviderView[]> => {
        const { token } = await getAuthContext();
        return apiClient.get<IntegrationProviderView[]>(integrationEndpoints.list(), token);
    },
    get: async (providerKey: string): Promise<IntegrationProviderView> => {
        const { token } = await getAuthContext();
        return apiClient.get<IntegrationProviderView>(integrationEndpoints.provider(providerKey), token);
    },
    audit: async (providerKey: string, limit = 50): Promise<IntegrationAuditEntry[]> => {
        const { token } = await getAuthContext();
        return apiClient.get<IntegrationAuditEntry[]>(integrationEndpoints.audit(providerKey, limit), token);
    },
    saveCredentials: async (
        providerKey: string,
        environment: string,
        credentials: Record<string, string>
    ): Promise<IntegrationProviderView> => {
        const { token } = await getAuthContext();
        return apiClient.put<IntegrationProviderView>(
            integrationEndpoints.credentials(providerKey, environment),
            { credentials },
            token
        );
    },
    activate: async (
        providerKey: string,
        environment: string
    ): Promise<IntegrationActivateResult> => {
        const { token } = await getAuthContext();
        return apiClient.post<IntegrationActivateResult>(
            integrationEndpoints.activate(providerKey, environment),
            undefined,
            token
        );
    },
    test: async (
        providerKey: string,
        environment: string,
        target?: string
    ): Promise<IntegrationTestResult> => {
        const { token } = await getAuthContext();
        return apiClient.post<IntegrationTestResult>(
            integrationEndpoints.test(providerKey, environment),
            target ? { target } : undefined,
            token
        );
    },
    rollout: async (): Promise<IntegrationRolloutView> => {
        const { token } = await getAuthContext();
        return apiClient.post<IntegrationRolloutView>(
            integrationEndpoints.rollout(),
            undefined,
            token
        );
    },
};

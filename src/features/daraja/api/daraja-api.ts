import { tenantEndpoints } from "@/features/tenant/api/tenant-endpoints";
import type {
    ConfigureDarajaCredentialsRequest,
    DarajaCredentialsStatusResponse,
    DarajaCredentialsTestResponse,
} from "../types/daraja-types";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

// Keeping the original exported function names/signatures so the existing
// use-daraja-status-query / use-configure-daraja-mutation hooks (not shown,
// but referenced from page.tsx) don't need to change.
export async function getDarajaCredentialsStatus(
    tenantId: string
): Promise<DarajaCredentialsStatusResponse> {
    const { token, tenantId: authTenantId } = await getAuthContext();
    return apiClient.get<DarajaCredentialsStatusResponse>(
        tenantEndpoints.darajaCredentialsStatus(tenantId),
        token,
        authTenantId
    );
}

export async function configureDarajaCredentials(
    tenantId: string,
    payload: ConfigureDarajaCredentialsRequest
): Promise<DarajaCredentialsStatusResponse> {
    const { token, tenantId: authTenantId } = await getAuthContext();
    return apiClient.put<DarajaCredentialsStatusResponse>(
        tenantEndpoints.darajaCredentials(tenantId),
        payload,
        token,
        authTenantId
    );
}

/**
 * Runs a real connection test against Safaricom using the SAVED credentials.
 * POST because it causes an outbound third-party call — it must not be
 * retried by a cache or a prefetch.
 */
export async function testDarajaCredentials(
    tenantId: string
): Promise<DarajaCredentialsTestResponse> {
    const { token, tenantId: authTenantId } = await getAuthContext();
    return apiClient.post<DarajaCredentialsTestResponse>(
        tenantEndpoints.darajaCredentialsTest(tenantId),
        {},
        token,
        authTenantId
    );
}

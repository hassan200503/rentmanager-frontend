import { appConfig } from "@/lib/config/app-config";

export function buildHeaders(token?: string, tenantId?: string) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-App-Name": appConfig.appName,
        "X-Custom-Header": "test-value",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (tenantId) {
        headers["X-Tenant-Id"] = tenantId;
    }

    return headers;
}

import { useQuery } from "@tanstack/react-query";
import { getDarajaCredentialsStatus } from "../api/daraja-api";

export const darajaStatusQueryKey = (tenantId: string) =>
    ["daraja", "status", tenantId] as const;

export function useDarajaStatusQuery(tenantId: string | undefined) {
    return useQuery({
        queryKey: darajaStatusQueryKey(tenantId ?? ""),
        queryFn: () => getDarajaCredentialsStatus(tenantId as string),
        enabled: Boolean(tenantId),
    });
}
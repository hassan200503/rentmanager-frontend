import { useMutation } from "@tanstack/react-query";
import { testDarajaCredentials } from "../api/daraja-api";
import type { DarajaCredentialsTestResponse } from "../types/daraja-types";

/**
 * Runs a real Safaricom connection test against the saved credentials.
 *
 * Deliberately a mutation, not a query: it makes an outbound third-party
 * call and must fire only when the landlord asks for it — never on mount,
 * on refocus, or on a retry. React Query would happily do all three to a
 * query, which would mean silently hammering Safaricom's OAuth endpoint.
 *
 * A failed *test* is a successful *request*: the backend answers 200 with
 * `ok: false`, so the verdict arrives in `data`, not in `error`. `error`
 * here means the test could not be run at all.
 */
export function useTestDarajaMutation() {
    return useMutation<DarajaCredentialsTestResponse, Error, string>({
        mutationFn: (tenantId: string) => testDarajaCredentials(tenantId),
        retry: false,
    });
}

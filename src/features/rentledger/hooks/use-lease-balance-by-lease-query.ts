// features/rentledger/hooks/use-lease-balance-by-lease-query.ts
import { useQuery } from "@tanstack/react-query";
import { rentLedgerApi } from "../api/rent-ledger-api";

export const leaseBalanceByLeaseKeys = {
    all: ["rent-ledger", "balance-by-lease"] as const,
};

/**
 * Rent status per lease for the Tenants page — same short staleTime as the
 * dashboard summary, for the same reason: a landlord checking this right
 * after telling a tenant to pay should not see stale "overdue".
 */
export const useLeaseBalanceByLeaseQuery = (enabled = true) =>
    useQuery({
        queryKey: leaseBalanceByLeaseKeys.all,
        queryFn: rentLedgerApi.getBalanceByLease,
        staleTime: 30 * 1000,
        enabled,
    });

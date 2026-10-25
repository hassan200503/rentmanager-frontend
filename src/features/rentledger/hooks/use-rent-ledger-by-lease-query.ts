// hooks/use-rent-ledger-by-lease-query.ts
import { useQuery } from "@tanstack/react-query";
import { rentLedgerApi } from "../api/rent-ledger-api";
import { rentLedgerKeys } from "./rent-ledger-keys";

export const useRentLedgerByLeaseQuery = (leaseId: string) => {
    return useQuery({
        queryKey: rentLedgerKeys.byLease(leaseId),
        queryFn: () => rentLedgerApi.getByLease(leaseId),
        enabled: !!leaseId,
    });
};
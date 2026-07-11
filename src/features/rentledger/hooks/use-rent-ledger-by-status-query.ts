// features/rent-ledger/hooks/use-rent-ledger-by-status-query.ts
import { useQuery } from "@tanstack/react-query";
import { rentLedgerApi } from "../api/rent-ledger-api";
import { rentLedgerKeys } from "./rent-ledger-keys";
import { RentLedgerStatus } from "../types/rent-ledger-response";

export const useRentLedgerByStatusQuery = (status: RentLedgerStatus) => {
    return useQuery({
        queryKey: rentLedgerKeys.byStatus(status),
        queryFn: () => rentLedgerApi.getByStatus(status),
        enabled: !!status,
    });
};
import { useQuery } from "@tanstack/react-query";
import { rentLedgerApi } from "../api/rent-ledger-api";
import { rentLedgerKeys } from "./rent-ledger-keys";

export const useRentLedgerTransactionsQuery = (entryId: string) => {
    return useQuery({
        queryKey: rentLedgerKeys.transactions(entryId),
        queryFn: () => rentLedgerApi.getTransactionsForEntry(entryId),
        enabled: !!entryId,
    });
};
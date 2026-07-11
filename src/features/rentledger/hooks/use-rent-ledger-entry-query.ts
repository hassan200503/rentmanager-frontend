// hooks/use-rent-ledger-entry-query.ts
import { useQuery } from "@tanstack/react-query";
import { rentLedgerApi } from "../api/rent-ledger-api";
import { rentLedgerKeys } from "./rent-ledger-keys";

export const useRentLedgerEntryQuery = (entryId: string) => {
    return useQuery({
        queryKey: rentLedgerKeys.entry(entryId),
        queryFn: () => rentLedgerApi.getById(entryId),
        enabled: !!entryId,
    });
};
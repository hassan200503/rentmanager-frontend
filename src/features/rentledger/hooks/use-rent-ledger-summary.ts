// features/rentledger/hooks/use-rent-ledger-summary.ts
import { useQuery } from "@tanstack/react-query";
import { rentLedgerApi } from "../api/rent-ledger-api";

export const rentLedgerSummaryKeys = {
    all: ["rent-ledger", "summary"] as const,
};

/**
 * The landlord dashboard's money figures.
 *
 * Short staleTime: this is the number a landlord refreshes after telling a
 * tenant to pay, and a five-minute-stale "outstanding" would have them
 * chasing someone who has already paid.
 */
export const useRentLedgerSummaryQuery = (enabled = true) =>
    useQuery({
        queryKey: rentLedgerSummaryKeys.all,
        queryFn: rentLedgerApi.getSummary,
        staleTime: 30 * 1000,
        enabled,
    });

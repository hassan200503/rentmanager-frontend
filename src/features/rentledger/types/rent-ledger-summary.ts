// features/rentledger/types/rent-ledger-summary.ts
// Mirrors backend RentLedgerSummaryResponse.
//
// Money arrives as strings (backend defect #10 convention) so a BigDecimal
// never becomes a JS double on the way to a landlord's screen.

export interface RentLedgerSummaryResponse {
    /** Sum of payments received against charges billed in the current month. */
    collectedThisMonth: string;
    /** Everything still owed, of any age. */
    outstandingTotal: string;
    /** The portion of the above already flagged OVERDUE by the nightly sweep. */
    overdueTotal: string;
    /** How many charges make up the overdue figure. */
    overdueEntryCount: number;
    /** ISO 4217 code, from the landlord organisation. */
    currency: string;
}

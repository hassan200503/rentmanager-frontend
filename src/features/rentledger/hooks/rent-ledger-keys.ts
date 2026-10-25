export const rentLedgerKeys = {
    all: ["rent-ledger"] as const,
    entry: (entryId: string) => ["rent-ledger", "entry", entryId],
    transactions: (entryId: string) => ["rent-ledger", "entry", entryId, "transactions"],
    byLease: (leaseId: string) => ["rent-ledger", "lease", leaseId],
    byStatus: (status: string) => ["rent-ledger", "status", status],
    allTransactions: ["rent-ledger", "all-transactions"] as const,
    unmatchedPayments: ["rent-ledger", "unmatched-payments"] as const,
};
// api/rent-ledger-endpoints.ts
import { RentLedgerStatus } from "../types/rent-ledger-response";

const base = "/rent-ledger";

export const rentLedgerEndpoints = {
    byId: (entryId: string) => `${base}/entries/${entryId}`,
    byLease: (leaseId: string) => `${base}/leases/${leaseId}/entries`,
    byStatus: (status: RentLedgerStatus) => `${base}/entries/status/${status}`,
    transactionsForEntry: (entryId: string) => `${base}/entries/${entryId}/transactions`,
};

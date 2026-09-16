// types/rent-ledger-response.ts
export type RentLedgerStatus =
    | "DUE"
    | "PARTIALLY_PAID"
    | "OVERDUE"
    | "PAID"
    | "OVERPAID";

/**
 * Per-lease rent status, from GET /rent-ledger/balance-by-lease. Only
 * leases with money currently outstanding or an unresolved overpayment
 * appear here — a lease absent from this list has nothing owed right now,
 * not "unknown". See LeaseBalanceSummaryResponse on the backend.
 */
export interface LeaseBalanceSummaryResponse {
    leaseId: string;
    outstandingBalance: string; // BigDecimal -> JSON string
    status: RentLedgerStatus;
    oldestUnpaidDueDate: string | null; // LocalDate -> ISO date string
}

export interface RentLedgerEntryResponse {
    id: string;
    leaseId: string;
    unitId: string;
    tenantProfileId: string;
    billingPeriodStart: string; // LocalDate -> ISO date string
    billingPeriodEnd: string;
    dueDate: string;
    amountDue: string; // BigDecimal -> JSON string, see shared/utils/money.ts
    amountPaid: string;
    balanceOwed: string;
    excessAmount: string;
    status: RentLedgerStatus;
    prorated: boolean;
    version: number;
    // Enriched by getByStatus(); null on getById/getByLease (slim factory).
    tenantFullName: string | null;
    unitNumber: string | null;
    propertyName: string | null;
    leaseNumber: string | null;
}

export type RentTransactionType =
    | "RENT_CHARGE"
    | "PAYMENT"
    | "WAIVER"
    | "REFUND"
    | "CREDIT_APPLIED"
    | "ADJUSTMENT"
    | "DEPOSIT"
    // Added by V71 and reachable since DELETE /rent-ledger/transactions/{id}
    // stopped hard-deleting and started posting a compensating REVERSAL that
    // keeps both rows. It was missing here, so the ledger drill-down rendered
    // it with a blank label and the payments table fell back to "Rent charge".
    | "REVERSAL";

export type RentTransactionSource =
    | "MPESA"
    | "CASH"
    | "ADMIN_ADJUSTMENT"
    | "SYSTEM";

export interface RentTransactionResponse {
    id: string;
    ledgerEntryId: string;
    leaseId: string;
    type: RentTransactionType;
    amount: string; // BigDecimal -> JSON string
    externalReference: string | null;  // null for SYSTEM-sourced transactions per RentTransaction.create(...) usage
    source: RentTransactionSource;
    recordedBy: string;
    occurredAt: string;          // LocalDateTime -> ISO string
    createdAt: string;           // Instant -> ISO string
    version: number;
}

export interface RentTransactionSummaryResponse {
    id: string;
    ledgerEntryId: string;
    leaseId: string;
    type: RentTransactionType;
    amount: string; // BigDecimal -> JSON string
    externalReference: string | null;
    source: RentTransactionSource;
    recordedBy: string;
    occurredAt: string;
    tenantFullName: string | null;
    tenantPhone: string | null;
    leaseNumber: string | null;
    leaseStatus: string | null;
}

// ── Unmatched Payments (for manual review queue) ────────────────────────

export interface UnmatchedPaymentResponse {
    id: string;
    transactionId: string;
    amount: string; // BigDecimal -> JSON string
    phoneNumber: string;           // masked to last 4 digits in UI
    accountReference: string;      // raw reference as received
    occurredAt: string;
    matchConfidence: "exact" | "fuzzy" | "phone" | "amount_timing" | null;
    suggestedUnits: Array<{
        unitId: string;
        unitNumber: string;
        tenantName: string;
        rentAmount: string;
        matchReason: string;
    }>;
}

export interface ResolveUnmatchedPaymentRequest {
    transactionId: string;
    unitId: string;
    // tenantId derived from unit on backend
}
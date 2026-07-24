// types/rent-ledger-response.ts
export type RentLedgerStatus =
    | "DUE"
    | "PARTIALLY_PAID"
    | "OVERDUE"
    | "PAID"
    | "OVERPAID";

export interface RentLedgerEntryResponse {
    id: string;
    leaseId: string;
    unitId: string;
    tenantProfileId: string;
    billingPeriodStart: string; // LocalDate -> ISO date string
    billingPeriodEnd: string;
    dueDate: string;
    amountDue: number;
    amountPaid: number;
    balanceOwed: number;
    excessAmount: number;
    status: RentLedgerStatus;
    prorated: boolean;
    version: number;
}

export type RentTransactionType =
    | "RENT_CHARGE"
    | "PAYMENT"
    | "WAIVER"
    | "REFUND"
    | "CREDIT_APPLIED"
    | "ADJUSTMENT"
    | "DEPOSIT";

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
    amount: number;
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
    amount: number;
    externalReference: string | null;
    source: RentTransactionSource;
    recordedBy: string;
    occurredAt: string;
    tenantFullName: string | null;
    tenantPhone: string | null;
    leaseNumber: string | null;
    leaseStatus: string | null;
}
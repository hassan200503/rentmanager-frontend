export type DisbursementStatus =
    | "INITIATED"
    | "PENDING"
    | "SUCCESS"
    | "FAILED";

export interface DisbursementResponse {
    id: string;
    leaseId: string;
    ledgerEntryId: string | null;
    amount: string; // BigDecimal -> JSON string
    recipientPhone: string;
    recipientName: string;
    commandId: string;
    status: DisbursementStatus;
    mpesaTransactionId: string | null;
    failureReason: string | null;
    createdAt: string;
}

export interface InitiateDisbursementRequest {
    leaseId: string;
    // Required: the payout amount is validated against this charge's
    // remaining proceeds, so there is nothing to check without it.
    ledgerEntryId: string;
    amount: number;
    // recipientPhone / recipientName deliberately absent — the backend reads
    // the destination from the landlord's registered payout number.
    commandId?: string | null;
    remarks?: string | null;
}

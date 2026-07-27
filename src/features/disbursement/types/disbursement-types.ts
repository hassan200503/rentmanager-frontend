export type DisbursementStatus =
    | "INITIATED"
    | "PENDING"
    | "SUCCESS"
    | "FAILED";

export interface DisbursementResponse {
    id: string;
    leaseId: string;
    ledgerEntryId: string | null;
    amount: number;
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
    ledgerEntryId?: string | null;
    amount: number;
    recipientPhone: string;
    recipientName: string;
    commandId?: string | null;
    remarks?: string | null;
}

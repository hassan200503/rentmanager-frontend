export type DepositStatus =
    | "UNPAID"
    | "HELD"
    | "PARTIALLY_REFUNDED"
    | "REFUNDED"
    | "FORFEITED";

export interface DepositResponse {
    id: string;
    leaseId: string;
    unitId: string;
    tenantProfileId: string;
    amountRequired: string; // BigDecimal → JSON string
    amountPaid: string;
    amountRefunded: string;
    currency: string;
    status: DepositStatus;
    paidAt: string | null;
    refundedAt: string | null;
    deductionAmount: string | null;
    deductionReason: string | null;
    refundReference: string | null;
    refundRemarks: string | null;
    // STK push pending state
    hasPendingRefund: boolean;
    pendingRefundPhone: string | null;
    pendingRefundInitiatedAt: string | null;
    // Renter info enriched by the server
    renterName: string | null;
    renterPhone: string | null;
}

export interface RefundDepositRequest {
    deductionAmount: number;
    deductionReason?: string | null;
    refundReference?: string | null;
    refundRemarks?: string | null;
}

export interface InitiateDepositRefundRequest {
    landlordPhone: string;
    deductionAmount: number;
    deductionReason?: string | null;
    remarks?: string | null;
}

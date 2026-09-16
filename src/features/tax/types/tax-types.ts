export type TaxInvoiceStatus = "PENDING" | "TRANSMITTED" | "FAILED" | "SELF_FILED";
export type MonthlyFilingStatus = "COMPUTED" | "READY_FOR_MANUAL" | "TRANSMITTED" | "FAILED";
export type PropertyTaxRegistrationStatus = "PENDING" | "READY_FOR_MANUAL" | "TRANSMITTED" | "ACCEPTED" | "REJECTED";
export type PremisesType = "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE";
export type VatTreatment = "STANDARD_RATED" | "ZERO_RATED" | "VAT_EXEMPT";

export interface TaxInvoiceResponse {
    id: string;
    rentTransactionId: string;
    leaseId: string;
    amount: string | number;
    premisesType: PremisesType;
    vatTreatment: VatTreatment;
    status: TaxInvoiceStatus;
    externalReference: string | null;
    occurredAt: string;
    kraControlNumber: string | null;
    qrCodeData: string | null;
    transmittedAt: string | null;
    attemptCount: number;
    lastError: string | null;
}

export interface MonthlyFilingResponse {
    id: string;
    period: string;
    grossRentalIncome: string | number;
    nilReturn: boolean;
    mriRateApplied: string | number;
    mriTaxDue: string | number;
    status: MonthlyFilingStatus;
    computedAt: string;
    filedAt: string | null;
    transmittedAt: string | null;
}

export interface PropertyTaxRegistrationResponse {
    id: string;
    propertyId: string;
    status: PropertyTaxRegistrationStatus;
    krPropertyRegistrationId: string | null;
    registeredAt: string | null;
    lastError: string | null;
    createdAt: string;
}

export interface TaxSummaryResponse {
    attentionRequiredCount: number;
    currentMriRate: string | number;
    lastFilingPeriod: string | null;
    lastFilingTaxDue: string | number | null;
    lastFilingStatus: MonthlyFilingStatus | null;
    nextFilingDeadline: string;
}

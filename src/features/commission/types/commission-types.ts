export interface CommissionPolicy {
    id: string;
    landlordOrgId: string | null;
    ratePercent: string; // BigDecimal -> JSON string
    effectiveFrom: string;
    active: boolean;
    createdBy: string;
    createdAt: string;
}

export interface SetCommissionRateRequest {
    ratePercent: number;
    effectiveFrom?: string;
}

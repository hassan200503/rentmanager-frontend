export interface CommissionPolicy {
    id: string;
    landlordOrgId: string | null;
    ratePercent: number;
    effectiveFrom: string;
    active: boolean;
    createdBy: string;
    createdAt: string;
}

export interface SetCommissionRateRequest {
    ratePercent: number;
    effectiveFrom?: string;
}

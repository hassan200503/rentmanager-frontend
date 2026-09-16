import { LeaseType, BillingCycle, LeaseStatus } from "./lease-response";

export interface CreateLeaseRequest {
    propertyId: string;
    unitId: string;
    tenantProfileId: string;
    leaseNumber: string;
    leaseType: LeaseType;
    billingCycle: BillingCycle;
    startDate: string;
    endDate: string;
    rentAmount: number;
    securityDeposit: number;
    lateFeeAmount: number;
    gracePeriodDays: number;
    autoRenew: boolean;
}

export interface UpdateLeaseRequest {
    startDate: string;
    endDate: string;
    rentAmount: number;
    securityDeposit: number;
    lateFeeAmount: number;
    gracePeriodDays: number;
    autoRenew: boolean;
}

export type LeaseActionType =
    | "APPROVE"
    | "AWAITING_DEPOSIT"
    | "ACTIVATE"
    | "REJECT"
    | "TERMINATE"
    | "RENEW"
    | "EXPIRE"
    | "CANCEL";

export type TerminationType =
    | "TENANT_REQUEST"
    | "LANDLORD_REQUEST"
    | "BREACH_OF_CONTRACT"
    | "NON_PAYMENT"
    | "MUTUAL_AGREEMENT";

export interface LeaseActionRequest {
    performedBy: string;
    action: LeaseActionType;
    actionDate?: string;
    terminationType?: TerminationType;
    reason?: string;
    actor?: string;
}

export interface LeaseSearchParams {
    propertyId?: string;
    status?: LeaseStatus;
    /** Matches lease number, tenant full name, or tenant phone. */
    keyword?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
}
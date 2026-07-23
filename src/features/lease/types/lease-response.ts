import { TerminationType } from "./lease-request";

export type LeaseStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "AWAITING_DEPOSIT"
    | "PENDING_ACTIVATION"
    | "ACTIVE"
    | "RENEWED"
    | "EXPIRED"
    | "CANCELLED"
    | "TERMINATED"
    | "SUSPENDED";

export type LeaseType = "STANDARD" | "FIXED_TERM" | "MONTH_TO_MONTH";

export type BillingCycle = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface LeaseResponse {
    id: string;
    leaseNumber: string;
    propertyId: string;
    unitId: string;
    tenantProfileId: string;
    leaseType: LeaseType;
    billingCycle: BillingCycle;
    startDate: string;
    endDate: string;
    rentAmount: number;
    securityDeposit: number;
    lateFeeAmount: number;
    gracePeriodDays: number;
    autoRenew: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface LeaseDetailResponse {
    id: string;
    leaseNumber: string;
    tenantId: string;
    propertyId: string;
    unitId: string;
    leaseType: LeaseType;
    billingCycle: BillingCycle;
    startDate: string;
    endDate: string;
    rentAmount: number;
    securityDeposit: number;
    status: LeaseStatus;
    gracePeriodDays: number;
    autoRenew: boolean;
    createdAt: string;
    updatedAt: string;
    version: number;
    tenantFullName: string | null;
    tenantPhone: string | null;

    // NEW this session: lifecycle metadata, previously persisted correctly
    // on the backend but never exposed to this DTO. All nullable -- a
    // given lease will only ever have a subset of these set depending on
    // which lifecycle events it has actually gone through. ISO datetime
    // strings (LocalDateTime on the Java side, no timezone offset), unlike
    // startDate/endDate above which are date-only.
    signedAt: string | null;
    activatedAt: string | null;
    terminatedAt: string | null;
    expiredAt: string | null;
    renewedAt: string | null;
    cancelledAt: string | null;
    terminationType: TerminationType | null;
    terminationReason: string | null;
}

export interface LeaseSummaryResponse {
    id: string;
    leaseNumber: string;
    status: LeaseStatus;
    startDate: string;
    endDate: string;
    rentAmount: number;
    tenantFullName: string | null;
    tenantPhone: string | null;
}

export interface LeaseActionResponse {
    id: string;
    previousStatus: LeaseStatus;
    currentStatus: LeaseStatus;
    message: string;
}

export interface LeasePageResponse {
    content: LeaseSummaryResponse[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
    first: boolean;
    last: boolean;
}
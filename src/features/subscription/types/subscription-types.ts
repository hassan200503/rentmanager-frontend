/**
 * Subscription billing types - mirror of the backend contract
 * (GET /api/v1/tenants/subscription, /switch, /cancel, /ratiba and
 * GET /api/v1/tenants/subscription-plans).
 *
 * Backend SubscriptionStatus enum (v2): TRIAL, ACTIVE, LAPSED, CANCELLED,
 * PAST_DUE, GRACE_PERIOD. Note "EXPIRED" was renamed to "LAPSED" - there
 * is deliberately no EXPIRED value here.
 */

export type BillingMode = "COMMISSION" | "PREMIUM_MONTHLY";

export type SubscriptionStatus =
    | "TRIAL"
    | "ACTIVE"
    | "LAPSED"
    | "CANCELLED"
    | "PAST_DUE"
    | "GRACE_PERIOD";

export type StandingOrderStatus =
    | "PENDING_AUTHORIZATION"
    | "ACTIVE"
    | "FAILED"
    | "CANCELLED";

export type SubscriptionPaymentPurpose = "INITIAL_ACTIVATION" | "RENEWAL";

export type SubscriptionPaymentRequestStatus =
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "EXPIRED";

export interface SubscriptionStatusResponse {
    billingMode: BillingMode;
    /** null when the tenant has never been on a premium plan (COMMISSION mode) */
    subscriptionStatus: SubscriptionStatus | null;
    planCode: string | null;
    planName: string | null;
    planMonthlyPrice: number | null;
    planStartDate: string | null;
    planEndDate: string | null;
    planGraceEndsAt: string | null;
    planAutoRenew: boolean;
    paybillNumber: string | null;
    accountReference: string | null;
    ratibaEnabled: boolean;
    standingOrderStatus: StandingOrderStatus | null;
}

export interface SwitchToPremiumRequest {
    planCode: string;
    mpesaPhone: string;
}

export interface SubscriptionPaymentRequestResponse {
    id: string;
    subscriptionPlanId: string;
    amount: number;
    purpose: SubscriptionPaymentPurpose;
    status: SubscriptionPaymentRequestStatus;
    mpesaPhone: string;
    mpesaCheckoutRequestId: string | null;
    failureReason: string | null;
}

export interface RatibaSetupResponse {
    standingOrderId: string;
    standingOrderStatus: StandingOrderStatus;
    paybillNumber: string;
    accountReference: string;
    amount: number;
    instructions: string;
}

export interface SubscriptionPlan {
    id: string;
    code: string;
    name: string;
    description: string | null;
    billingCycle: "MONTHLY" | "YEARLY" | "QUARTERLY";
    maxProperties: number | null;
    maxUnits: number | null;
    maxUsers: number | null;
    maxStorageGb: number | null;
    monthlyPrice: number | null;
    yearlyPrice: number | null;
    active: boolean;
    selfService: boolean;
}

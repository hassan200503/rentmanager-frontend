// features/tenant-portal/types/tenant-portal.ts
//
// Money fields are MoneyValue (string | number), not number.
//
// The backend serialises EVERY BigDecimal as a JSON string — see the
// backend's JacksonConfig — so these arrive as "15000.00" at runtime. They
// were declared as `number`, which meant TypeScript accepted arithmetic that
// silently concatenates: `totalPaid + totalDue` type-checked and produced
// "100200" from 100 and 200.
//
// Typing them honestly forces every use site through toMoneyNumber(), which
// is the one place that converts for display-side maths.
import type { MoneyValue } from "@/shared/utils/money";
// types/tenant-portal.ts
// Tenant/renter portal types — mirrors backend tenant-facing DTOs

export interface TenantProfileResponse {
    tenantId: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    nationalId: string;
    status: "ACTIVE" | "SUSPENDED" | "PENDING";
    createdAt: string;
}

export interface TenantLeaseResponse {
    leaseId: string;
    unitId: string;
    unitNumber: string;
    propertyName: string;
    propertyAddress: string;
    startDate: string;
    endDate: string | null;
    monthlyRent: MoneyValue;
    depositAmount: MoneyValue;
    depositPaid: boolean;
    status: "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING";
    moveInDate: string;
    landlordName: string;
    landlordPhone: string;
    landlordEmail: string;
    landlordCode: string | null;
    landlordAddress: string | null;
    landlordLogoUrl: string | null;
    landlordSince: string | null;
    landlordVerified: boolean;
}

export interface TenantPaymentSummaryResponse {
    totalPaid: MoneyValue;
    totalDue: MoneyValue;
    overdueAmount: MoneyValue;
    nextDueDate: string | null;
    nextDueAmount: MoneyValue;
}

export interface TenantPaymentHistoryItemResponse {
    id: string;
    amount: MoneyValue;
    paidAt: string;
    mpesaReceiptNumber: string | null;
    status: "COMPLETED" | "PENDING" | "FAILED" | "PARTIAL";
    periodStart: string;
    periodEnd: string;
    // Money, so MoneyValue. The four fields below it are pagination counts
    // and are genuinely numbers.
    balanceAfter: MoneyValue;
}

export interface TenantPortalDashboardResponse {
    profile: TenantProfileResponse;
    lease: TenantLeaseResponse | null;
    paymentSummary: TenantPaymentSummaryResponse;
    recentPayments: TenantPaymentHistoryItemResponse[];
}

export interface TenantPaymentHistoryResponse {
    content: TenantPaymentHistoryItemResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

// Request types for tenant actions (future use)
export interface TenantLoginRequest {
    phoneNumber: string;
    password: string;
}

export interface TenantChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
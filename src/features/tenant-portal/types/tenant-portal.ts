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
    monthlyRent: number;
    depositAmount: number;
    depositPaid: boolean;
    status: "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING";
    moveInDate: string;
    landlordName: string;
    landlordPhone: string;
}

export interface TenantPaymentSummaryResponse {
    totalPaid: number;
    totalDue: number;
    overdueAmount: number;
    nextDueDate: string | null;
    nextDueAmount: number;
}

export interface TenantPaymentHistoryItemResponse {
    id: string;
    amount: number;
    paidAt: string;
    mpesaReceiptNumber: string | null;
    status: "COMPLETED" | "PENDING" | "FAILED" | "PARTIAL";
    periodStart: string;
    periodEnd: string;
    balanceAfter: number;
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
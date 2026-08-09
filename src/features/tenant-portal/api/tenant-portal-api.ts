// api/tenant-portal-api.ts
import { appConfig } from "@/lib/config/app-config";
import { apiClient } from "@/lib/api/client";
import { getAuthContext as sharedGetAuthContext } from "@/lib/auth/get-auth-context";
import { tenantPortalEndpoints } from "./tenant-portal-endpoints";
import { LandlordReviewResponse, RenterReviewResponse, ReviewSummaryResponse } from "@/features/reviews/types/review-response";

// Types for tenant portal responses
export interface TenantDashboardResponse {
    tenantId: string;
    tenantName: string;
    tenantPhone: string;
    tenantEmail: string;
    currentBalance: number;
    currentEntryId: string | null;
    nextDueDate: string | null;
    nextDueAmount: number;
    overdueAmount: number;
    leaseStatus: string;
    unitNumber: string;
    propertyName: string;
    monthlyRent: number;
    depositAmount: number;
    recentPayments: TenantPaymentHistoryItem[];
}

export interface TenantLeaseResponse {
    leaseId: string;
    leaseNumber: string;
    startDate: string;
    endDate: string | null;
    monthlyRent: number;
    depositAmount: number;
    status: string;
    unitNumber: string;
    unitLabel: string | null;
    propertyName: string;
    propertyAddress: string;
    landlordName: string;
    landlordPhone: string;
    landlordEmail: string;
    landlordCode: string | null;
    landlordAddress: string | null;
    landlordLogoUrl: string | null;
    landlordSince: string | null;
    landlordVerified: boolean;
    terms: string;
    managerName: string | null;
    managerPhone: string | null;
    managerEmail: string | null;
    emergencyContactPhone: string | null;
    emergencyContact24h: boolean;
    landlordPrimaryColor: string | null;
    landlordSecondaryColor: string | null;
    billingMode: "COMMISSION" | "PREMIUM_MONTHLY" | null;
    subscriptionStatus: string | null;
}

export function isPremiumLandlord(lease: Pick<TenantLeaseResponse, "billingMode" | "subscriptionStatus">): boolean {
    if (lease.billingMode !== "PREMIUM_MONTHLY") return false;
    return (
        lease.subscriptionStatus === "ACTIVE" ||
        lease.subscriptionStatus === "TRIAL" ||
        lease.subscriptionStatus === "GRACE_PERIOD"
    );
}

export type RenterAnnouncementPriority = "INFO" | "URGENT";

export interface RenterAnnouncementResponse {
    id: string;
    message: string;
    priority: RenterAnnouncementPriority;
    createdAt: string;
    expiresAt: string | null;
    read: boolean;
}

export interface WhatsAppOptInResponse {
    enabled: boolean;
}

export interface AnnouncementUnreadCountResponse {
    count: number;
}

export interface TenantPaymentSummaryResponse {
    totalPaid: number;
    totalDue: number;
    currentBalance: number;
    overdueAmount: number;
    paymentsThisYear: number;
    lastPaymentDate: string | null;
    lastPaymentAmount: number | null;
}

export interface TenantPaymentHistoryItem {
    id: string;
    type: "RENT_CHARGE" | "PAYMENT" | "WAIVER" | "REFUND" | "CREDIT_APPLIED" | "ADJUSTMENT" | "DEPOSIT";
    amount: number;
    source: "MPESA" | "CASH" | "ADMIN_ADJUSTMENT" | "SYSTEM";
    externalReference: string | null;
    occurredAt: string;
    status: "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "DUE";
    billingPeriodStart: string;
    billingPeriodEnd: string;
    mpesaTransactionId: string | null;
}

export interface TenantPaymentHistoryResponse {
    content: TenantPaymentHistoryItem[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface TenantPaymentReceiptResponse {
    transactionId: string;
    receiptNumber: string;
    paymentDate: string;
    amount: number;
    mpesaTransactionId: string | null;
    tenantName: string;
    tenantPhone: string;
    unitNumber: string;
    propertyName: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    balanceAfterPayment: number;
    eTimsInvoiceNumber: string | null;
    eTimsQrCodeUrl: string | null;
}

export interface RentPaymentRequestResponse {
    id: string;
    leaseId: string;
    rentLedgerEntryId: string;
    amount: number;
    status: "PENDING" | "PAID" | "FAILED";
    mpesaReceiptNumber: string | null;
    transactionId: string | null;
}
// Maintenance types
export interface MaintenanceRequestResponse {
    id: string;
    unitId: string;
    propertyId: string;
    tenantProfileId: string;
    leaseId: string | null;
    title: string;
    description: string | null;
    category: "PLUMBING" | "ELECTRICAL" | "STRUCTURAL" | "APPLIANCE" | "PEST_CONTROL" | "GENERAL";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "SUBMITTED" | "IN_REVIEW" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    scheduledDate: string | null;
    completedAt: string | null;
    firstLandlordResponseAt: string | null;
    notes: string | null;
    createdBy: string | null;
    assignedTo: string | null;
    propertyName: string | null;
    unitNumber: string | null;
    renterName: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMaintenanceRequest {
    title: string;
    description?: string;
    category: MaintenanceRequestResponse["category"];
    priority: MaintenanceRequestResponse["priority"];
}

// Auto-pay types
export interface AutoPaySettingsResponse {
    id: string;
    leaseId: string;
    tenantProfileId: string;
    enabled: boolean;
    mpesaPhone: string | null;
    lastAutoPayDate: string | null;
    consecutiveFailures: number;
    lastAttemptAt: string | null;
}

export interface ToggleAutoPayRequest {
    enabled: boolean;
    mpesaPhone: string;
}

export interface UpdateAutoPayPhoneRequest {
    mpesaPhone: string;
}

// Maintenance (renter-scoped — ids are resolved server-side from the
// authenticated renter's active lease, never sent by the client)
export const tenantPortalApi = {
    getDashboard: async (): Promise<TenantDashboardResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TenantDashboardResponse>(
            tenantPortalEndpoints.dashboard(),
            token,
            tenantId
        );
    },

    getLease: async (): Promise<TenantLeaseResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TenantLeaseResponse>(
            tenantPortalEndpoints.lease(),
            token,
            tenantId
        );
    },

    getPaymentSummary: async (): Promise<TenantPaymentSummaryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TenantPaymentSummaryResponse>(
            tenantPortalEndpoints.paymentSummary(),
            token,
            tenantId
        );
    },

    getPaymentHistory: async (page: number = 0, size: number = 20): Promise<TenantPaymentHistoryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TenantPaymentHistoryResponse>(
            tenantPortalEndpoints.paymentHistory(page, size),
            token,
            tenantId
        );
    },

    getPaymentReceipt: async (transactionId: string): Promise<TenantPaymentReceiptResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TenantPaymentReceiptResponse>(
            tenantPortalEndpoints.paymentReceipt(transactionId),
            token,
            tenantId
        );
    },

    collectPayment: async (entryId: string, mpesaPhone: string): Promise<RentPaymentRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<RentPaymentRequestResponse>(
            tenantPortalEndpoints.collectPayment(entryId),
            { mpesaPhone },
            token,
            tenantId
        );
    },

    getPaymentRequestStatus: async (requestId: string): Promise<RentPaymentRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RentPaymentRequestResponse>(
            tenantPortalEndpoints.paymentRequestStatus(requestId),
            token,
            tenantId
        );
    },

    initiatePortalPayment: async (amount: number, mpesaPhone: string): Promise<RentPaymentRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<RentPaymentRequestResponse>(
            tenantPortalEndpoints.initiatePortalPayment(),
            { amount, mpesaPhone },
            token,
            tenantId
        );
    },

    // Maintenance
    getMaintenanceRequests: async (): Promise<MaintenanceRequestResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<MaintenanceRequestResponse[]>(
            tenantPortalEndpoints.maintenanceList(),
            token,
            tenantId
        );
    },

    submitMaintenanceRequest: async (request: CreateMaintenanceRequest): Promise<MaintenanceRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<MaintenanceRequestResponse>(
            tenantPortalEndpoints.maintenanceSubmit(),
            request,
            token,
            tenantId
        );
    },

    // Auto-pay
    getAutoPaySettings: async (): Promise<AutoPaySettingsResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<AutoPaySettingsResponse>(
            tenantPortalEndpoints.autoPay(),
            token,
            tenantId
        );
    },

    toggleAutoPay: async (request: ToggleAutoPayRequest): Promise<AutoPaySettingsResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<AutoPaySettingsResponse>(
            tenantPortalEndpoints.autoPayToggle(),
            request,
            token,
            tenantId
        );
    },

    updateAutoPayPhone: async (request: UpdateAutoPayPhoneRequest): Promise<AutoPaySettingsResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<AutoPaySettingsResponse>(
            tenantPortalEndpoints.autoPayPhone(),
            request,
            token,
            tenantId
        );
    },

    // Reviews
    getMyReview: async (): Promise<LandlordReviewResponse | null> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<LandlordReviewResponse | null>(
            tenantPortalEndpoints.reviewMe(),
            token,
            tenantId
        );
    },

    submitReview: async (rating: number, comment: string): Promise<LandlordReviewResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<LandlordReviewResponse>(
            tenantPortalEndpoints.submitReview(),
            { rating, comment },
            token,
            tenantId
        );
    },

    // Ratings received (V65): landlord -> renter, approved only
    getReviewsAboutMe: async (): Promise<RenterReviewResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RenterReviewResponse[]>(
            tenantPortalEndpoints.reviewsAboutMe(),
            token,
            tenantId
        );
    },

    getReviewsAboutMeSummary: async (): Promise<ReviewSummaryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<ReviewSummaryResponse>(
            tenantPortalEndpoints.reviewsAboutMeSummary(),
            token,
            tenantId
        );
    },

    // Announcements
    getAnnouncements: async (): Promise<RenterAnnouncementResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RenterAnnouncementResponse[]>(
            tenantPortalEndpoints.announcements(),
            token,
            tenantId
        );
    },

    getUnreadAnnouncementsCount: async (): Promise<AnnouncementUnreadCountResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<AnnouncementUnreadCountResponse>(
            tenantPortalEndpoints.announcementsUnreadCount(),
            token,
            tenantId
        );
    },

    markAnnouncementRead: async (id: string): Promise<RenterAnnouncementResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<RenterAnnouncementResponse>(
            tenantPortalEndpoints.markAnnouncementRead(id),
            undefined,
            token,
            tenantId
        );
    },

    getWhatsAppOptIn: async (): Promise<WhatsAppOptInResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<WhatsAppOptInResponse>(
            tenantPortalEndpoints.whatsAppOptIn(),
            token,
            tenantId
        );
    },

    updateWhatsAppOptIn: async (enabled: boolean): Promise<WhatsAppOptInResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<WhatsAppOptInResponse>(
            tenantPortalEndpoints.whatsAppOptIn(),
            { enabled },
            token,
            tenantId
        );
    },
};

// Auth context helper — shared resolver from lib/auth/get-auth-context,
// with the dev-only renter simulation: when the _dev_portal=renter cookie
// is set, suppress tenantId so the API does not send X-Tenant-Id (renter
// context).
async function getAuthContext(): Promise<{ token: string | undefined; tenantId: string | undefined }> {
    if (typeof window === "undefined") {
        return { token: undefined, tenantId: undefined };
    }

    // Dev-mode override honored only outside production — the switcher UI
    // already gates on the same flag, and prod must never inherit a dev cookie.
    const suppressTenantOverride =
        appConfig.flags.isDevelopment &&
        document.cookie.split("; ").some((c) => c === "_dev_portal=renter");

    return sharedGetAuthContext({ suppressTenantOverride });
}
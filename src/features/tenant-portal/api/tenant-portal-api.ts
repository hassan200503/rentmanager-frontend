// api/tenant-portal-api.ts
import { apiClient } from "@/lib/api/client";
import { tenantPortalEndpoints } from "./tenant-portal-endpoints";

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
    terms: string;
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
    notes: string | null;
    createdBy: string | null;
    assignedTo: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMaintenanceRequest {
    unitId: string;
    propertyId: string;
    tenantProfileId: string;
    leaseId?: string;
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

// Maintenance endpoints (separate base — not under /tenant-portal)
const maintenanceBase = "/maintenance";

// API client
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
            maintenanceBase,
            token,
            tenantId
        );
    },

    submitMaintenanceRequest: async (request: CreateMaintenanceRequest): Promise<MaintenanceRequestResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<MaintenanceRequestResponse>(
            maintenanceBase,
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
};

// Auth context helper (same pattern as other features)
async function getAuthContext(): Promise<{ token: string | undefined; tenantId: string | undefined }> {
    if (typeof window === "undefined") {
        return { token: undefined, tenantId: undefined };
    }

    const { useOrgStore } = await import("@/stores/org-store");
    const { getTenantIdFromSession } = await import("@/shared/tenant/get-tenant-id");
    const { v5: uuidv5 } = await import("uuid");

    const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const { BACKEND_JWT_TEMPLATE } = await import("@/lib/auth/token");

    // Dev-mode override: when _dev_portal=renter cookie is set, suppress
    // tenantId so the API does not send X-Tenant-Id (renter context).
    const isDevRenter =
        typeof window !== "undefined" &&
        document.cookie.split("; ").some((c) => c === "_dev_portal=renter");

    const rawTenantId = !isDevRenter
        ? (useOrgStore.getState().tenantId ?? getTenantIdFromSession() ?? undefined)
        : undefined;

    const tenantId = rawTenantId
        ? uuidv5(rawTenantId, TENANT_NAMESPACE)
        : undefined;

    type ClerkWindow = Window & {
        Clerk?: {
            session?: {
                getToken?: (options?: { template?: string }) => Promise<string | null>;
            };
        };
    };

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token, tenantId };
}
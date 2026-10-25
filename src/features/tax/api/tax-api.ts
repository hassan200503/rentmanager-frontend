import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import type {
    MonthlyFilingResponse,
    PropertyTaxRegistrationResponse,
    TaxInvoiceResponse,
    TaxSummaryResponse,
} from "../types/tax-types";

export const taxApi = {
    getSummary: async (): Promise<TaxSummaryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TaxSummaryResponse>("/tax/summary", token, tenantId);
    },

    listInvoices: async (page = 0, size = 20): Promise<TaxInvoiceResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<TaxInvoiceResponse[]>(
            `/tax/invoices?page=${page}&size=${size}`,
            token,
            tenantId
        );
    },

    markInvoiceSelfFiled: async (invoiceId: string): Promise<TaxInvoiceResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<TaxInvoiceResponse>(
            `/tax/invoices/${invoiceId}/self-file`,
            undefined,
            token,
            tenantId
        );
    },

    listFilings: async (page = 0, size = 12): Promise<MonthlyFilingResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<MonthlyFilingResponse[]>(
            `/tax/filings?page=${page}&size=${size}`,
            token,
            tenantId
        );
    },

    markFilingManual: async (filingId: string): Promise<MonthlyFilingResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<MonthlyFilingResponse>(
            `/tax/filings/${filingId}/mark-manual`,
            undefined,
            token,
            tenantId
        );
    },

    listRegistrations: async (): Promise<PropertyTaxRegistrationResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<PropertyTaxRegistrationResponse[]>(
            "/tax/registrations",
            token,
            tenantId
        );
    },

    getPropertyRegistration: async (
        propertyId: string
    ): Promise<PropertyTaxRegistrationResponse | null> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<PropertyTaxRegistrationResponse | null>(
            `/tax/properties/${propertyId}/registration`,
            token,
            tenantId
        );
    },

    initiatePropertyRegistration: async (
        propertyId: string
    ): Promise<PropertyTaxRegistrationResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<PropertyTaxRegistrationResponse>(
            `/tax/properties/${propertyId}/registration`,
            undefined,
            token,
            tenantId
        );
    },
};

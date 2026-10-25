import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taxApi } from "../api/tax-api";
import { taxKeys } from "./tax-keys";

export const useTaxSummaryQuery = () =>
    useQuery({
        queryKey: taxKeys.summary(),
        queryFn: () => taxApi.getSummary(),
        staleTime: 60 * 1000,
    });

export const useTaxInvoicesQuery = (page = 0) =>
    useQuery({
        queryKey: taxKeys.invoices(page),
        queryFn: () => taxApi.listInvoices(page),
        staleTime: 30 * 1000,
    });

export const useTaxFilingsQuery = (page = 0) =>
    useQuery({
        queryKey: taxKeys.filings(page),
        queryFn: () => taxApi.listFilings(page),
        staleTime: 60 * 1000,
    });

export const useTaxRegistrationsQuery = () =>
    useQuery({
        queryKey: taxKeys.registrations(),
        queryFn: () => taxApi.listRegistrations(),
        staleTime: 60 * 1000,
    });

export const useMarkInvoiceSelfFiledMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (invoiceId: string) => taxApi.markInvoiceSelfFiled(invoiceId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: taxKeys.all });
        },
    });
};

export const useMarkFilingManualMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (filingId: string) => taxApi.markFilingManual(filingId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: taxKeys.all });
        },
    });
};

export const usePropertyRegistrationQuery = (propertyId: string) =>
    useQuery({
        queryKey: taxKeys.propertyRegistration(propertyId),
        queryFn: () => taxApi.getPropertyRegistration(propertyId),
        enabled: !!propertyId,
        staleTime: 60 * 1000,
    });

export const useInitiateRegistrationMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (propertyId: string) => taxApi.initiatePropertyRegistration(propertyId),
        onSuccess: (_data, propertyId) => {
            qc.invalidateQueries({ queryKey: taxKeys.registrations() });
            qc.invalidateQueries({ queryKey: taxKeys.propertyRegistration(propertyId) });
        },
    });
};

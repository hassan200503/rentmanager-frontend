"use client";

import { useState } from "react";
import {
    Landmark,
    FileText,
    CalendarDays,
    Building2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronRight,
    Info,
    Loader2,
    FilePen,
    ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
    useTaxSummaryQuery,
    useTaxInvoicesQuery,
    useTaxFilingsQuery,
    useTaxRegistrationsQuery,
    useMarkInvoiceSelfFiledMutation,
    useMarkFilingManualMutation,
} from "@/features/tax/hooks/use-tax-queries";
import type {
    MonthlyFilingStatus,
    TaxInvoiceStatus,
    PropertyTaxRegistrationStatus,
    MonthlyFilingResponse,
    TaxInvoiceResponse,
    PropertyTaxRegistrationResponse,
} from "@/features/tax/types/tax-types";
import { formatCurrency, toMoneyNumber, type MoneyValue } from "@/shared/utils/money";

// ── Helpers ──────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

const monthFmt = new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
});

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

function formatMonth(isoDate: string | null | undefined): string {
    if (!isoDate) return "—";
    const [year, month] = isoDate.split("-").map(Number);
    if (!year || !month) return isoDate;
    return monthFmt.format(new Date(year, month - 1, 1));
}

function formatMoney(value: MoneyValue): string {
    if (value === null || value === undefined) return "—";
    return formatCurrency(value);
}

function formatRate(rate: MoneyValue): string {
    const n = toMoneyNumber(rate);
    return `${(n * 100).toFixed(1)}%`;
}

// ── Status chips ─────────────────────────────────────────────────

const INVOICE_STATUS: Record<TaxInvoiceStatus, { label: string; className: string }> = {
    PENDING: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    TRANSMITTED: {
        label: "Transmitted",
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    FAILED: {
        label: "Failed",
        className: "bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-300",
    },
    SELF_FILED: {
        label: "Self-filed",
        className: "bg-border-subtle text-fg-muted dark:bg-border-subtle-dark dark:text-fg-muted-dark",
    },
};

const FILING_STATUS: Record<MonthlyFilingStatus, { label: string; className: string }> = {
    COMPUTED: {
        label: "Computed",
        className: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    },
    READY_FOR_MANUAL: {
        label: "File manually",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    TRANSMITTED: {
        label: "Filed",
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    FAILED: {
        label: "Failed",
        className: "bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-300",
    },
};

const REG_STATUS: Record<
    PropertyTaxRegistrationStatus,
    { label: string; className: string }
> = {
    PENDING: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    READY_FOR_MANUAL: {
        label: "Register manually",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    TRANSMITTED: {
        label: "Submitted",
        className: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    },
    ACCEPTED: {
        label: "Registered",
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    REJECTED: {
        label: "Rejected",
        className: "bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-300",
    },
};

function StatusChip({
    status,
    meta,
}: {
    status: string;
    meta: Record<string, { label: string; className: string }>;
}) {
    const m = meta[status];
    if (!m) return <span className="text-xs text-fg-muted">{status}</span>;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${m.className}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {m.label}
        </span>
    );
}

// ── Monthly filings section ──────────────────────────────────────

function FilingsSection() {
    const [page, setPage] = useState(0);
    const { data, isLoading, isError, refetch } = useTaxFilingsQuery(page);
    const markManual = useMarkFilingManualMutation();

    const handleMarkManual = async (filing: MonthlyFilingResponse) => {
        try {
            await markManual.mutateAsync(filing.id);
            toast.success(`${formatMonth(filing.period)} marked for manual filing.`);
        } catch {
            toast.error("Failed to update filing status.");
        }
    };

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                Monthly Rental Income (MRI) filings
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                7.5% final tax on gross residential rent. Computed automatically on the 1st
                of each month. File directly on{" "}
                <span className="font-medium text-fg dark:text-fg-dark">eRITS</span> — KRA
                transmission integration is coming in Phase 2.
            </p>

            <div className="mt-4">
                {isLoading ? (
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="skeleton h-10 rounded-xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                        <div className="flex-1">
                            <p className="text-sm text-danger">Couldn&apos;t load filings.</p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-1 text-xs font-semibold text-danger underline underline-offset-2"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : !data || data.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                        <Info className="h-4 w-4 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            No filings computed yet. The first filing appears on the 1st of the following month.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-border dark:border-border-dark">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Period
                                        </th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Gross rent
                                        </th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Tax due (7.5%)
                                        </th>
                                        <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Status
                                        </th>
                                        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border dark:divide-border-dark">
                                    {data.map((filing) => (
                                        <tr
                                            key={filing.id}
                                            className="hover:bg-border-subtle/30 dark:hover:bg-border-subtle-dark/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-fg dark:text-fg-dark">
                                                {formatMonth(filing.period)}
                                                {filing.nilReturn && (
                                                    <span className="ml-2 text-xs text-fg-muted dark:text-fg-muted-dark">
                                                        (NIL)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-data tabular-nums text-fg dark:text-fg-dark">
                                                {formatMoney(filing.grossRentalIncome)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-data tabular-nums text-fg dark:text-fg-dark">
                                                {filing.nilReturn ? "—" : formatMoney(filing.mriTaxDue)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusChip
                                                    status={filing.status}
                                                    meta={FILING_STATUS}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {filing.status === "COMPUTED" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkManual(filing)}
                                                        disabled={markManual.isPending}
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-300 hover:underline disabled:opacity-50"
                                                    >
                                                        {markManual.isPending ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                                                        ) : (
                                                            <FilePen className="h-3 w-3" strokeWidth={2} />
                                                        )}
                                                        Mark filed
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                Page {page + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={data.length < 12}
                                className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Tax invoices section ─────────────────────────────────────────

function InvoicesSection() {
    const [page, setPage] = useState(0);
    const { data, isLoading, isError, refetch } = useTaxInvoicesQuery(page);
    const selfFile = useMarkInvoiceSelfFiledMutation();

    const handleSelfFile = async (invoice: TaxInvoiceResponse) => {
        try {
            await selfFile.mutateAsync(invoice.id);
            toast.success("Invoice marked as self-filed.");
        } catch {
            toast.error("Failed to update invoice.");
        }
    };

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                eTIMS invoices
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                One invoice is generated per rent payment. KRA eTIMS transmission is coming
                in Phase 2 — until then, invoices remain{" "}
                <span className="font-medium text-fg dark:text-fg-dark">Pending</span>.
                Mark any invoice &ldquo;Self-filed&rdquo; once you&apos;ve submitted it manually.
            </p>

            <div className="mt-4">
                {isLoading ? (
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="skeleton h-10 rounded-xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                        <div className="flex-1">
                            <p className="text-sm text-danger">Couldn&apos;t load invoices.</p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-1 text-xs font-semibold text-danger underline underline-offset-2"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : !data || data.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                        <Info className="h-4 w-4 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            No invoices yet. They appear automatically when rent payments are received.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-border dark:border-border-dark">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Date
                                        </th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Amount
                                        </th>
                                        <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Ref
                                        </th>
                                        <th className="hidden md:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Treatment
                                        </th>
                                        <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                            Status
                                        </th>
                                        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border dark:divide-border-dark">
                                    {data.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="hover:bg-border-subtle/30 dark:hover:bg-border-subtle-dark/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-fg dark:text-fg-dark">
                                                {formatDate(invoice.occurredAt)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-data tabular-nums text-fg dark:text-fg-dark">
                                                {formatMoney(invoice.amount)}
                                            </td>
                                            <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-fg-muted dark:text-fg-muted-dark truncate max-w-[120px]">
                                                {invoice.externalReference ?? "—"}
                                            </td>
                                            <td className="hidden md:table-cell px-4 py-3">
                                                <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                                    {invoice.premisesType === "COMMERCIAL"
                                                        ? invoice.vatTreatment === "STANDARD_RATED"
                                                            ? "16% VAT"
                                                            : "Commercial (VAT exempt)"
                                                        : "MRI 7.5%"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusChip
                                                    status={invoice.status}
                                                    meta={INVOICE_STATUS}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {(invoice.status === "PENDING" ||
                                                    invoice.status === "FAILED") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelfFile(invoice)}
                                                        disabled={selfFile.isPending}
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-300 hover:underline disabled:opacity-50"
                                                    >
                                                        {selfFile.isPending ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                                                        ) : (
                                                            <FilePen className="h-3 w-3" strokeWidth={2} />
                                                        )}
                                                        Self-file
                                                    </button>
                                                )}
                                                {invoice.kraControlNumber && (
                                                    <span className="text-xs font-mono text-fg-muted dark:text-fg-muted-dark">
                                                        {invoice.kraControlNumber}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                Page {page + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={data.length < 20}
                                className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Property registrations section ───────────────────────────────

function RegistrationsSection() {
    const { data, isLoading, isError, refetch } = useTaxRegistrationsQuery();

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                eRITS property registrations
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                Each property must be registered on KRA eRITS before monthly filing. Initiate
                registration from the property&apos;s detail page, then complete the process
                directly on eRITS (KRA portal) with your PIN.
            </p>

            <div className="mt-4">
                {isLoading ? (
                    <div className="space-y-2">
                        {[0, 1].map((i) => (
                            <div key={i} className="skeleton h-10 rounded-xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                        <div className="flex-1">
                            <p className="text-sm text-danger">Couldn&apos;t load registrations.</p>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-1 text-xs font-semibold text-danger underline underline-offset-2"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : !data || data.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                        <Info className="h-4 w-4 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        <div className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            <p>No properties registered yet.</p>
                            <p className="mt-0.5 text-xs">
                                Go to a property&apos;s detail page and click &ldquo;Register on eRITS&rdquo;.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-border dark:border-border-dark">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50">
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                        Property ID
                                    </th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                        Status
                                    </th>
                                    <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                        KRA ref
                                    </th>
                                    <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                        Registered
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-border-dark">
                                {(data as PropertyTaxRegistrationResponse[]).map((reg) => (
                                    <tr
                                        key={reg.id}
                                        className="hover:bg-border-subtle/30 dark:hover:bg-border-subtle-dark/30 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-fg dark:text-fg-dark">
                                            {reg.propertyId.split("-")[0]}…
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <StatusChip status={reg.status} meta={REG_STATUS} />
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-3 font-mono text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {reg.krPropertyRegistrationId ?? "—"}
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-3 text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {formatDate(reg.registeredAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Summary cards ────────────────────────────────────────────────

function SummaryCards() {
    const { data, isLoading } = useTaxSummaryQuery();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-24 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    const attentionRequired = data.attentionRequiredCount ?? 0;
    const mriRate = formatRate(data.currentMriRate);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Invoices needing attention */}
            <div
                className={`rounded-2xl border p-4 ${
                    attentionRequired > 0
                        ? "border-amber-200/60 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-900/20"
                        : "border-border dark:border-border-dark bg-border-subtle/30 dark:bg-border-subtle-dark/30"
                }`}
            >
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                        Invoices pending
                    </p>
                    {attentionRequired > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    )}
                </div>
                <p className="mt-2 font-data text-2xl font-semibold tabular-nums text-fg dark:text-fg-dark">
                    {attentionRequired}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                    {attentionRequired > 0
                        ? "Need attention — file or mark self-filed"
                        : "All invoices filed or transmitted"}
                </p>
            </div>

            {/* Current MRI rate */}
            <div className="rounded-2xl border border-brand-200/60 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-900/20 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                        Current MRI rate
                    </p>
                    <Landmark className="h-4 w-4 text-brand" strokeWidth={2} />
                </div>
                <p className="mt-2 font-data text-2xl font-semibold tabular-nums text-fg dark:text-fg-dark">
                    {mriRate}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                    Finance Act 2023, effective 1 Jan 2024
                </p>
            </div>

            {/* Last filing / next deadline */}
            <div className="rounded-2xl border border-border dark:border-border-dark bg-border-subtle/30 dark:bg-border-subtle-dark/30 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                        {data.lastFilingPeriod ? "Last filing" : "Next deadline"}
                    </p>
                    <Clock className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </div>
                {data.lastFilingPeriod ? (
                    <>
                        <p className="mt-2 font-medium text-fg dark:text-fg-dark">
                            {formatMonth(data.lastFilingPeriod)}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                            <StatusChip
                                status={data.lastFilingStatus ?? "COMPUTED"}
                                meta={FILING_STATUS}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mt-2 font-medium text-fg dark:text-fg-dark">
                            {formatDate(data.nextFilingDeadline)}
                        </p>
                        <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                            eRITS remittance deadline
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Phase 2 roadmap banner ────────────────────────────────────────

function Phase2Banner() {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-200/60 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-900/15 px-4 py-3 animate-fade-in-up">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand dark:text-brand-300" strokeWidth={2} />
            <div className="text-sm text-fg dark:text-fg-dark">
                <p className="font-semibold">
                    KRA transmission integration — coming in Phase 2
                </p>
                <p className="mt-0.5 text-fg-muted dark:text-fg-muted-dark">
                    Invoice generation and monthly MRI computation run automatically now.
                    Direct eTIMS and eRITS submission (with KRA control numbers and QR codes) will
                    be enabled once KRA certifies the integration. Until then, file manually on{" "}
                    <a
                        href="https://itax.kra.go.ke"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand dark:text-brand-300 hover:underline inline-flex items-center gap-0.5"
                    >
                        iTax
                        <ChevronRight className="h-3 w-3" strokeWidth={2} />
                    </a>{" "}
                    and mark invoices self-filed here.
                </p>
            </div>
        </div>
    );
}

// ── Manual filing guide ──────────────────────────────────────────

function ManualFilingGuide() {
    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                How to file manually (Phase 1)
            </h2>
            <ol className="mt-3 space-y-3 text-sm text-fg-muted dark:text-fg-muted-dark list-decimal list-inside">
                <li>
                    <span className="font-medium text-fg dark:text-fg-dark">Set your KRA PIN</span>{" "}
                    in Settings → Tax &amp; compliance. Required for invoices and eRITS.
                </li>
                <li>
                    <span className="font-medium text-fg dark:text-fg-dark">Register each property on eRITS</span>{" "}
                    — go to the property detail page and click &ldquo;Register on eRITS&rdquo;, then
                    complete registration directly on the KRA portal.
                </li>
                <li>
                    <span className="font-medium text-fg dark:text-fg-dark">File monthly on iTax</span>{" "}
                    — use the gross rent figures shown in the MRI filings table above. Payment is
                    due by the 20th of the following month.
                </li>
                <li>
                    <span className="font-medium text-fg dark:text-fg-dark">Mark invoices self-filed</span>{" "}
                    on this page once submitted.
                </li>
            </ol>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────

export default function TaxPage() {
    return (
        <div className="page-container max-w-4xl space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Tax &amp; compliance</h1>
                <p className="page-subtitle">
                    KRA eTIMS invoices, Monthly Rental Income (MRI) filings, and eRITS property
                    registrations.
                </p>
            </div>

            <Phase2Banner />
            <SummaryCards />
            <FilingsSection />
            <InvoicesSection />
            <RegistrationsSection />
            <ManualFilingGuide />
        </div>
    );
}

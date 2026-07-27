// components/tenant-payments.tsx
"use client";

import { useState } from "react";
import { useTenantPaymentHistoryQuery, useTenantPaymentSummaryQuery, useTenantPaymentReceiptQuery } from "../hooks/use-tenant-portal-queries";
import { Loader2, AlertTriangle, Download, FileText, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateTime, formatDate, StatusBadge } from "./tenant-dashboard";
import { TenantPaymentReceiptResponse } from "../api/tenant-portal-api";
import { downloadReceiptPdf } from "@/features/rentledger/components/download-receipt";

const PAGE_SIZE = 20;

export const TenantPaymentsPage = () => {
    const [page, setPage] = useState(0);
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

    const { data: summary } = useTenantPaymentSummaryQuery();
    const { data: history, isLoading, isError, refetch } = useTenantPaymentHistoryQuery(page, PAGE_SIZE);
    const { data: receipt, isLoading: receiptLoading } = useTenantPaymentReceiptQuery(selectedReceiptId ?? "");

    if (isLoading && page === 0) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="card-elevated p-4 space-y-2">
                            <div className="skeleton h-3 w-1/3" />
                            <div className="skeleton h-7 w-1/2" />
                        </div>
                    ))}
                </div>
                <div className="card-elevated p-4"><div className="skeleton h-64 w-full" /></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="card p-6 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load payment history</p>
                <button onClick={() => refetch()} className="mt-2 btn-outline btn-sm">Retry</button>
            </div>
        );
    }

    const payments = history?.content ?? [];
    const totalPages = history?.totalPages ?? 0;
    const totalElements = history?.totalElements ?? 0;

    const TYPE_LABELS: Record<string, string> = {
        RENT_CHARGE: "Rent Charge",
        PAYMENT: "Payment",
        WAIVER: "Waiver",
        REFUND: "Refund",
        CREDIT_APPLIED: "Credit Applied",
        ADJUSTMENT: "Adjustment",
        DEPOSIT: "Deposit",
    };

    const sourceColors: Record<string, string> = {
        MPESA: "text-success-dark dark:text-success",
        CASH: "text-fg dark:text-fg-dark",
        ADMIN_ADJUSTMENT: "text-brand dark:text-brand-300",
        SYSTEM: "text-fg-muted dark:text-fg-muted-dark",
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-elevated p-4">
                    <p className="kpi-label">Total Paid</p>
                    <p className="kpi-value font-data text-success-dark dark:text-success">{formatCurrency(summary?.totalPaid ?? 0)}</p>
                </div>
                <div className="card-elevated p-4">
                    <p className="kpi-label">Total Due</p>
                    <p className="kpi-value font-data text-danger-dark dark:text-danger">{formatCurrency(summary?.totalDue ?? 0)}</p>
                </div>
                <div className="card-elevated p-4">
                    <p className="kpi-label">Current Balance</p>
                    <p className={`kpi-value font-data ${(summary?.currentBalance ?? 0) > 0 ? "text-danger-dark dark:text-danger" : "text-success-dark dark:text-success"}`}>
                        {formatCurrency(summary?.currentBalance ?? 0)}
                    </p>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="card-elevated">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <h3 className="section-header !text-sm !mb-0">Payment History</h3>
                    <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                        {totalElements} {totalElements === 1 ? "payment" : "payments"}
                    </span>
                </div>

                {payments.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto text-fg-muted dark:text-fg-muted-dark mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No payments yet</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Your payment history will appear here once you make your first payment.</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container -mx-4">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Period</th>
                                        <th>Amount</th>
                                        <th>Source</th>
                                        <th>Status</th>
                                        <th className="w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="text-fg-muted dark:text-fg-muted-dark text-sm">{formatDateTime(p.occurredAt)}</td>
                                            <td>
                                                <span className="font-medium text-fg dark:text-fg-dark">{TYPE_LABELS[p.type] ?? p.type}</span>
                                            </td>
                                            <td className="text-sm text-fg-muted dark:text-fg-muted-dark">
                                                {formatDate(p.billingPeriodStart)} – {formatDate(p.billingPeriodEnd)}
                                            </td>
                                            <td className="font-data font-semibold text-fg dark:text-fg-dark">
                                                {p.type === "RENT_CHARGE" ? "+" : "−"}{formatCurrency(p.amount)}
                                            </td>
                                            <td>
                                                <span className={`font-mono-nums text-xs ${sourceColors[p.source] ?? ""}`}>{p.source}</span>
                                                {p.externalReference && (
                                                    <span className="ml-1 font-mono-nums text-[10px] text-fg-muted dark:text-fg-muted-dark">
                                                        {p.externalReference}
                                                    </span>
                                                )}
                                            </td>
                                            <td><StatusBadge status={p.status} /></td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => setSelectedReceiptId(p.id)}
                                                    disabled={receiptLoading}
                                                    className="btn-ghost btn-sm p-1.5 text-fg-muted hover:text-brand hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                                    aria-label={`Download receipt for ${formatCurrency(p.amount)}`}
                                                >
                                                    <Download className="h-4 w-4" strokeWidth={2} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border dark:border-border-dark">
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    Page {page + 1} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0 || receiptLoading}
                                        className="btn-secondary btn-sm"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" strokeWidth={2} />
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1 || receiptLoading}
                                        className="btn-secondary btn-sm"
                                    >
                                        <ChevronRight className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Receipt Modal */}
                {selectedReceiptId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedReceiptId(null)}>
                        <div className="bg-surface dark:bg-surface-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {receiptLoading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand mb-3" strokeWidth={2} />
                                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Generating receipt…</p>
                                </div>
                            ) : receipt ? (
                                <ReceiptModalContent receipt={receipt} onClose={() => setSelectedReceiptId(null)} />
                            ) : (
                                <div className="p-8 text-center">
                                    <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load receipt</p>
                                    <button onClick={() => setSelectedReceiptId(null)} className="mt-2 btn-secondary btn-sm">Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReceiptModalContent = ({ receipt, onClose }: { receipt: TenantPaymentReceiptResponse; onClose: () => void }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadReceiptPdf(receipt);
        } catch {
            // Fall back to print if PDF generation fails
            window.print();
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="p-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">RENTMANAGER</p>
                    <p className="font-semibold text-fg dark:text-fg-dark">Payment Receipt</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-border/30 transition-colors" aria-label="Close">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="space-y-4 border-t border-border dark:border-border-dark pt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-fg-muted dark:text-fg-muted-dark">Receipt #</p><p className="font-data font-medium">{receipt.receiptNumber}</p></div>
                    <div><p className="text-fg-muted dark:text-fg-muted-dark">Date</p><p className="font-data font-medium">{formatDateTime(receipt.paymentDate)}</p></div>
                    <div><p className="text-fg-muted dark:text-fg-muted-dark">Tenant</p><p className="font-medium">{receipt.tenantName}</p></div>
                    <div><p className="text-fg-muted dark:text-fg-muted-dark">Phone</p><p className="font-data font-medium">{receipt.tenantPhone}</p></div>
                    <div><p className="text-fg-muted dark:text-fg-muted-dark">Unit</p><p className="font-medium">{receipt.unitNumber}</p></div>
                    <div><p className="text-fg-muted dark:text-fg-muted-dark">Property</p><p className="font-medium">{receipt.propertyName}</p></div>
                    <div><p className="text-fg-muted dark:text-fg-muted-dark">Period</p><p className="font-data font-medium">{formatDate(receipt.billingPeriodStart)} – {formatDate(receipt.billingPeriodEnd)}</p></div>
                    <div className="col-span-2"><p className="text-fg-muted dark:text-fg-muted-dark">M-Pesa Ref</p><p className="font-data font-medium">{receipt.mpesaTransactionId ?? "—"}</p></div>
                </div>

                <div className="border-t border-border dark:border-border-dark pt-4">
                    <div className="flex justify-between text-lg">
                        <span className="font-semibold text-fg dark:text-fg-dark">Amount Paid</span>
                        <span className="font-data font-bold text-success-dark dark:text-success">{formatCurrency(receipt.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-fg-muted dark:text-fg-muted-dark mt-2">
                        <span>Balance after payment</span>
                        <span className="font-data">{formatCurrency(receipt.balanceAfterPayment)}</span>
                    </div>
                </div>

                {receipt.eTimsInvoiceNumber && (
                    <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 border border-brand-100 dark:border-brand-800">
                        <p className="text-xs font-medium text-brand dark:text-brand-300">eTIMS Compliant</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">Invoice: <span className="font-data font-medium">{receipt.eTimsInvoiceNumber}</span></p>
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border dark:border-border-dark">
                    <button onClick={handleDownload} disabled={downloading} className="btn-secondary flex-1">
                        {downloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                        ) : (
                            <Download className="h-4 w-4 mr-2 inline" />
                        )}
                        {downloading ? "Generating PDF…" : "Download PDF"}
                    </button>
                    <button onClick={onClose} className="btn-outline flex-1">Close</button>
                </div>
            </div>
        </div>
    );
};
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTenantDashboardQuery, useTenantPaymentHistoryQuery, useTenantPaymentSummaryQuery, useTenantPaymentReceiptQuery } from "../hooks/use-tenant-portal-queries";
import { Loader2, AlertTriangle, Download, FileText, ChevronRight, Smartphone, XCircle, Wallet, TrendingUp, CreditCard, CheckCircle2, Sparkles } from "lucide-react";
import { formatDateTime, formatDate, StatusBadge } from "./tenant-format";
import { TenantPaymentReceiptResponse, tenantPortalApi } from "../api/tenant-portal-api";
import { downloadReceiptPdf } from "@/features/rentledger/components/download-receipt";
import { formatCurrency, toMoneyNumber } from "@/shared/utils/money";
import { MpesaMark } from "./payment-brand-marks";
import {
    PortalPage,
    PortalPageHeader,
    PortalCard,
    PortalCardHeader,
    PortalEmptyState,
    PortalSkeleton,
    PortalErrorState,
} from "./portal-chrome";

const PAGE_SIZE = 20;

type PayState = "idle" | "phone_prompt" | "initiating" | "pending" | "success" | "error";

export const TenantPaymentsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [page, setPage] = useState(0);
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

    const setupAutoPay = searchParams.get("setup") === "autopay";

    const { data: dashboardData } = useTenantDashboardQuery();
    const { data: summary } = useTenantPaymentSummaryQuery();
    const { data: history, isLoading, isError, refetch } = useTenantPaymentHistoryQuery(page, PAGE_SIZE);
    const { data: receipt, isLoading: receiptLoading } = useTenantPaymentReceiptQuery(selectedReceiptId ?? "");

    const [payState, setPayState] = useState<PayState>("idle");
    const [payMessage, setPayMessage] = useState("");
    const [payAmount, setPayAmount] = useState("");
    const [amountOverridden, setAmountOverridden] = useState(false);
    const [mpesaPhone, setMpesaPhone] = useState("");
    const [requestId, setRequestId] = useState<string | null>(null);
    const [sentToPhone, setSentToPhone] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentBalance = toMoneyNumber(summary?.currentBalance);
    const canPay = true;
    const defaultPayAmount = canPay ? currentBalance.toString() : "";
    const effectivePayAmount = amountOverridden ? payAmount : defaultPayAmount;

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const checkStatus = useCallback(async (rid: string) => {
        try {
            const status = await tenantPortalApi.getPaymentRequestStatus(rid);
            if (status.status === "PAID") {
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                router.push(`/portal/payment-success?requestId=${rid}`);
                return true;
            }
            if (status.status === "FAILED") {
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
                setPayState("error");
                setPayMessage("Payment failed. Please try again.");
                return true;
            }
        } catch {
        }
        return false;
    }, [router]);

    const initiatePayment = useCallback(async () => {
        const resolvedAmount = !amountOverridden && currentBalance > 0 ? currentBalance : parseFloat(payAmount);
        if (isNaN(resolvedAmount) || resolvedAmount <= 0) return;
        const phone = (mpesaPhone || dashboardData?.tenantPhone || "").replace(/\s+/g, "");
        if (!phone) return;

        setPayState("initiating");
        setPayMessage("");
        try {
            const result = await tenantPortalApi.initiatePortalPayment(resolvedAmount, phone);
            setRequestId(result.id);
            setSentToPhone(phone);
            setPayState("pending");
            setPayMessage("STK push sent! Check your phone and enter your M-Pesa PIN to complete payment.");

            pollRef.current = setInterval(async () => {
                const done = await checkStatus(result.id);
                if (!done) {
                    setPayMessage("Still awaiting confirmation. Check your M-Pesa messages.");
                }
            }, 5000);
        } catch (err) {
            setPayState("error");
            setPayMessage(err instanceof Error ? err.message : "Failed to initiate payment");
        }
    }, [amountOverridden, currentBalance, payAmount, mpesaPhone, checkStatus, dashboardData?.tenantPhone]);

    const refreshStatus = useCallback(async () => {
        if (requestId) {
            setPayMessage("Checking…");
            await checkStatus(requestId);
        }
    }, [requestId, checkStatus]);

    const resetPay = useCallback(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        setPayState("idle");
        setPayMessage("");
        setRequestId(null);
        setSentToPhone("");
    }, []);

    if (isLoading && page === 0) {
        return (
            <PortalPage>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="tenant-panel !p-4 space-y-2">
                            <div className="tenant-skeleton-premium h-3 w-1/3 rounded" />
                            <div className="tenant-skeleton-premium h-7 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
                <PortalSkeleton rows={4} />
            </PortalPage>
        );
    }

    if (isError) {
        return (
            <PortalPage>
                <PortalPageHeader
                    icon={Wallet}
                    eyebrow="Your money"
                    title="Payments"
                    subtitle="Every rent charge, payment and receipt in one place."
                />
                <PortalErrorState
                    title="Couldn't load your payment history"
                    description="This is usually temporary. Check your connection and try again."
                    onRetry={() => refetch()}
                />
            </PortalPage>
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
        <PortalPage>
            <PortalPageHeader
                icon={Wallet}
                eyebrow="Your money"
                title="Payments"
                subtitle="Every rent charge, payment and receipt in one place."
            />

            {/* Auto-pay upsell banner (from ?setup=autopay) */}
            {setupAutoPay && (
                <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/20 dark:to-brand-900/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                        <Sparkles className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Never miss a due date — set up auto-pay
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            Your rent will be paid automatically from M-Pesa on your due date. Takes less than a minute.
                        </p>
                    </div>
                    <Link href="/portal/lease?setup=autopay" className="btn-primary shrink-0 gap-2">
                        <Smartphone className="h-4 w-4" strokeWidth={2} />
                        Set up on Lease page
                    </Link>
                </div>
            )}

            {/* Pay Now Card — was a flat card-elevated div; every other portal
                page (lease, maintenance) already moved onto PortalCard's
                glass surface, this was the one page still on the older
                dialect. The plain-text "M-Pesa" chip is now the same
                MpesaMark used in the dashboard's payment method selector,
                rather than a second, differently-styled M-Pesa label. */}
            {canPay && (
                <PortalCard>
                    <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                                <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-fg dark:text-fg-dark">Make a Payment</h3>
                                    <MpesaMark />
                                </div>
                                <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                    Current balance due: <span className="font-data font-semibold text-danger-dark dark:text-danger">{formatCurrency(currentBalance)}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {payState === "idle" && (
                        <div className="space-y-4">
                            <div>
                                <label className="label-text">Amount to pay</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted dark:text-fg-muted-dark font-mono-nums text-sm">KSh</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={effectivePayAmount}
                                        onChange={(e) => { setAmountOverridden(true); setPayAmount(e.target.value); }}
                                        className="input-field pl-12 w-full"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setPayState("phone_prompt")}
                                disabled={!effectivePayAmount || parseFloat(effectivePayAmount) <= 0}
                                className="btn-primary w-full justify-center gap-2 py-2.5"
                            >
                                <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                                Continue to Payment
                            </button>
                        </div>
                    )}

                    {payState === "phone_prompt" && (
                        <div className="space-y-4">
                            <div>
                                <label className="label-text">M-Pesa Phone Number</label>
                                <input
                                    type="tel"
                                    value={mpesaPhone || dashboardData?.tenantPhone || ""}
                                    onChange={(e) => setMpesaPhone(e.target.value)}
                                    placeholder="+254712345678"
                                    className="input-field mt-1 w-full"
                                />
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                                    You will receive an M-Pesa prompt on this number.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={resetPay} className="btn-outline flex-1">Cancel</button>
                                <button
                                    onClick={initiatePayment}
                                    disabled={!(mpesaPhone || dashboardData?.tenantPhone)}
                                    className="btn-primary flex-1"
                                >
                                    Pay {formatCurrency(parseFloat(effectivePayAmount || "0"))}
                                </button>
                            </div>
                        </div>
                    )}

                    {payState === "initiating" && (
                        <div className="flex items-center gap-3 py-3">
                            <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                            <span className="text-sm text-fg-muted dark:text-fg-muted-dark">Sending payment request…</span>
                        </div>
                    )}

                    {payState === "pending" && (
                        <div className="space-y-3 py-2">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                                <span className="text-sm font-medium text-fg dark:text-fg-dark">Awaiting M-Pesa confirmation</span>
                            </div>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark pl-8">{payMessage}</p>
                            {sentToPhone && (
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark pl-8">
                                    Sent to <span className="font-medium font-mono-nums">{sentToPhone}</span>
                                </p>
                            )}
                            <button onClick={refreshStatus} className="btn-outline btn-sm ml-8">Check Status</button>
                        </div>
                    )}

                    {payState === "error" && (
                        <div className="space-y-3 py-2">
                            <div className="flex items-center gap-3">
                                <XCircle className="h-6 w-6 text-danger" strokeWidth={2} />
                                <span className="text-sm font-medium text-fg dark:text-fg-dark">Payment failed</span>
                            </div>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark pl-9">{payMessage}</p>
                            <button onClick={resetPay} className="btn-outline btn-sm mt-2">Try again</button>
                        </div>
                    )}
                </PortalCard>
            )}

            {/* Summary Cards — now the same .tenant-panel glass surface as
                the rest of the portal, not the flatter card-elevated utility. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PortalCard className="transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mb-3 bg-success-bg dark:bg-success-bg-dark text-success">
                        <TrendingUp className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                    </div>
                    <p className="kpi-label">Total Paid</p>
                    <p className="kpi-value font-data text-success-dark dark:text-success">{formatCurrency(summary?.totalPaid ?? 0)}</p>
                </PortalCard>
                <PortalCard className="transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mb-3 bg-danger-bg dark:bg-danger-bg-dark text-danger">
                        <CreditCard className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                    </div>
                    <p className="kpi-label">Total Due</p>
                    <p className="kpi-value font-data text-danger-dark dark:text-danger">{formatCurrency(summary?.totalDue ?? 0)}</p>
                </PortalCard>
                <PortalCard className="transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mb-3 bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                        <Wallet className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                    </div>
                    <p className="kpi-label">Current Balance</p>
                    <p className={`kpi-value font-data ${currentBalance > 0 ? "text-danger-dark dark:text-danger" : "text-success-dark dark:text-success"}`}>
                        {formatCurrency(summary?.currentBalance ?? 0)}
                    </p>
                </PortalCard>
            </div>

            {/* Payment History Table — PortalCard stays padded (default); the
                table itself bleeds to the card edge via -mx-4 below, same
                trick the original markup already used against card-elevated's
                padding, so PortalEmptyState (which has its own generous
                internal padding) and the table's edge-to-edge rows both work
                inside one consistently-padded card. */}
            <PortalCard>
                <PortalCardHeader
                    kicker="Ledger"
                    title="Payment History"
                    action={
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {totalElements} {totalElements === 1 ? "payment" : "payments"}
                        </span>
                    }
                />

                {payments.length === 0 ? (
                    <PortalEmptyState
                        icon={FileText}
                        title="No payments yet"
                        description="Your payment history will appear here once you make your first payment."
                    />
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
                                            {/* Was inverted: RENT_CHARGE (money the renter now owes
                                                more of) got "+", everything else (PAYMENT included —
                                                money reducing what they owe) got "−". The dashboard's
                                                TransactionItem already has this the right way round
                                                (isCredit = PAYMENT || REFUND); matched here for both
                                                correctness and cross-page consistency. */}
                                            <td
                                                className={`font-data font-semibold tabular-nums ${
                                                    p.type === "PAYMENT" || p.type === "REFUND"
                                                        ? "text-success-dark dark:text-success"
                                                        : "text-fg dark:text-fg-dark"
                                                }`}
                                            >
                                                {p.type === "PAYMENT" || p.type === "REFUND" ? "+" : "−"}
                                                {formatCurrency(p.amount)}
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReceiptId(null)}>
                        <div className="bg-surface dark:bg-surface-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-dropdown border border-border dark:border-border-dark animate-scale-in" onClick={(e) => e.stopPropagation()}>
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
            </PortalCard>
        </PortalPage>
    );
};

const ReceiptModalContent = ({ receipt, onClose }: { receipt: TenantPaymentReceiptResponse; onClose: () => void }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadReceiptPdf(receipt);
        } catch {
            window.print();
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="p-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-bg dark:bg-success-bg-dark text-success">
                        <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">RENTMANAGER</p>
                        <p className="font-semibold text-fg dark:text-fg-dark">Payment Receipt</p>
                    </div>
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

                {/* Says "eTIMS invoice", not "eTIMS Compliant".
                    The platform cannot certify a renter's or landlord's tax
                    compliance; it can display an invoice number that KRA
                    issued. Today it never renders — the backend hardcodes
                    eTimsInvoiceNumber to null because the eRITS/eTIMS
                    transmission adapters are honest stubs returning
                    NOT_AVAILABLE. The old wording was therefore a dormant
                    trap: the moment anything populated that field with a
                    locally generated number, a renter would have been shown a
                    statutory compliance claim with no KRA involvement. */}
                {receipt.eTimsInvoiceNumber && (
                    <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 border border-brand-100 dark:border-brand-800">
                        <p className="text-xs font-medium text-brand dark:text-brand-300">eTIMS invoice</p>
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

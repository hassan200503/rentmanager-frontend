"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    useTenantDashboardQuery,
    useTenantPaymentHistoryQuery,
    useTenantPaymentSummaryQuery,
    useTenantPaymentReceiptQuery,
    useTenantAutoPaySettingsQuery,
    tenantPortalKeys,
} from "../hooks/use-tenant-portal-queries";
import {
    useToggleAutoPayMutation,
    useUpdateAutoPayPhoneMutation,
} from "../hooks/use-tenant-portal-mutations";
import {
    tenantPortalApi,
    type TenantPaymentReceiptResponse,
    type TenantPaymentHistoryItem,
} from "../api/tenant-portal-api";
import { downloadReceiptPdf } from "@/features/rentledger/components/download-receipt";
import { formatCurrency, toMoneyNumber } from "@/shared/utils/money";
import { formatDate, formatDateTime, StatusBadge } from "./tenant-format";
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
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Download,
    FileDown,
    FileText,
    Loader2,
    Lock,
    Phone,
    RefreshCw,
    RotateCcw,
    Smartphone,
    TrendingUp,
    Wallet,
    XCircle,
    Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isValidMpesaPhone, normalizeMpesaPhone } from "@/lib/mpesa/phone";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PAGE_SIZE = 20;

const CREDIT_TYPES: TenantPaymentHistoryItem["type"][] = [
    "PAYMENT", "REFUND", "WAIVER", "CREDIT_APPLIED", "DEPOSIT",
];

const RECEIPT_TYPES: TenantPaymentHistoryItem["type"][] = ["PAYMENT", "DEPOSIT"];

const TYPE_LABELS: Record<TenantPaymentHistoryItem["type"], string> = {
    RENT_CHARGE: "Rent Charge",
    PAYMENT: "Payment",
    WAIVER: "Waiver",
    REFUND: "Refund",
    CREDIT_APPLIED: "Credit Applied",
    ADJUSTMENT: "Adjustment",
    DEPOSIT: "Deposit",
};

type FilterTab = "all" | "payments" | "charges";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSV EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const exportPaymentsCsv = async (): Promise<void> => {
    const all = await tenantPortalApi.getPaymentHistory(0, 1000);
    const header = ["Date", "Type", "Period Start", "Period End", "Amount (KES)", "Source", "Reference", "Status"];
    const rows = all.content.map((p) => [
        formatDateTime(p.occurredAt),
        TYPE_LABELS[p.type] ?? p.type,
        formatDate(p.billingPeriodStart),
        formatDate(p.billingPeriodEnd),
        `${CREDIT_TYPES.includes(p.type) ? "+" : "-"}${Math.abs(toMoneyNumber(p.amount)).toFixed(2)}`,
        p.source,
        p.mpesaTransactionId ?? p.externalReference ?? "",
        p.status,
    ]);
    const csv = [header, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOURCE CHIP — humanises the internal source enum
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SourceChip = ({ source, ref: ref_ }: { source: TenantPaymentHistoryItem["source"]; ref?: string | null }) => {
    if (source === "MPESA") {
        return (
            <div className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1">
                    <MpesaMark />
                </span>
                {ref_ && (
                    <span className="font-mono text-[10px] text-fg-muted dark:text-fg-muted-dark leading-none">
                        {ref_}
                    </span>
                )}
            </div>
        );
    }
    const labels: Record<string, { text: string; cls: string }> = {
        CASH: { text: "Cash", cls: "text-fg dark:text-fg-dark bg-ink/5 dark:bg-white/10" },
        ADMIN_ADJUSTMENT: { text: "Admin", cls: "text-brand dark:text-brand-300 bg-brand/8 dark:bg-brand/15" },
        SYSTEM: { text: "System", cls: "text-fg-muted dark:text-fg-muted-dark bg-ink/5 dark:bg-white/8" },
    };
    const cfg = labels[source] ?? { text: source, cls: "text-fg-muted dark:text-fg-muted-dark bg-ink/5" };
    return (
        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${cfg.cls}`}>
            {cfg.text}
        </span>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE ICON — small visual anchor per entry type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TypeIcon = ({ type }: { type: TenantPaymentHistoryItem["type"] }) => {
    const credit = CREDIT_TYPES.includes(type);
    return (
        <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                credit
                    ? "bg-success/10 text-success dark:bg-success/15"
                    : "bg-ink/5 text-fg-muted dark:bg-white/8 dark:text-fg-muted-dark"
            }`}
        >
            {type === "PAYMENT" || type === "DEPOSIT" ? (
                <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : type === "REFUND" ? (
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : type === "WAIVER" || type === "CREDIT_APPLIED" ? (
                <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTO-PAY CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AutoPayCard = ({ tenantPhone }: { tenantPhone: string }) => {
    const { data: autoPay, isLoading, isError } = useTenantAutoPaySettingsQuery();
    const toggleMutation = useToggleAutoPayMutation();
    const phoneMutation = useUpdateAutoPayPhoneMutation();
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");

    if (isLoading) {
        return (
            <PortalCard>
                <div className="flex items-center gap-3 mb-4">
                    <div className="tenant-skeleton-premium h-10 w-10 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                        <div className="tenant-skeleton-premium h-4 w-28 rounded" />
                        <div className="tenant-skeleton-premium h-3 w-44 rounded" />
                    </div>
                    <div className="tenant-skeleton-premium h-6 w-11 rounded-full shrink-0" />
                </div>
            </PortalCard>
        );
    }
    if (isError || !autoPay) return null;

    const storedPhone = autoPay.mpesaPhone ?? tenantPhone ?? "";
    const effectivePhone = editingPhone ? phoneInput : storedPhone;
    const phoneValid = isValidMpesaPhone(effectivePhone);

    const handleToggle = () => {
        const phone = normalizeMpesaPhone(storedPhone);
        if (!isValidMpesaPhone(phone)) {
            setPhoneInput(storedPhone);
            setEditingPhone(true);
            return;
        }
        toggleMutation.mutate({ enabled: !autoPay.enabled, mpesaPhone: phone });
    };

    const handleSavePhone = () => {
        if (!phoneValid) return;
        const normalized = normalizeMpesaPhone(phoneInput);
        phoneMutation.mutate({ mpesaPhone: normalized });
        setEditingPhone(false);
    };

    return (
        <PortalCard>
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.5)] ${autoPay.enabled ? "bg-gradient-to-br from-success/20 to-success/8 text-success" : "bg-gradient-to-br from-black/5 to-black/2 dark:from-white/8 dark:to-white/3 text-fg-muted dark:text-fg-muted-dark"}`}>
                        <Zap className="h-4.5 w-4.5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Auto-Pay</h3>
                            {autoPay.enabled && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            {autoPay.enabled
                                ? `Rent paid automatically on your due date via ${autoPay.mpesaPhone ?? "your M-Pesa number"}`
                                : "Pay rent automatically on your due date — never miss a payment"}
                        </p>
                        {autoPay.lastAutoPayDate && (
                            <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark mt-1 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-success" strokeWidth={2} />
                                Last ran {formatDate(autoPay.lastAutoPayDate)}
                            </p>
                        )}
                        {autoPay.consecutiveFailures > 0 && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-warning-dark dark:text-warning">
                                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                                {autoPay.consecutiveFailures} consecutive failure{autoPay.consecutiveFailures > 1 ? "s" : ""} — check your M-Pesa balance
                            </p>
                        )}
                    </div>
                </div>
                {/* Toggle */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={autoPay.enabled}
                    onClick={handleToggle}
                    disabled={toggleMutation.isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-60 ${autoPay.enabled ? "bg-success" : "bg-border dark:bg-border-dark"}`}
                >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${autoPay.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
            </div>

            {/* Phone number row */}
            {autoPay.enabled && (
                <div className="mt-4 pt-4 border-t border-border dark:border-border-dark">
                    {editingPhone ? (
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted dark:text-fg-muted-dark" />
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="0712345678"
                                    className="input-field pl-10 w-full text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSavePhone}
                                disabled={!phoneValid || phoneMutation.isPending}
                                className="btn-primary btn-sm shrink-0"
                            >
                                {phoneMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </button>
                            <button onClick={() => setEditingPhone(false)} className="btn-outline btn-sm shrink-0">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                <Phone className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                                <span className="font-mono-nums">{autoPay.mpesaPhone ?? tenantPhone ?? "—"}</span>
                            </div>
                            <button
                                onClick={() => { setPhoneInput(storedPhone); setEditingPhone(true); }}
                                className="btn-ghost btn-sm text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
                            >
                                Change number
                            </button>
                        </div>
                    )}
                </div>
            )}
        </PortalCard>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECEIPT MODAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ReceiptModalContent = ({
    receipt,
    onClose,
}: {
    receipt: TenantPaymentReceiptResponse;
    onClose: () => void;
}) => {
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
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                        <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-fg-muted dark:text-fg-muted-dark">
                            RENTMANAGER
                        </p>
                        <p className="font-semibold text-fg dark:text-fg-dark">Payment Receipt</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-border/30 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close"
                >
                    <XCircle className="h-5 w-5" strokeWidth={1.75} />
                </button>
            </div>

            <div className="space-y-4 border-t border-border dark:border-border-dark pt-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {[
                        { label: "Receipt #", value: receipt.receiptNumber },
                        { label: "Date", value: formatDateTime(receipt.paymentDate) },
                        { label: "Tenant", value: receipt.tenantName },
                        { label: "Phone", value: receipt.tenantPhone },
                        { label: "Unit", value: receipt.unitNumber },
                        { label: "Property", value: receipt.propertyName },
                        {
                            label: "Period",
                            value: `${formatDate(receipt.billingPeriodStart)} – ${formatDate(receipt.billingPeriodEnd)}`,
                            full: true,
                        },
                        {
                            label: "M-Pesa Ref",
                            value: receipt.mpesaTransactionId ?? "—",
                            full: true,
                            mono: true,
                        },
                    ].map((row) => (
                        <div key={row.label} className={row.full ? "col-span-2" : ""}>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{row.label}</p>
                            <p className={`mt-0.5 font-medium text-fg dark:text-fg-dark ${row.mono ? "font-mono-nums text-sm" : ""}`}>
                                {row.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Amount */}
                <div className="rounded-xl bg-success/5 border border-success/15 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-fg dark:text-fg-dark">Amount Paid</span>
                        <span className="font-data text-xl font-bold text-success-dark dark:text-success tabular-nums">
                            +{formatCurrency(receipt.amount)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-fg-muted dark:text-fg-muted-dark">
                        <span>Balance after payment</span>
                        <span className="font-mono-nums font-medium">{formatCurrency(receipt.balanceAfterPayment)}</span>
                    </div>
                </div>

                {receipt.eTimsInvoiceNumber && (
                    <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 border border-brand-100 dark:border-brand-800">
                        <p className="text-xs font-medium text-brand dark:text-brand-300">eTIMS invoice</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                            Invoice:{" "}
                            <span className="font-mono-nums font-medium">{receipt.eTimsInvoiceNumber}</span>
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-border dark:border-border-dark">
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="btn-primary flex-1 gap-2"
                    >
                        {downloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        ) : (
                            <Download className="h-4 w-4" strokeWidth={2} />
                        )}
                        {downloading ? "Generating…" : "Download PDF"}
                    </button>
                    <button onClick={onClose} className="btn-outline flex-1">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAY WIDGET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type PayState = "idle" | "phone_prompt" | "initiating" | "pending" | "success" | "error";

const PAY_POLL_MS = 5000;
const PAY_POLL_MAX = 60; // 60 × 5 s = 5 minutes, then surface a timeout error

interface PayWidgetProps {
    currentBalance: number;
    overdueAmount: number;
    nextDueAmount: number;
    monthlyRent: number;
    tenantPhone: string;
    leaseStatus: string;
}

const PayWidget = ({
    currentBalance,
    overdueAmount,
    nextDueAmount,
    monthlyRent,
    tenantPhone,
    leaseStatus,
}: PayWidgetProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [payState, setPayState] = useState<PayState>("idle");
    const [payMessage, setPayMessage] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState(tenantPhone);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [sentToPhone, setSentToPhone] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Derived gating — never pay on anything other than an active lease.
    const canPay = leaseStatus === "ACTIVE";
    const suggestedAmount = overdueAmount > 0 ? overdueAmount : nextDueAmount > 0 ? nextDueAmount : 0;
    const displayAmount = customAmount ? parseFloat(customAmount) : suggestedAmount;
    const amountValid = !isNaN(displayAmount) && displayAmount > 0;
    const effectivePhone = mpesaPhone || tenantPhone;
    const phoneValid = isValidMpesaPhone(effectivePhone);

    const quickAmounts = useMemo(() => {
        const s = new Set<number>();
        if (overdueAmount > 0) s.add(Math.round(overdueAmount));
        if (nextDueAmount > 0) s.add(Math.round(nextDueAmount));
        if (monthlyRent > 0) s.add(Math.round(monthlyRent));
        return [...s].slice(0, 3);
    }, [overdueAmount, nextDueAmount, monthlyRent]);

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);

    const checkStatus = useCallback(async (rid: string) => {
        try {
            const s = await tenantPortalApi.getPaymentRequestStatus(rid);
            if (s.status === "PAID") {
                stopPolling();
                queryClient.invalidateQueries({ queryKey: tenantPortalKeys.paymentSummary });
                // Prefix-invalidate ALL payment history (any page, any size).
                queryClient.invalidateQueries({ queryKey: tenantPortalKeys.paymentHistoryAll });
                queryClient.invalidateQueries({ queryKey: tenantPortalKeys.dashboard });
                router.push(`/portal/payment-success?requestId=${rid}`);
                return true;
            }
            if (s.status === "FAILED") {
                stopPolling();
                setPayState("error");
                setPayMessage("Payment was not completed. Please try again.");
                return true;
            }
        } catch { /* silent while polling */ }
        return false;
    }, [router, queryClient, stopPolling]);

    const initiatePayment = useCallback(async () => {
        if (!amountValid || !phoneValid) return;
        const phone = normalizeMpesaPhone(effectivePhone);
        setPayState("initiating");
        setPayMessage("");
        try {
            const result = await tenantPortalApi.initiatePortalPayment(displayAmount, phone);
            setRequestId(result.id);
            setSentToPhone(`0${phone.slice(3)}`);
            setPayState("pending");
            setPayMessage("STK push sent — enter your M-Pesa PIN to confirm.");
            let polls = 0;
            pollRef.current = setInterval(async () => {
                polls += 1;
                if (polls >= PAY_POLL_MAX) {
                    stopPolling();
                    setPayState("error");
                    setPayMessage(
                        "The payment is taking longer than expected. If money was deducted from your M-Pesa it will be reconciled automatically. Otherwise, please try again.",
                    );
                    return;
                }
                const done = await checkStatus(result.id);
                if (!done) setPayMessage("Still awaiting confirmation. Check your M-Pesa messages.");
            }, PAY_POLL_MS);
        } catch (err) {
            setPayState("error");
            setPayMessage(err instanceof Error ? err.message : "Failed to initiate payment. Please try again.");
        }
    }, [amountValid, phoneValid, displayAmount, effectivePhone, checkStatus]);

    const refreshStatus = useCallback(async () => {
        if (requestId) { setPayMessage("Checking status…"); await checkStatus(requestId); }
    }, [requestId, checkStatus]);

    const reset = useCallback(() => {
        stopPolling();
        setPayState("idle");
        setPayMessage("");
        setRequestId(null);
        setSentToPhone("");
    }, [stopPolling]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl border-[1.5px] border-brand-200 dark:border-brand-800/60 shadow-[0_2px_12px_rgba(5,150,105,0.08),0_8px_32px_rgba(5,150,105,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]"
            style={{ background: "linear-gradient(145deg, rgba(236,253,245,0.95) 0%, rgba(209,250,229,0.7) 100%)" }}
        >
            {/* Dark-mode backdrop */}
            <div className="absolute inset-0 hidden dark:block" style={{ background: "linear-gradient(145deg, rgba(6,78,59,0.25) 0%, rgba(4,120,87,0.15) 100%)" }} />

            <div className="relative p-6">
                {/* Widget header */}
                <div className="flex items-start justify-between mb-5 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[0_2px_8px_rgba(5,150,105,0.3)]">
                            <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-fg dark:text-fg-dark">Make a Payment</h3>
                                <MpesaMark />
                            </div>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                Sent directly to your landlord&apos;s M-Pesa
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-success bg-success/10 border border-success/20 px-2 py-1 rounded-full shrink-0">
                        <Lock className="h-3 w-3" strokeWidth={2} />
                        Secure
                    </div>
                </div>

                {!canPay ? (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/8 border border-warning/20">
                        <AlertCircle className="h-5 w-5 text-warning-dark dark:text-warning shrink-0 mt-0.5" strokeWidth={2} />
                        <div>
                            <p className="text-sm font-medium text-fg dark:text-fg-dark">Payments are paused</p>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                Your lease status is <strong>{leaseStatus.toLowerCase().replace(/_/g, " ")}</strong>. Contact your landlord to resume rent collection.
                            </p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {payState === "idle" && (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                                {/* Balance */}
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-fg-muted/65 dark:text-fg-muted-dark/65 mb-1.5">
                                        {overdueAmount > 0 ? "Overdue balance" : currentBalance > 0 ? "Balance due" : "Account balance"}
                                    </p>
                                    <p className="tenant-pay-balance">
                                        {formatCurrency(suggestedAmount > 0 ? suggestedAmount : currentBalance)}
                                    </p>
                                    {currentBalance === 0 && (
                                        <p className="mt-2 text-sm text-success flex items-center gap-1.5 font-medium">
                                            <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                                            All settled — no balance due
                                        </p>
                                    )}
                                </div>

                                {/* Amount input */}
                                <div className="space-y-3 mb-5">
                                    <label className="label-text">
                                        {suggestedAmount > 0 ? "Custom amount (optional)" : "Amount to pay"}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-fg-muted dark:text-fg-muted-dark">
                                            KSh
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                            placeholder={suggestedAmount > 0 ? String(Math.round(suggestedAmount)) : "0"}
                                            className="input-field pl-12 w-full text-lg font-bold tabular-nums"
                                        />
                                    </div>
                                    {quickAmounts.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {quickAmounts.map((a) => (
                                                <button
                                                    key={a}
                                                    type="button"
                                                    onClick={() => setCustomAmount(String(a))}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-200 ${
                                                        customAmount === String(a)
                                                            ? "border-brand-500 bg-brand-50 dark:bg-brand-900/35 text-brand-700 dark:text-brand-300"
                                                            : "border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:border-brand-300 dark:hover:border-brand-700 bg-white/70 dark:bg-white/5"
                                                    }`}
                                                >
                                                    {formatCurrency(a)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPayState("phone_prompt")}
                                    disabled={!amountValid}
                                    className="btn-primary w-full justify-center gap-2 py-3 text-base font-bold"
                                >
                                    <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                                    {amountValid
                                        ? `Pay ${formatCurrency(displayAmount)}`
                                        : "Enter an amount"}
                                    {amountValid && <ArrowRight className="h-4 w-4 ml-auto" strokeWidth={2.5} />}
                                </button>
                            </motion.div>
                        )}

                        {payState === "phone_prompt" && (
                            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-fg-muted/65 dark:text-fg-muted-dark/65 mb-1.5">
                                            Confirm payment
                                        </p>
                                        <p className="text-[2rem] font-extrabold tabular-nums text-fg dark:text-fg-dark tracking-tighter leading-none">
                                            {formatCurrency(displayAmount)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={reset}
                                        className="text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark underline underline-offset-2"
                                    >
                                        Change amount
                                    </button>
                                </div>

                                <div className="space-y-3 mb-5">
                                    <label className="label-text">M-Pesa phone number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted dark:text-fg-muted-dark" />
                                        <input
                                            type="tel"
                                            value={effectivePhone}
                                            onChange={(e) => setMpesaPhone(e.target.value)}
                                            placeholder="0712345678"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            className="input-field pl-10 w-full font-mono-nums"
                                        />
                                    </div>
                                    {effectivePhone && !phoneValid ? (
                                        <p className="flex items-center gap-1.5 text-xs text-danger">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                                            Enter a valid Safaricom number, e.g. 0712345678
                                        </p>
                                    ) : effectivePhone && phoneValid ? (
                                        <p className="flex items-center gap-1.5 text-xs text-success">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                                            You will receive an M-Pesa prompt on this number
                                        </p>
                                    ) : null}
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={reset} className="btn-outline flex-none px-5">
                                        Back
                                    </button>
                                    <button
                                        onClick={initiatePayment}
                                        disabled={!amountValid || !phoneValid}
                                        className="btn-primary flex-1 gap-2"
                                    >
                                        <Smartphone className="h-4 w-4" strokeWidth={1.75} />
                                        Pay {formatCurrency(displayAmount)}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {payState === "initiating" && (
                            <motion.div key="initiating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                                <div className="relative w-14 h-14 mx-auto mb-4">
                                    <div className="absolute inset-0 rounded-full bg-brand-500/15 animate-ping" />
                                    <div className="absolute inset-2 rounded-full bg-brand-600 flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 text-white animate-spin" strokeWidth={2.5} />
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-fg dark:text-fg-dark">Sending payment request…</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">Preparing your secure M-Pesa STK push</p>
                            </motion.div>
                        )}

                        {payState === "pending" && (
                            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="relative w-12 h-12 shrink-0">
                                        <div className="absolute inset-0 rounded-full bg-brand-500/15 animate-ping" />
                                        <div className="absolute inset-1.5 rounded-full bg-brand-600 flex items-center justify-center">
                                            <Smartphone className="h-4 w-4 text-white" strokeWidth={2} />
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Awaiting M-Pesa confirmation</p>
                                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">{payMessage}</p>
                                        {sentToPhone && (
                                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                                                Prompt sent to{" "}
                                                <span className="font-mono-nums font-semibold text-fg dark:text-fg-dark">{sentToPhone}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={refreshStatus} className="btn-outline btn-sm flex items-center gap-1.5">
                                        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                                        Check status
                                    </button>
                                    <button onClick={reset} className="text-xs text-fg-subtle dark:text-fg-subtle-dark hover:text-fg-muted dark:hover:text-fg-muted-dark">
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {payState === "error" && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20 mb-4">
                                    <XCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" strokeWidth={2} />
                                    <div>
                                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Payment could not be completed</p>
                                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{payMessage}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setPayState("phone_prompt")} className="btn-primary btn-sm">
                                        Try again
                                    </button>
                                    <button onClick={reset} className="btn-outline btn-sm">
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* Trust footer */}
                <div className="mt-5 pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-center gap-4 flex-wrap">
                    {[
                        { icon: Lock, label: "Bank-grade encryption" },
                        { icon: Smartphone, label: "M-Pesa secured" },
                        { icon: CheckCircle2, label: "Instant confirmation" },
                    ].map(({ icon: Icon, label }, i, arr) => (
                        <span key={label} className="flex items-center gap-1.5">
                            <Icon className="h-3 w-3 text-brand-600 dark:text-brand-400 shrink-0" strokeWidth={2.5} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted/55 dark:text-ink-muted-dark/55">
                                {label}
                            </span>
                            {i < arr.length - 1 && (
                                <span className="ml-4 h-3 w-px bg-black/[0.08] dark:bg-white/[0.08]" />
                            )}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TenantPaymentsPage = () => {
    const [page, setPage] = useState(0);
    const [filterTab, setFilterTab] = useState<FilterTab>("all");
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
    const [csvExporting, setCsvExporting] = useState(false);

    const { data: dashboardData } = useTenantDashboardQuery();
    const { data: summary, isLoading: summaryLoading } = useTenantPaymentSummaryQuery();
    const { data: history, isLoading: historyLoading, isError, refetch } = useTenantPaymentHistoryQuery(page, PAGE_SIZE);
    const { data: receipt, isLoading: receiptLoading } = useTenantPaymentReceiptQuery(selectedReceiptId ?? "");

    const leaseStatus = dashboardData?.leaseStatus ?? "ACTIVE";
    const currentBalance = toMoneyNumber(summary?.currentBalance ?? dashboardData?.currentBalance);
    const overdueAmount = toMoneyNumber(summary?.overdueAmount ?? dashboardData?.overdueAmount);
    const nextDueAmount = toMoneyNumber(dashboardData?.nextDueAmount);
    const monthlyRent = toMoneyNumber(dashboardData?.monthlyRent);
    const tenantPhone = dashboardData?.tenantPhone ?? "";

    const allPayments = useMemo(() => history?.content ?? [], [history?.content]);

    // Client-side filter on the current page — acceptable for typical renter
    // ledgers (≤ 100 entries). Server-side filtering not available on this endpoint.
    const filteredPayments = useMemo(() => {
        if (filterTab === "all") return allPayments;
        if (filterTab === "payments") return allPayments.filter((p) => CREDIT_TYPES.includes(p.type));
        return allPayments.filter((p) => !CREDIT_TYPES.includes(p.type));
    }, [allPayments, filterTab]);

    const totalElements = history?.totalElements ?? 0;
    const totalPages = history?.totalPages ?? 0;
    const pageStart = page * PAGE_SIZE + 1;
    const pageEnd = Math.min((page + 1) * PAGE_SIZE, totalElements);

    const handleCsvExport = async () => {
        setCsvExporting(true);
        try {
            await exportPaymentsCsv();
        } finally {
            setCsvExporting(false);
        }
    };

    if (historyLoading && page === 0 && summaryLoading) {
        return (
            <PortalPage>
                <PortalPageHeader
                    icon={Wallet}
                    eyebrow="Your money"
                    title="Payments"
                    subtitle="Every rent charge, payment and receipt in one place."
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-white dark:bg-[#111112] rounded-2xl p-5 border border-black/[0.055] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] space-y-3">
                            <div className="tenant-skeleton-premium h-10 w-10 rounded-xl" />
                            <div className="tenant-skeleton-premium h-3 w-20 rounded" />
                            <div className="tenant-skeleton-premium h-8 w-28 rounded" />
                        </div>
                    ))}
                </div>
                <PortalSkeleton rows={5} />
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

    return (
        <PortalPage>
            <PortalPageHeader
                icon={Wallet}
                eyebrow="Your money"
                title="Payments"
                subtitle="Every rent charge, payment and receipt in one place."
                actions={
                    totalElements > 0 ? (
                        <button
                            type="button"
                            onClick={handleCsvExport}
                            disabled={csvExporting}
                            className="btn-outline btn-sm gap-2"
                        >
                            {csvExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                            ) : (
                                <FileDown className="h-4 w-4" strokeWidth={2} />
                            )}
                            Export CSV
                        </button>
                    ) : undefined
                }
            />

            {/* Overdue alert */}
            {overdueAmount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 bg-danger/5 border border-danger/20"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                            <AlertCircle className="h-4 w-4 text-danger" strokeWidth={2} />
                        </div>
                        <p className="text-sm text-fg dark:text-fg-dark min-w-0">
                            <span className="font-bold text-danger">{formatCurrency(overdueAmount)} overdue</span>
                            {" — "}settling this now keeps your payment record clean.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Pay Now widget */}
            <PayWidget
                currentBalance={currentBalance}
                overdueAmount={overdueAmount}
                nextDueAmount={nextDueAmount}
                monthlyRent={monthlyRent}
                tenantPhone={tenantPhone}
                leaseStatus={leaseStatus}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Paid */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.25 } }}
                    className="bg-white dark:bg-[#111112] rounded-2xl p-5 border border-black/[0.055] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3.5 bg-gradient-to-br from-success/20 to-success/8 text-success shadow-[0_2px_6px_rgba(22,163,74,0.15),inset_0_1px_0_rgba(255,255,255,0.5)]">
                        <TrendingUp className="h-[18px] w-[18px]" strokeWidth={2} />
                    </div>
                    <p className="kpi-label mb-1">Total Paid</p>
                    {summaryLoading ? (
                        <div className="tenant-skeleton-premium h-8 w-28 rounded mt-1" />
                    ) : (
                        <p className="tenant-metric-value text-success-dark dark:text-success">
                            {formatCurrency(summary?.totalPaid ?? 0)}
                        </p>
                    )}
                    {!summaryLoading && summary?.paymentsThisYear != null && summary.paymentsThisYear > 0 && (
                        <p className="mt-2 text-xs font-medium text-fg-muted/70 dark:text-fg-muted-dark/70">
                            {summary.paymentsThisYear} payment{summary.paymentsThisYear === 1 ? "" : "s"} this year
                        </p>
                    )}
                </motion.div>

                {/* Total Due */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.25 } }}
                    className="bg-white dark:bg-[#111112] rounded-2xl p-5 border border-black/[0.055] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3.5 bg-gradient-to-br from-danger/15 to-danger/6 text-danger shadow-[0_2px_6px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.5)]">
                        <CreditCard className="h-[18px] w-[18px]" strokeWidth={2} />
                    </div>
                    <p className="kpi-label mb-1">Total Due</p>
                    {summaryLoading ? (
                        <div className="tenant-skeleton-premium h-8 w-28 rounded mt-1" />
                    ) : (
                        <p className="tenant-metric-value text-danger-dark dark:text-danger">
                            {formatCurrency(summary?.totalDue ?? 0)}
                        </p>
                    )}
                    {!summaryLoading && summary?.lastPaymentDate && (
                        <p className="mt-2 text-xs font-medium text-fg-muted/70 dark:text-fg-muted-dark/70 flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            Last payment {formatDate(summary.lastPaymentDate)}
                        </p>
                    )}
                </motion.div>

                {/* Current Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.25 } }}
                    className="bg-white dark:bg-[#111112] rounded-2xl p-5 border border-black/[0.055] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300"
                >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3.5 shadow-[0_2px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] ${currentBalance > 0 ? "bg-gradient-to-br from-danger/15 to-danger/6 text-danger" : "bg-gradient-to-br from-success/20 to-success/8 text-success"}`}>
                        <Wallet className="h-[18px] w-[18px]" strokeWidth={2} />
                    </div>
                    <p className="kpi-label mb-1">Current Balance</p>
                    {summaryLoading ? (
                        <div className="tenant-skeleton-premium h-8 w-28 rounded mt-1" />
                    ) : (
                        <p className={`tenant-metric-value ${currentBalance > 0 ? "text-danger-dark dark:text-danger" : "text-success-dark dark:text-success"}`}>
                            {formatCurrency(summary?.currentBalance ?? 0)}
                        </p>
                    )}
                    {!summaryLoading && currentBalance === 0 && (
                        <p className="mt-2 text-xs font-medium text-success flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3 shrink-0" strokeWidth={2.5} />
                            Account settled
                        </p>
                    )}
                </motion.div>
            </div>

            {/* Auto-Pay Card */}
            <AutoPayCard tenantPhone={tenantPhone} />

            {/* Payment History */}
            <PortalCard padded={false}>
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
                    <PortalCardHeader
                        kicker="Ledger"
                        title="Payment History"
                        action={
                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark tabular-nums">
                                {totalElements > 0 && `${pageStart}–${pageEnd} of `}{totalElements}{" "}
                                {totalElements === 1 ? "entry" : "entries"}
                            </span>
                        }
                    />

                    {/* Filter tabs */}
                    {allPayments.length > 0 && (
                        <div className="flex gap-1.5 mt-3 p-1 rounded-xl bg-black/[0.035] dark:bg-white/[0.04] w-fit">
                            {(["all", "payments", "charges"] as FilterTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setFilterTab(tab)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        filterTab === tab
                                            ? "bg-white dark:bg-[#1c1c1e] text-fg dark:text-fg-dark shadow-[0_1px_3px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,1)]"
                                            : "text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {historyLoading ? (
                    <div className="px-5 sm:px-6 pb-5">
                        <PortalSkeleton rows={4} />
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <PortalEmptyState
                        icon={FileText}
                        title={filterTab === "all" ? "No payments yet" : `No ${filterTab} found on this page`}
                        description={
                            filterTab === "all"
                                ? "Your rent charges and payments will appear here once your tenancy begins."
                                : "Try the 'All' tab or navigate to another page."
                        }
                        action={
                            filterTab !== "all" ? (
                                <button onClick={() => setFilterTab("all")} className="btn-outline btn-sm">
                                    Show all entries
                                </button>
                            ) : undefined
                        }
                    />
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th className="w-8" />
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th className="hidden sm:table-cell">Period</th>
                                        <th>Amount</th>
                                        <th className="hidden md:table-cell">Source</th>
                                        <th>Status</th>
                                        <th className="w-10" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((p, i) => {
                                        const isCredit = CREDIT_TYPES.includes(p.type);
                                        const hasReceipt = RECEIPT_TYPES.includes(p.type);
                                        return (
                                            <motion.tr
                                                key={p.id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.25, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                <td className="!pr-0">
                                                    <TypeIcon type={p.type} />
                                                </td>
                                                <td className="text-fg-muted dark:text-fg-muted-dark text-sm whitespace-nowrap">
                                                    {formatDateTime(p.occurredAt)}
                                                </td>
                                                <td>
                                                    <span className="font-medium text-fg dark:text-fg-dark text-sm">
                                                        {TYPE_LABELS[p.type] ?? p.type}
                                                    </span>
                                                </td>
                                                <td className="hidden sm:table-cell text-sm text-fg-muted dark:text-fg-muted-dark whitespace-nowrap">
                                                    {formatDate(p.billingPeriodStart)} – {formatDate(p.billingPeriodEnd)}
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    <span className={`tenant-txn-amount ${isCredit ? "credit" : "text-fg dark:text-fg-dark"}`}>
                                                        {isCredit ? "+" : p.type === "ADJUSTMENT" ? "" : "−"}
                                                        {formatCurrency(Math.abs(toMoneyNumber(p.amount)))}
                                                    </span>
                                                </td>
                                                <td className="hidden md:table-cell">
                                                    <SourceChip
                                                        source={p.source}
                                                        ref={p.mpesaTransactionId ?? p.externalReference}
                                                    />
                                                </td>
                                                <td>
                                                    <StatusBadge status={p.status} />
                                                </td>
                                                <td className="text-right">
                                                    {hasReceipt && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedReceiptId(p.id)}
                                                            disabled={receiptLoading && selectedReceiptId === p.id}
                                                            className="btn-ghost btn-sm p-1.5 text-fg-muted hover:text-brand hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                                            aria-label={`View receipt for ${formatCurrency(toMoneyNumber(p.amount))}`}
                                                            title="Download receipt"
                                                        >
                                                            {receiptLoading && selectedReceiptId === p.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                                            ) : (
                                                                <Download className="h-4 w-4" strokeWidth={2} />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-border dark:border-border-dark">
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark tabular-nums">
                                    Showing {pageStart}–{pageEnd} of {totalElements}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="btn-secondary btn-sm p-2 disabled:opacity-40"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                    <span className="px-3 py-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="btn-secondary btn-sm p-2 disabled:opacity-40"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </PortalCard>

            {/* Receipt Modal */}
            <AnimatePresence>
                {selectedReceiptId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedReceiptId(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-surface dark:bg-surface-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-dropdown border border-border dark:border-border-dark"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {receiptLoading ? (
                                <div className="p-8 text-center">
                                    <div className="relative w-12 h-12 mx-auto mb-4">
                                        <div className="absolute inset-0 rounded-full bg-brand-500/15 animate-ping" />
                                        <div className="absolute inset-2 rounded-full bg-brand-600 flex items-center justify-center">
                                            <Loader2 className="h-4 w-4 text-white animate-spin" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">Generating receipt…</p>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">This takes just a moment</p>
                                </div>
                            ) : receipt ? (
                                <ReceiptModalContent receipt={receipt} onClose={() => setSelectedReceiptId(null)} />
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="flex h-12 w-12 mx-auto mb-4 items-center justify-center rounded-2xl bg-danger/10">
                                        <AlertCircle className="h-6 w-6 text-danger" strokeWidth={1.75} />
                                    </div>
                                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Receipt not available</p>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                                        Receipts are only generated for confirmed payments.
                                    </p>
                                    <button onClick={() => setSelectedReceiptId(null)} className="btn-secondary btn-sm">
                                        Close
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PortalPage>
    );
};

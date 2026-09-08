// components/premium-tenant-dashboard.tsx
"use client";

import {
    useTenantDashboardQuery,
    useTenantPaymentHistoryQuery,
    useTenantPaymentSummaryQuery,
    useTenantLeaseQuery,
} from "../hooks/use-tenant-portal-queries";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { tenantPortalApi, type TenantPaymentHistoryItem } from "../api/tenant-portal-api";
import { tenantPortalKeys } from "../hooks/tenant-portal-keys";
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Building2,
    Calendar,
    CheckCircle2,
    FileText,
    Home,
    Loader2,
    Lock,
    MessageCircle,
    Phone,
    Receipt,
    Smartphone,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Wallet,
    Wrench,
    Zap,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, toMoneyNumber, type MoneyValue } from "@/shared/utils/money";
import { MpesaMark, MpesaLogoTile, BankMark, CardMark } from "./payment-brand-marks";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const titleCaseStatus = (status: string) =>
    status
        ?.toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "Unknown";

/**
 * Whole days from today to `iso`, negative once the date has passed.
 * Returns a large number for an unparseable date so callers fall back to
 * their calm state rather than flagging urgency they can't justify.
 */
const daysUntil = (iso: string | null) => {
    if (!iso) return Number.MAX_SAFE_INTEGER;
    const due = new Date(iso);
    if (isNaN(due.getTime())) return Number.MAX_SAFE_INTEGER;
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86_400_000);
};

const dueSummary = (iso: string | null) => {
    if (!iso) return "No due date scheduled";

    const due = new Date(iso);
    if (isNaN(due.getTime())) return "No due date scheduled";
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    if (diffDays < 0) return `${Math.abs(diffDays)} day${diffDays === -1 ? "" : "s"} overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
};

const statusTone = (status: string) => {
    const normalized = status?.toUpperCase?.() ?? "";
    if (["ACTIVE", "PAID", "COMPLETED", "OVERPAID", "APPROVED"].includes(normalized)) return "success";
    if (["OVERDUE", "TERMINATED", "FAILED", "REJECTED"].includes(normalized)) return "danger";
    if (["PENDING", "DUE", "PARTIALLY_PAID", "PARTIAL"].includes(normalized)) return "warning";
    return "neutral";
};

// Normalize a Kenyan mobile number to 2547XXXXXXXX form.
export const normalizeMpesaPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 9 && digits.startsWith("7")) return `254${digits}`;
    if (digits.length === 10 && digits.startsWith("07")) return `254${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("2547")) return digits;
    return digits;
};

export const isValidMpesaPhone = (raw: string): boolean => {
    const normalized = normalizeMpesaPhone(raw);
    return /^2547\d{8}$/.test(normalized);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREMIUM COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const StatusBadge = ({ status, onBrand = false }: { status: string; onBrand?: boolean }) => {
    const tone = statusTone(status);
    const colorClasses = {
        success: "bg-success/10 text-success dark:bg-success/15 border-success/20",
        danger: "bg-danger/10 text-danger dark:bg-danger/15 border-danger/20",
        warning: "bg-warning/10 text-warning dark:bg-warning/15 border-warning/20",
        neutral: "bg-ink/5 text-ink-muted dark:bg-ink/10 border-ink/10",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                onBrand ? "bg-white/10 border-white/20 text-white" : colorClasses[tone]
            }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${
                    onBrand
                        ? "bg-white/80"
                        : tone === "success"
                          ? "bg-success"
                          : tone === "danger"
                            ? "bg-danger"
                            : tone === "warning"
                              ? "bg-warning"
                              : "bg-ink-muted"
                }`}
            />
            {titleCaseStatus(status)}
        </span>
    );
};

interface MetricCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    hint?: string;
    trend?: { value: number; direction: "up" | "down" };
    tone?: "brand" | "success" | "warning" | "danger" | "neutral";
    loading?: boolean;
}

const MetricCard = ({ icon: Icon, label, value, hint, trend, tone = "neutral", loading }: MetricCardProps) => {
    const toneClasses = {
        brand: "text-brand-600 dark:text-brand-400",
        success: "text-success dark:text-success",
        warning: "text-warning dark:text-warning",
        danger: "text-danger dark:text-danger",
        neutral: "text-ink-muted dark:text-ink-muted",
    };

    const iconGradients = {
        brand: "from-brand-600/10 to-brand-500/5",
        success: "from-success/15 to-success/5",
        warning: "from-warning/15 to-warning/5",
        danger: "from-danger/15 to-danger/5",
        neutral: "from-ink/10 to-ink/5",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
                y: -2,
                transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 bg-white dark:bg-[#111112] border border-black/[0.055] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06),0_20px_40px_-12px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.10),0_24px_48px_-16px_rgba(5,150,105,0.08),inset_0_1px_0_rgba(255,255,255,1)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.4),0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-brand-100 dark:hover:border-brand-900/40"
        >
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, rgba(5, 150, 105, 0.08) 0%, transparent 70%)' }}
            />
            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    <motion.div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${iconGradients[tone]} ${toneClasses[tone]} shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]`}
                        whileHover={{ rotate: 4, scale: 1.08, transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] } }}
                    >
                        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                    </motion.div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${trend.direction === "up" ? "text-success" : "text-danger"}`}>
                            {trend.direction === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark font-medium uppercase tracking-wider">{label}</p>
                    {loading ? (
                        <div className="h-8 w-24 tenant-skeleton rounded" />
                    ) : (
                        <motion.p
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="tenant-metric-value mt-0.5"
                        >
                            {value}
                        </motion.p>
                    )}
                    {hint && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-xs text-ink-muted/70 dark:text-ink-muted-dark/70 font-medium"
                        >
                            {hint}
                        </motion.p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

interface QuickActionProps {
    icon: LucideIcon;
    label: string;
    href: string;
    variant?: "primary" | "secondary" | "outline";
}

const QuickAction = ({ icon: Icon, label, href, variant = "secondary" }: QuickActionProps) => {
    const variantClasses = {
        primary: "bg-white text-brand-700 hover:bg-white/95 shadow-button hover:shadow-elevated",
        secondary: "bg-ink/5 text-ink hover:bg-ink/8 dark:bg-ink/10 dark:text-ink-dark dark:hover:bg-ink/15",
        outline: "bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:border-white/40 backdrop-blur-sm",
    };

    return (
        <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <Link href={href} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${variantClasses[variant]}`}>
                <Icon className="w-4 h-4" />
                {label}
            </Link>
        </motion.div>
    );
};

interface TransactionItemProps {
    type: string;
    amount: MoneyValue;
    occurredAt: string;
    status?: string;
    mpesaRef?: string | null;
    billingPeriod?: string;
    index?: number;
}

const TransactionItem = ({ type, amount, occurredAt, status, mpesaRef, billingPeriod, index = 0 }: TransactionItemProps) => {
    const isCredit = type === "PAYMENT" || type === "REFUND" || type === "WAIVER" || type === "CREDIT_APPLIED" || type === "DEPOSIT";
    const typeLabels: Record<string, string> = {
        RENT_CHARGE: "Rent Charge",
        PAYMENT: "Payment",
        WAIVER: "Waiver",
        REFUND: "Refund",
        CREDIT_APPLIED: "Credit Applied",
        ADJUSTMENT: "Adjustment",
        DEPOSIT: "Deposit",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-ink/[0.018] dark:hover:bg-white/[0.028] transition-colors duration-150 group"
        >
            {/* Icon */}
            <div className={`tenant-txn-icon ${isCredit ? "credit" : "debit"} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${isCredit ? "ring-success/[0.12]" : "ring-black/[0.05] dark:ring-white/[0.06]"}`}>
                {isCredit
                    ? <ArrowDownLeft className="w-[15px] h-[15px]" strokeWidth={2.5} />
                    : <ArrowUpRight className="w-[15px] h-[15px]" strokeWidth={2.5} />}
            </div>

            {/* Label + meta */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-[3px]">
                    <p className="text-[0.8125rem] font-semibold text-ink dark:text-ink-dark leading-none truncate">
                        {typeLabels[type] || titleCaseStatus(type)}
                    </p>
                    {status && <StatusBadge status={status} />}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-ink-muted/60 dark:text-ink-muted-dark/60 font-medium">
                    <span className="whitespace-nowrap">{formatDateTime(occurredAt)}</span>
                    {mpesaRef && (
                        <>
                            <span className="mx-0.5 opacity-40">·</span>
                            <span className="font-mono text-[10px] tracking-tight bg-ink/[0.045] dark:bg-white/[0.06] px-1.5 py-px rounded-md truncate max-w-[7rem]">
                                {mpesaRef}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Amount + period */}
            <div className="shrink-0 text-right">
                <p className={`tenant-txn-amount leading-none ${isCredit ? "credit" : "text-ink dark:text-ink-dark"}`}>
                    {isCredit ? "+" : "−"}{formatCurrency(Math.abs(toMoneyNumber(amount)))}
                </p>
                {billingPeriod && (
                    <p className="mt-1 text-[10px] font-medium text-ink-muted/45 dark:text-ink-muted-dark/45 whitespace-nowrap">
                        {billingPeriod}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYMENT WIDGET (HIGH CONVERSION — FULLY WIRED)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type PayState = "idle" | "phone" | "processing" | "pending" | "error";

const PAY_POLL_INTERVAL_MS = 5000;
// 60 polls × 5 s = 5 minutes. After this we stop and tell the user to check manually.
const PAY_POLL_MAX = 60;

interface PaymentWidgetProps {
    currentBalance: number;
    nextDueAmount: number;
    overdueAmount: number;
    monthlyRent: number;
    tenantPhone?: string;
    leaseStatus: string;
}

const PaymentWidget = ({
    currentBalance,
    nextDueAmount,
    overdueAmount,
    monthlyRent,
    tenantPhone = "",
    leaseStatus,
}: PaymentWidgetProps) => {
    const [customAmount, setCustomAmount] = useState("");
    const [selectedMethod, setSelectedMethod] = useState<"mpesa" | "bank" | "card">("mpesa");
    const [payState, setPayState] = useState<PayState>("idle");
    const [mpesaPhone, setMpesaPhone] = useState(tenantPhone);
    const [payMessage, setPayMessage] = useState("");
    const [requestId, setRequestId] = useState<string | null>(null);
    const [sentToPhone, setSentToPhone] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const canPay = leaseStatus === "ACTIVE";
    const suggestedAmount = overdueAmount > 0 ? overdueAmount : nextDueAmount > 0 ? nextDueAmount : 0;
    const displayAmount = customAmount ? parseFloat(customAmount) : suggestedAmount;
    const amountValid = !isNaN(displayAmount) && displayAmount > 0;
    const effectivePhone = mpesaPhone || tenantPhone;
    const phoneValid = isValidMpesaPhone(effectivePhone);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const handlePaid = useCallback(
        (rid: string) => {
            stopPolling();
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.dashboard() });
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.paymentSummary() });
            // Invalidate all payment history pages/sizes so both the dashboard
            // activity feed and the payments page reflect the new transaction.
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.paymentHistoryAll });
            router.push(`/portal/payment-success?requestId=${rid}`);
        },
        [router, queryClient, stopPolling],
    );

    const checkStatus = useCallback(
        async (rid: string) => {
            try {
                const status = await tenantPortalApi.getPaymentRequestStatus(rid);
                if (status.status === "PAID") {
                    handlePaid(rid);
                    return true;
                }
                if (status.status === "FAILED") {
                    stopPolling();
                    setPayState("error");
                    setPayMessage("Payment was not completed. Please try again.");
                    return true;
                }
            } catch {
                // stay quiet while polling; user can check manually
            }
            return false;
        },
        [handlePaid, stopPolling],
    );

    const initiatePayment = useCallback(async () => {
        if (!amountValid) return;
        const phone = normalizeMpesaPhone(effectivePhone);
        if (!/^2547\d{8}$/.test(phone)) {
            setPayState("error");
            setPayMessage("Enter a valid M-Pesa number, e.g. 0712345678.");
            return;
        }

        setPayState("processing");
        setPayMessage("");
        try {
            const result = await tenantPortalApi.initiatePortalPayment(displayAmount, phone);
            setRequestId(result.id);
            setSentToPhone(`0${phone.slice(3)}`);
            setPayState("pending");
            setPayMessage("STK push sent — check your phone and enter your M-Pesa PIN.");

            let polls = 0;
            pollRef.current = setInterval(async () => {
                polls += 1;
                if (polls >= PAY_POLL_MAX) {
                    stopPolling();
                    setPayState("error");
                    setPayMessage(
                        "The payment is taking longer than expected. If money was deducted from your M-Pesa it will be reconciled automatically — check your messages. Otherwise, please try again.",
                    );
                    return;
                }
                const done = await checkStatus(result.id);
                if (!done) {
                    setPayMessage(
                        polls % 3 === 0
                            ? "Still awaiting confirmation. Check your M-Pesa messages for the prompt."
                            : "STK push sent — check your phone and enter your M-Pesa PIN.",
                    );
                }
            }, PAY_POLL_INTERVAL_MS);
        } catch (err) {
            setPayState("error");
            setPayMessage(err instanceof Error ? err.message : "Failed to initiate payment. Please try again.");
        }
    }, [amountValid, displayAmount, effectivePhone, checkStatus]);

    const refreshStatus = useCallback(async () => {
        if (requestId) {
            setPayMessage("Checking payment status…");
            await checkStatus(requestId);
        }
    }, [requestId, checkStatus]);

    const resetPay = useCallback(() => {
        stopPolling();
        setPayState("idle");
        setPayMessage("");
        setRequestId(null);
        setSentToPhone("");
    }, [stopPolling]);

    const quickAmounts = useMemo(() => {
        const amounts: number[] = [];
        if (overdueAmount > 0) amounts.push(overdueAmount);
        if (nextDueAmount > 0) amounts.push(nextDueAmount);
        if (monthlyRent > 0 && !amounts.includes(monthlyRent)) amounts.push(monthlyRent);
        return amounts.slice(0, 3).map((a) => Math.round(a));
    }, [overdueAmount, nextDueAmount, monthlyRent]);

    const paymentMethods = [
        { id: "mpesa" as const, Mark: MpesaMark, label: "M-Pesa", timing: "Instant", popular: true },
        { id: "bank" as const, Mark: BankMark, label: "Bank Transfer", timing: "1–2 days", popular: false, comingSoon: true },
        { id: "card" as const, Mark: CardMark, label: "Card", timing: "Instant", popular: false, comingSoon: true },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/25 dark:to-emerald-900/15 border-[1.5px] border-brand-200 dark:border-brand-800/60 shadow-[0_2px_12px_rgba(5,150,105,0.08),0_8px_32px_rgba(5,150,105,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-ink dark:text-ink-dark mb-1">Quick Payment</h3>
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Secure, instant, and hassle-free</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 px-2.5 py-1.5 rounded-full">
                    <Lock className="w-3.5 h-3.5" />
                    Secure
                </div>
            </div>

            {!canPay ? (
                <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-ink dark:text-ink-dark">Payments are paused</p>
                        <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
                            Your lease status is {titleCaseStatus(leaseStatus)}. Contact your landlord to resume rent collection.
                        </p>
                    </div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {payState === "idle" && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                            {/* Balance Due */}
                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted/65 dark:text-ink-muted-dark/65 mb-1.5">
                                    {overdueAmount > 0 ? "Overdue Amount" : currentBalance > 0 ? "Balance Due" : "Advance Payment"}
                                </p>
                                <p className="tenant-pay-balance">
                                    {formatCurrency(suggestedAmount || 0)}
                                </p>
                                {currentBalance === 0 && (
                                    <p className="text-sm text-success mt-2 flex items-center gap-1.5 font-medium">
                                        <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                                        All clear. No balance due right now.
                                    </p>
                                )}
                            </div>

                            {/* Custom Amount Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-2">
                                    {suggestedAmount > 0 ? "Custom amount (optional)" : "Enter amount to pay"}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark font-medium">KSh</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder={suggestedAmount > 0 ? suggestedAmount.toString() : "0"}
                                        className="w-full pl-16 pr-4 py-3.5 text-lg font-bold tabular-nums rounded-lg transition-all duration-200 bg-white/95 dark:bg-surface-dark border-2 border-black/[0.08] dark:border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)] text-ink dark:text-ink-dark focus:outline-none focus:scale-[1.01] focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(5,150,105,0.08),0_4px_8px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_0_0_4px_rgba(16,185,129,0.15),0_4px_8px_rgba(0,0,0,0.2)]"
                                    />
                                </div>
                                {quickAmounts.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {quickAmounts.map((amount) => (
                                            <motion.button
                                                key={amount}
                                                type="button"
                                                onClick={() => setCustomAmount(String(amount))}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                                                    customAmount === String(amount)
                                                        ? "border-2 border-brand-500 text-brand-700 dark:text-brand-400 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-emerald-900/25 shadow-[0_0_0_4px_rgba(5,150,105,0.08)] dark:shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                                                        : "border-2 border-border dark:border-border-dark text-ink-muted dark:text-ink-muted-dark hover:border-brand-300 dark:hover:border-brand-700 bg-white/80 dark:bg-white/5"
                                                }`}
                                            >
                                                {formatCurrency(amount)}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                                {currentBalance === 0 && customAmount && parseFloat(customAmount) > 0 && (
                                    <p className="text-xs text-ink-subtle dark:text-ink-subtle-dark mt-2 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                                        Making an advance payment builds a positive payment history
                                    </p>
                                )}
                            </div>

                            {/* Payment Methods */}
                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted/60 dark:text-ink-muted-dark/60 mb-2.5">Payment Method</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map((method) => {
                                        const selected = selectedMethod === method.id;
                                        const { Mark } = method;
                                        const isMpesa = method.id === "mpesa";

                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => !method.comingSoon && setSelectedMethod(method.id)}
                                                disabled={method.comingSoon}
                                                aria-pressed={selected}
                                                title={method.comingSoon ? "Coming soon" : undefined}
                                                className={`group relative flex flex-col items-center gap-1.5 rounded-xl px-2 pt-5 pb-3 transition-all duration-200 ${
                                                    method.comingSoon ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                                } ${
                                                    selected
                                                        ? isMpesa
                                                            ? "bg-white dark:bg-[#0f1f13] border-2 border-[#39b54a] shadow-[0_0_0_3px_rgba(57,181,74,0.18),0_4px_16px_rgba(57,181,74,0.14)]"
                                                            : "bg-white dark:bg-[#111112] border-2 border-brand-500 shadow-[0_0_0_3px_rgba(5,150,105,0.12),0_4px_12px_rgba(5,150,105,0.10)]"
                                                        : "bg-white dark:bg-[#111112] border border-black/[0.07] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:border-black/[0.12] dark:hover:border-white/[0.14] hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)]"
                                                }`}
                                            >
                                                {/* Popular badge */}
                                                {method.popular && !method.comingSoon && (
                                                    <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.07em] shadow-sm bg-[#39b54a] text-white">
                                                        Popular
                                                    </span>
                                                )}
                                                {method.comingSoon && (
                                                    <span className="absolute -top-[9px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-ink/[0.06] dark:bg-white/[0.08] px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.07em] text-ink-muted dark:text-ink-muted-dark">
                                                        Soon
                                                    </span>
                                                )}

                                                {/* Logo / icon */}
                                                <span className="flex h-[52px] items-center justify-center">
                                                    {isMpesa
                                                        ? <MpesaLogoTile />
                                                        : (
                                                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" : "bg-ink/[0.045] dark:bg-white/[0.07] text-ink-muted dark:text-ink-muted-dark"}`}>
                                                                <Mark />
                                                            </span>
                                                        )
                                                    }
                                                </span>

                                                <span className={`text-[11px] font-semibold leading-none ${selected && isMpesa ? "text-[#2a9438] dark:text-[#39b54a]" : selected ? "text-brand-700 dark:text-brand-300" : "text-ink dark:text-ink-dark"}`}>
                                                    {method.label}
                                                </span>
                                                <span className="text-[10px] font-medium leading-none text-ink-muted/60 dark:text-ink-muted-dark/60">
                                                    {method.timing}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CTA Button */}
                            <motion.button
                                type="button"
                                onClick={() => setPayState("phone")}
                                disabled={!amountValid}
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ y: 0, scale: 0.99 }}
                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className={`tenant-btn-premium w-full py-4 font-bold rounded-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    amountValid ? "text-white" : "bg-ink/10 dark:bg-white/10 text-ink-muted dark:text-ink-muted-dark"
                                }`}
                                style={amountValid ? { background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25), 0 4px 16px rgba(5, 150, 105, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)' } : undefined}
                            >
                                <Zap className="w-5 h-5" />
                                {displayAmount > 0 ? `Pay ${formatCurrency(displayAmount)}` : "Enter Amount"}
                                <ArrowRight className="w-4 h-4 ml-auto" />
                            </motion.button>
                        </motion.div>
                    )}

                    {payState === "phone" && (
                        <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                            <div className="mb-6">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted/65 dark:text-ink-muted-dark/65 mb-1.5">Confirm payment</p>
                                <p className="text-[2rem] font-extrabold text-ink dark:text-ink-dark tabular-nums tracking-tighter leading-none">{formatCurrency(displayAmount)}</p>
                                <p className="text-xs text-ink-muted/70 dark:text-ink-muted-dark/70 mt-2 leading-relaxed">
                                    A one-time M-Pesa prompt will be sent to your phone. Enter your PIN to confirm.
                                </p>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-2">M-Pesa number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark">
                                        <Phone className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="tel"
                                        value={effectivePhone}
                                        onChange={(e) => setMpesaPhone(e.target.value)}
                                        placeholder="0712345678"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        className="w-full pl-11 pr-4 py-3.5 bg-surface dark:bg-surface-dark border border-border/60 dark:border-border-dark/60 rounded-lg text-ink dark:text-ink-dark font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                                    />
                                </div>
                                {effectivePhone && !phoneValid && (
                                    <p className="text-xs text-danger mt-1.5 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Enter a valid M-Pesa number, e.g. 0712345678
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-[1fr_auto] gap-3">
                                <motion.button
                                    type="button"
                                    onClick={initiatePayment}
                                    disabled={!amountValid || !phoneValid}
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ y: 0, scale: 0.99 }}
                                    className={`tenant-btn-premium py-4 font-bold rounded-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                        amountValid && phoneValid ? "text-white" : "bg-ink/10 dark:bg-white/10 text-ink-muted dark:text-ink-muted-dark"
                                    }`}
                                    style={amountValid && phoneValid ? { background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25), 0 4px 16px rgba(5, 150, 105, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)' } : undefined}
                                >
                                    <Smartphone className="w-5 h-5" />
                                    Pay now
                                </motion.button>
                                <button type="button" onClick={resetPay} className="px-5 py-4 bg-ink/5 hover:bg-ink/8 dark:bg-ink/10 dark:hover:bg-ink/15 text-ink dark:text-ink-dark font-semibold rounded-lg transition-all duration-200">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {payState === "processing" && (
                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center">
                            <div className="relative w-16 h-16 mx-auto mb-5">
                                <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping" />
                                <div className="absolute inset-0 rounded-full bg-brand-500/15 dark:bg-brand-500/20" />
                                <div className="absolute inset-2 rounded-full bg-brand-600 flex items-center justify-center shadow-[0_4px_12px_rgba(var(--color-brand-rgb),0.35)]">
                                    <Loader2 className="w-5 h-5 text-white animate-spin" strokeWidth={2.5} />
                                </div>
                            </div>
                            <p className="text-sm font-bold text-ink dark:text-ink-dark tracking-tight">Sending payment request…</p>
                            <p className="text-xs font-medium text-ink-muted/70 dark:text-ink-muted-dark/70 mt-1.5">Preparing your secure M-Pesa STK push</p>
                        </motion.div>
                    )}

                    {payState === "pending" && (
                        <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="mb-5 flex items-start gap-4">
                                <div className="relative w-12 h-12 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping" />
                                    <div className="absolute inset-1.5 rounded-full bg-brand-600 flex items-center justify-center shadow-[0_3px_8px_rgba(var(--color-brand-rgb),0.3)]">
                                        <Smartphone className="w-4 h-4 text-white" strokeWidth={2.2} />
                                    </div>
                                </div>
                                <div className="min-w-0 pt-0.5">
                                    <p className="text-sm font-bold text-ink dark:text-ink-dark tracking-tight">Awaiting M-Pesa confirmation</p>
                                    <p className="text-xs font-medium text-ink-muted/70 dark:text-ink-muted-dark/70 mt-1">{payMessage}</p>
                                    {sentToPhone && (
                                        <p className="text-xs text-ink-muted/70 dark:text-ink-muted-dark/70 mt-1">
                                            Prompt sent to <span className="font-mono font-semibold text-ink dark:text-ink-dark">{sentToPhone}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-ink-subtle dark:text-ink-subtle-dark mt-2">
                                        Balance updates automatically on confirmation.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2.5">
                                <button type="button" onClick={refreshStatus} className="flex-1 py-2.5 bg-ink/[0.05] hover:bg-ink/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-ink dark:text-ink-dark text-sm font-bold rounded-xl border border-black/[0.06] dark:border-white/[0.07] transition-all duration-200">
                                    Check status
                                </button>
                                <button type="button" onClick={resetPay} className="px-4 py-2.5 text-xs font-semibold text-ink-muted/70 dark:text-ink-muted-dark/70 hover:text-ink dark:hover:text-ink-dark rounded-xl transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {payState === "error" && (
                        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3.5 p-4 bg-danger/5 border border-danger/15 rounded-xl">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                                <AlertCircle className="w-4 h-4 text-danger" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-ink dark:text-ink-dark tracking-tight">Payment could not be completed</p>
                                <p className="text-xs font-medium text-ink-muted/70 dark:text-ink-muted-dark/70 mt-1">{payMessage}</p>
                                <div className="flex gap-2.5 mt-4">
                                    <button type="button" onClick={() => setPayState("idle")} className="btn-primary btn-sm">
                                        Try again
                                    </button>
                                    <button type="button" onClick={resetPay} className="btn-outline btn-sm">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Trust Signals */}
            <div className="mt-4 pt-3.5 border-t border-brand-200/35 dark:border-brand-800/20">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    {[
                        { icon: Smartphone, label: "M-Pesa secured" },
                        { icon: Lock, label: "Bank-grade TLS" },
                        { icon: Receipt, label: "Instant receipt" },
                    ].map(({ icon: TrustIcon, label }) => (
                        <span key={label} className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-muted/55 dark:text-ink-muted-dark/55 uppercase tracking-[0.06em]">
                            <TrustIcon className="w-3 h-3 text-brand-500/70" />
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {suggestedAmount === 0 && (
                <Link
                    href="/portal/lease?setup=autopay"
                    className="mt-4 p-3 bg-brand-500/5 border border-brand-200/40 dark:border-brand-800/20 rounded-lg block hover:bg-brand-500/10 transition-colors group"
                >
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
                        <span>
                            <strong className="text-ink dark:text-ink-dark">Pro tip:</strong> Set up auto-pay to never miss a due date
                            <ArrowRight className="w-3.5 h-3.5 inline ml-1 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </p>
                </Link>
            )}
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYMENT SCORE — computed from real payment history
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PaymentScoreMetrics {
    onTimeRate: number;
    totalPayments: number;
    latePayments: number;
    currentStreakMonths: number;
}

const GRACE_DAYS = 1;

const isPaymentOnTime = (p: TenantPaymentHistoryItem): boolean => {
    const paidAt = new Date(p.occurredAt);
    const periodEnd = new Date(p.billingPeriodEnd);
    if (isNaN(paidAt.getTime()) || isNaN(periodEnd.getTime())) return true;
    const dueLimit = new Date(periodEnd);
    dueLimit.setDate(dueLimit.getDate() + GRACE_DAYS);
    return paidAt.getTime() <= dueLimit.getTime() + 86_400_000 - 1;
};

const computePaymentScore = (payments: TenantPaymentHistoryItem[]): PaymentScoreMetrics => {
    const paymentEntries = payments.filter((p) => p.type === "PAYMENT" || p.type === "DEPOSIT");
    if (paymentEntries.length === 0) {
        return { onTimeRate: 0, totalPayments: 0, latePayments: 0, currentStreakMonths: 0 };
    }
    const latePayments = paymentEntries.filter((p) => !isPaymentOnTime(p)).length;
    const onTime = paymentEntries.length - latePayments;
    const onTimeRate = Math.round((onTime / paymentEntries.length) * 100);

    const byMonth = new Map<string, { onTime: number; late: number }>();
    for (const p of paymentEntries) {
        const date = new Date(p.occurredAt);
        if (isNaN(date.getTime())) continue;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const bucket = byMonth.get(key) ?? { onTime: 0, late: 0 };
        if (isPaymentOnTime(p)) bucket.onTime += 1;
        else bucket.late += 1;
        byMonth.set(key, bucket);
    }

    const monthKeys = [...byMonth.keys()].sort();
    let currentStreakMonths = 0;
    for (let i = monthKeys.length - 1; i >= 0; i--) {
        const bucket = byMonth.get(monthKeys[i])!;
        if (bucket.late > 0) break;
        if (bucket.onTime === 0) break;
        if (i < monthKeys.length - 1) {
            const [curYear, curMonth] = monthKeys[i].split("-").map(Number);
            const [nextYear, nextMonth] = monthKeys[i + 1].split("-").map(Number);
            const gap = (nextYear - curYear) * 12 + (nextMonth - curMonth);
            if (gap !== 1) break;
        }
        currentStreakMonths += 1;
    }
    return { onTimeRate, totalPayments: paymentEntries.length, latePayments, currentStreakMonths };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW PREMIUM ADDITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Compact lease progress strip rendered at the foot of the hero card. */
const LeaseHealthBar = ({ pct, daysLeft }: { pct: number; daysLeft: number }) => {
    const daysLabel =
        daysLeft <= 0 ? "Lease ended" :
        daysLeft === 1 ? "Last day" :
        daysLeft <= 30 ? `${daysLeft} days left — expiring soon` :
        `${daysLeft} days left`;

    return (
        <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="flex items-center justify-between mb-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
                <span>Lease progress</span>
                <span className={daysLeft <= 30 && daysLeft > 0 ? "text-amber-200 font-semibold" : ""}>{daysLabel}</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.18)" }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: daysLeft <= 30 && daysLeft > 0 ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.82)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
                />
            </div>
        </div>
    );
};

/** Urgent alert strip — rendered between hero and metric grid when overdue. */
const OverdueAlertBanner = ({ amount, onPayNow }: { amount: number; onPayNow: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 bg-danger-bg dark:bg-danger-bg-dark border border-danger/20 shadow-sm"
    >
        <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                <AlertCircle className="h-4 w-4 text-danger" strokeWidth={2} />
            </div>
            <p className="text-sm text-ink dark:text-ink-dark min-w-0">
                <span className="font-bold text-danger">{formatCurrency(amount)} overdue</span>
                {" — "}paying now keeps your payment record clean.
            </p>
        </div>
        <button
            type="button"
            onClick={onPayNow}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white hover:bg-danger/90 active:scale-95 transition-all"
        >
            Pay now
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </button>
    </motion.div>
);

/** Amber warning strip — rendered when the lease expires within 30 days. */
const LeaseExpiryBanner = ({ daysLeft }: { daysLeft: number }) => (
    <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 bg-warning-bg dark:bg-warning-bg-dark border border-warning/20 shadow-sm"
    >
        <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <Calendar className="h-4 w-4 text-warning-dark dark:text-warning" strokeWidth={2} />
            </div>
            <p className="text-sm text-ink dark:text-ink-dark min-w-0">
                <span className="font-bold text-warning-dark dark:text-warning">
                    {daysLeft === 0 ? "Your lease expires today" : `Your lease expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
                </span>
                {" — "}contact your landlord to discuss renewal.
            </p>
        </div>
        <Link
            href="/portal/landlord"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-warning-dark dark:text-warning hover:bg-warning/10 active:scale-95 transition-all"
        >
            Contact landlord
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
    </motion.div>
);

/** Landlord quick-contact card rendered in the right sidebar. */
const LandlordContactCard = ({
    name,
    phone,
    email,
    logoUrl,
    verified,
}: {
    name: string;
    phone: string;
    email: string;
    logoUrl: string | null;
    verified: boolean;
}) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl p-5 bg-white/[0.92] dark:bg-surface-dark/80 border border-white/60 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ backdropFilter: "blur(16px) saturate(180%)" }}
    >
        {/* Kicker */}
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle dark:text-ink-subtle-dark">
            Your Landlord
        </p>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
            {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={logoUrl}
                    alt=""
                    aria-hidden
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/[0.07] dark:ring-white/10 shrink-0"
                />
            ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/35 dark:to-emerald-900/20 text-brand-600 dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                    <Building2 className="h-5 w-5" strokeWidth={1.75} />
                </div>
            )}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-ink dark:text-ink-dark truncate">{name}</p>
                {verified && (
                    <p className="flex items-center gap-1 text-[11px] text-success mt-0.5">
                        <BadgeCheck className="h-3 w-3" strokeWidth={2} />
                        Verified landlord
                    </p>
                )}
            </div>
        </div>

        {/* Contact actions */}
        <div className="flex gap-2">
            <a
                href={`tel:${phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/25 bg-success/8 py-2.5 text-xs font-semibold text-success-dark dark:text-success hover:bg-success/15 active:scale-95 transition-all"
            >
                <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                Call
            </a>
            <a
                href={(() => { const d = phone.replace(/\D/g, ""); return `https://wa.me/${d.startsWith("0") && d.length === 10 ? `254${d.slice(1)}` : d}`; })()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#15803d]/20 bg-[#dcfce7] dark:bg-[#14532d]/35 py-2.5 text-xs font-semibold text-[#15803d] dark:text-[#4ade80] hover:bg-[#bbf7d0] dark:hover:bg-[#14532d]/55 active:scale-95 transition-all"
            >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                WhatsApp
            </a>
        </div>

        {email && (
            <a
                href={`mailto:${email}`}
                className="mt-2 flex items-center justify-center w-full rounded-lg border border-border dark:border-border-dark bg-transparent py-2 text-xs text-ink-muted dark:text-ink-muted-dark hover:bg-ink/4 dark:hover:bg-white/5 active:scale-95 transition-all truncate"
            >
                {email}
            </a>
        )}

    </motion.div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TenantDashboardSkeleton = () => (
    <div className="space-y-6 pb-12" aria-busy="true" aria-label="Loading your dashboard">
        <div className="tenant-skeleton-hero" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl p-5 border border-border/40 dark:border-border-dark/40 space-y-3">
                    <div className="tenant-skeleton h-9 w-9 rounded-lg" />
                    <div className="tenant-skeleton h-3 w-16 rounded" />
                    <div className="tenant-skeleton h-7 w-24 rounded" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="tenant-skeleton rounded-2xl h-[26rem]" />
                <div className="space-y-3">
                    <div className="tenant-skeleton h-6 w-32 rounded" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="tenant-skeleton h-[4.5rem] rounded-xl" />
                    ))}
                </div>
            </div>
            <div className="space-y-5">
                <div className="tenant-skeleton rounded-2xl h-64" />
                <div className="tenant-skeleton rounded-2xl h-36" />
                <div className="tenant-skeleton rounded-2xl h-48" />
            </div>
        </div>
    </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN DASHBOARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const HISTORY_FETCH_SIZE = 100;

export const PremiumTenantDashboard = () => {
    const { data: dashboard, isLoading, error } = useTenantDashboardQuery();
    const { data: historyData } = useTenantPaymentHistoryQuery(0, HISTORY_FETCH_SIZE);
    const { data: summary } = useTenantPaymentSummaryQuery();
    const { data: lease } = useTenantLeaseQuery();
    const router = useRouter();

    const score = useMemo(() => computePaymentScore(historyData?.content ?? []), [historyData]);
    const scoreIsWindowed = (historyData?.totalElements ?? 0) > HISTORY_FETCH_SIZE;

    // Lease progress bar — how far through the lease term is the renter?
    const leaseProgress = useMemo(() => {
        if (!lease?.startDate || !lease?.endDate) return null;
        const start = new Date(lease.startDate).getTime();
        const end = new Date(lease.endDate).getTime();
        const now = new Date().getTime();
        const total = end - start;
        if (total <= 0) return null;
        const elapsed = Math.max(0, now - start);
        const pct = Math.min(100, Math.round((elapsed / total) * 100));
        const daysLeft = Math.max(0, Math.round((end - now) / 86_400_000));
        return { pct, daysLeft };
    }, [lease]);

    // Score tier label — human-readable band for the on-time rate ring.
    const scoreTier = useMemo(() => {
        if (score.totalPayments === 0) return null;
        if (score.onTimeRate >= 90) return { label: "Excellent", cls: "text-success" };
        if (score.onTimeRate >= 75) return { label: "Good standing", cls: "text-brand-600 dark:text-brand-400" };
        if (score.onTimeRate >= 60) return { label: "Fair", cls: "text-warning-dark dark:text-warning" };
        return { label: "Needs attention", cls: "text-danger" };
    }, [score]);

    if (isLoading) return <TenantDashboardSkeleton />;

    if (error || !dashboard) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 max-w-md">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto" />
                    <h3 className="text-lg font-semibold text-ink dark:text-ink-dark">Unable to load dashboard</h3>
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                        We encountered an error while loading your dashboard. Please refresh the page or try again later.
                    </p>
                    <button onClick={() => router.refresh()} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors">
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    const { tenantName, tenantPhone, unitNumber, propertyName, nextDueDate, recentPayments, leaseStatus } = dashboard;
    const currentBalance = toMoneyNumber(dashboard.currentBalance);
    const overdueAmount = toMoneyNumber(dashboard.overdueAmount);
    const nextDueAmount = toMoneyNumber(dashboard.nextDueAmount);
    const monthlyRent = toMoneyNumber(dashboard.monthlyRent);
    const totalPaid = summary?.totalPaid;

    const activity = recentPayments.length > 0 ? recentPayments : (historyData?.content ?? []).slice(0, 5);

    // Alert states
    const leaseExpiresIn = leaseProgress?.daysLeft ?? null;
    const showExpiryAlert = leaseExpiresIn !== null && leaseExpiresIn <= 30 && leaseStatus === "ACTIVE";

    const scrollToPayment = () => {
        document.getElementById("payment")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="space-y-6 pb-12">
            {/* ── Hero ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-2xl p-8 shadow-elevated"
                style={{
                    background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 12s ease infinite',
                }}
            >
                {/* Property photo backdrop — visible only when a primary photo has been set.
                    The green gradient overlay maintains full readability regardless of photo content. */}
                {lease?.propertyThumbnailUrl && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={lease.propertyThumbnailUrl}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        {/* Brand-green wash — heavy left (where text lives), lighter right (lets photo breathe) */}
                        <div
                            aria-hidden
                            className="absolute inset-0"
                            style={{
                                background:
                                    'linear-gradient(105deg, rgba(4,120,87,0.94) 0%, rgba(5,150,105,0.87) 48%, rgba(16,185,129,0.72) 100%)',
                            }}
                        />
                    </>
                )}

                {/* Ambient orbs */}
                <div className="absolute pointer-events-none" style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', top: '-20%', right: '-10%', filter: 'blur(60px)', animation: 'float-slow 20s ease-in-out infinite' }} />
                <div className="absolute pointer-events-none" style={{ width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', bottom: '-10%', left: '-5%', filter: 'blur(50px)', animation: 'float-slow 25s ease-in-out infinite reverse' }} />

                <div className="relative z-10">
                    {/* Top row: property chip + lease status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-start justify-between mb-6 gap-4 flex-wrap"
                    >
                        <div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 rounded-full text-sm font-medium"
                                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.95)' }}
                            >
                                {lease?.propertyThumbnailUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={lease.propertyThumbnailUrl}
                                        alt=""
                                        aria-hidden
                                        className="w-[18px] h-[18px] rounded-[4px] object-cover ring-1 shrink-0"
                                        style={{ boxShadow: '0 0 0 1.5px rgba(255,255,255,0.30)' }}
                                    />
                                ) : (
                                    <Home className="w-4 h-4" />
                                )}
                                Unit {unitNumber} · {propertyName}
                            </motion.p>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="text-white font-bold"
                                style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', letterSpacing: '-0.03em', lineHeight: '1.1', textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
                            >
                                Welcome back, {tenantName.split(" ")[0]}
                            </motion.h1>
                        </div>
                        <StatusBadge status={leaseStatus} onBrand />
                    </motion.div>

                    {/* Balance display */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-6"
                    >
                        <p className="text-sm font-medium uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Account Balance
                        </p>
                        <div className="flex items-baseline gap-4 flex-wrap">
                            <motion.p
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="text-white font-extrabold tabular-nums"
                                style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: '1', textShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
                            >
                                {formatCurrency(currentBalance)}
                            </motion.p>
                            {currentBalance === 0 && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
                                    className="inline-flex items-center gap-1.5"
                                    style={{ color: 'rgba(255,255,255,0.95)' }}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-semibold">All clear</span>
                                </motion.span>
                            )}
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="mt-2 text-sm"
                            style={{ color: 'rgba(255,255,255,0.85)' }}
                        >
                            {currentBalance > 0
                                ? overdueAmount > 0
                                    ? `${formatCurrency(overdueAmount)} overdue — payment required`
                                    : dueSummary(nextDueDate)
                                : nextDueDate
                                  ? `No balance due · Next rent ${dueSummary(nextDueDate).toLowerCase()}`
                                  : "No balance due · Account settled"}
                        </motion.p>
                    </motion.div>

                    {/* Quick actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-wrap gap-3"
                    >
                        <QuickAction icon={Wallet} label="Make Payment" href="#payment" variant="primary" />
                        <QuickAction icon={FileText} label="View Lease" href="/portal/lease" variant="outline" />
                        <QuickAction icon={Wrench} label="Maintenance" href="/portal/maintenance" variant="outline" />
                    </motion.div>

                    {/* Lease progress bar */}
                    {leaseProgress && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                        >
                            <LeaseHealthBar pct={leaseProgress.pct} daysLeft={leaseProgress.daysLeft} />
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* ── Alert Banners ──────────────────────────────────── */}
            {overdueAmount > 0 && (
                <OverdueAlertBanner amount={overdueAmount} onPayNow={scrollToPayment} />
            )}
            {showExpiryAlert && leaseExpiresIn !== null && (
                <LeaseExpiryBanner daysLeft={leaseExpiresIn} />
            )}

            {/* ── Metric Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={AlertCircle}
                    label="Overdue"
                    value={formatCurrency(overdueAmount)}
                    hint={overdueAmount === 0 ? "Nothing outstanding" : "Immediate payment required"}
                    tone={overdueAmount > 0 ? "danger" : "success"}
                    loading={isLoading}
                />
                <MetricCard
                    icon={Calendar}
                    label="Next Due"
                    value={nextDueDate ? dueSummary(nextDueDate) : "Not scheduled"}
                    hint={
                        nextDueDate
                            ? [nextDueAmount > 0 ? formatCurrency(nextDueAmount) : null, formatDate(nextDueDate)]
                                  .filter(Boolean)
                                  .join(" · ")
                            : undefined
                    }
                    tone={nextDueDate && daysUntil(nextDueDate) <= 7 ? "warning" : "neutral"}
                    loading={isLoading}
                />
                <MetricCard
                    icon={Home}
                    label="Monthly Rent"
                    value={formatCurrency(monthlyRent)}
                    hint="Recurring lease charge"
                    tone="brand"
                    loading={isLoading}
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Total Paid"
                    value={totalPaid == null ? "—" : formatCurrency(totalPaid)}
                    hint={
                        summary?.paymentsThisYear != null && summary.paymentsThisYear > 0
                            ? `${summary.paymentsThisYear} payment${summary.paymentsThisYear === 1 ? "" : "s"} this year`
                            : "All time"
                    }
                    tone="success"
                    loading={isLoading}
                />
            </div>

            {/* ── Main content grid ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Payment widget + activity feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div id="payment">
                        <PaymentWidget
                            currentBalance={currentBalance}
                            nextDueAmount={nextDueAmount}
                            overdueAmount={overdueAmount}
                            monthlyRent={monthlyRent}
                            tenantPhone={tenantPhone}
                            leaseStatus={leaseStatus}
                        />
                    </div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted/60 dark:text-ink-muted-dark/60 mb-0.5">Ledger</p>
                                <h2 className="text-base font-bold text-ink dark:text-ink-dark tracking-tight">Recent Activity</h2>
                            </div>
                            <Link href="/portal/payments" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/25 dark:hover:bg-brand-900/40 border border-brand-200/60 dark:border-brand-700/30 transition-all duration-200 group">
                                View all
                                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {activity.length === 0 ? (
                            <div className="bg-white dark:bg-[#111112] rounded-2xl border border-black/[0.055] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] p-10 text-center">
                                <div className="w-11 h-11 mx-auto mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/12 to-brand-300/5 ring-1 ring-inset ring-brand-500/10">
                                    <Receipt className="w-5 h-5 text-brand-600 dark:text-brand-400" strokeWidth={2} />
                                </div>
                                <p className="text-sm font-semibold text-ink dark:text-ink-dark">No activity yet</p>
                                <p className="text-xs font-medium text-ink-muted/65 dark:text-ink-muted-dark/65 mt-1.5 max-w-[22ch] mx-auto leading-relaxed">
                                    Rent charges and payments will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#111112] rounded-2xl border border-black/[0.055] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] overflow-hidden divide-y divide-black/[0.042] dark:divide-white/[0.05]">
                                {activity.slice(0, 5).map((payment, index) => (
                                    <TransactionItem
                                        key={payment.id}
                                        index={index}
                                        type={payment.type}
                                        amount={payment.amount}
                                        occurredAt={payment.occurredAt}
                                        status={payment.status}
                                        mpesaRef={payment.mpesaTransactionId}
                                        billingPeriod={
                                            payment.billingPeriodStart && payment.billingPeriodEnd
                                                ? `${formatDate(payment.billingPeriodStart)} – ${formatDate(payment.billingPeriodEnd)}`
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Right: Score + Landlord contact + Quick links */}
                <div className="space-y-5">
                    {/* Payment Score */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="tenant-score-card p-6"
                    >
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-ink dark:text-ink-dark flex items-center gap-2">
                                <BadgeCheck className="w-[18px] h-[18px] text-brand-600" strokeWidth={2} />
                                Payment Score
                            </h3>
                            {score.totalPayments > 0 && (
                                <p className="mt-0.5 text-[11px] text-ink-subtle dark:text-ink-subtle-dark">
                                    {scoreIsWindowed
                                        ? `Based on your last ${HISTORY_FETCH_SIZE} payments`
                                        : "Based on your full payment history"}
                                </p>
                            )}
                        </div>

                        {score.totalPayments === 0 ? (
                            <div className="py-2 text-center">
                                <div className="relative mx-auto mb-4 h-24 w-24">
                                    <svg className="h-24 w-24 -rotate-90" aria-hidden="true">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="7" fill="none" strokeDasharray="4 9" strokeLinecap="round" className="text-ink/12 dark:text-white/15" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BadgeCheck className="h-8 w-8 text-ink/20 dark:text-white/25" strokeWidth={1.75} />
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-ink dark:text-ink-dark">Your record starts here</p>
                                <p className="mx-auto mt-1.5 max-w-[15rem] text-xs leading-relaxed text-ink-muted dark:text-ink-muted-dark">
                                    Once you pay rent through the portal, every payment is recorded here with a receipt you can download any time.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Score ring */}
                                <div className="flex items-center justify-center mb-4">
                                    <div className="relative w-32 h-32">
                                        <svg className="tenant-score-ring transform -rotate-90 w-32 h-32">
                                            <defs>
                                                <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#10B981" />
                                                    <stop offset="100%" stopColor="#059669" />
                                                </linearGradient>
                                            </defs>
                                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-ink/5 dark:text-ink/10" />
                                            <circle
                                                cx="64" cy="64" r="56"
                                                stroke="url(#score-gradient)"
                                                strokeWidth="8" fill="none"
                                                strokeDasharray={`${2 * Math.PI * 56}`}
                                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score.onTimeRate / 100)}`}
                                                className="transition-all duration-1000"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                                            <span className="text-[2.1rem] font-extrabold text-ink dark:text-ink-dark tracking-tighter tabular-nums leading-none">{score.onTimeRate}%</span>
                                            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted/70 dark:text-ink-muted-dark/70">On-time</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Score stats */}
                                <div className="rounded-xl overflow-hidden border border-black/[0.05] dark:border-white/[0.06]">
                                    {[
                                        { label: "Total Payments", value: String(score.totalPayments), tone: "default" },
                                        { label: "Late Payments", value: String(score.latePayments), tone: score.latePayments > 0 ? "danger" : "success" },
                                        { label: "Current Streak", value: `${score.currentStreakMonths} month${score.currentStreakMonths === 1 ? "" : "s"}`, tone: "brand", streak: true },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + i * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className={`flex items-center justify-between px-3.5 py-2.5 ${i < 2 ? "border-b border-black/[0.045] dark:border-white/[0.05]" : ""} bg-white/50 dark:bg-white/[0.02]`}
                                        >
                                            <span className="text-xs font-medium text-ink-muted dark:text-ink-muted-dark">{stat.label}</span>
                                            <span className={`text-xs font-bold flex items-center gap-1 ${stat.tone === "danger" ? "text-danger" : stat.tone === "success" ? "text-success" : stat.tone === "brand" ? "text-brand-600 dark:text-brand-400" : "text-ink dark:text-ink-dark"}`}>
                                                {stat.streak && <Zap className="w-3 h-3" />}
                                                {stat.value}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Tier label */}
                                {scoreTier && (
                                    <div className="mt-3 flex items-center justify-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                            scoreTier.cls === "text-success"
                                                ? "bg-success/8 border-success/20 text-success"
                                                : scoreTier.cls === "text-brand-600 dark:text-brand-400"
                                                    ? "bg-brand-50 dark:bg-brand-900/25 border-brand-200 dark:border-brand-700/40 text-brand-700 dark:text-brand-300"
                                                    : scoreTier.cls === "text-warning-dark dark:text-warning"
                                                        ? "bg-warning/8 border-warning/20 text-warning-dark dark:text-warning"
                                                        : "bg-danger/8 border-danger/20 text-danger"
                                        }`}>
                                            <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
                                            {scoreTier.label} record
                                        </span>
                                    </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                                    <p className="text-[10px] font-medium text-ink-muted/60 dark:text-ink-muted-dark/60 text-center leading-relaxed">
                                        {score.latePayments === 0
                                            ? "A clean payment history helps you secure better rentals in the future."
                                            : "On-time payments strengthen the record you can show future landlords."}
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Landlord Contact Card */}
                    {lease && lease.landlordPhone && (
                        <LandlordContactCard
                            name={lease.landlordName}
                            phone={lease.landlordPhone}
                            email={lease.landlordEmail}
                            logoUrl={lease.landlordLogoUrl}
                            verified={lease.landlordVerified}
                        />
                    )}

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="tenant-quicklinks-card p-6"
                    >
                        <h3 className="text-base font-semibold text-ink dark:text-ink-dark mb-3">Quick Links</h3>
                        <div className="space-y-1">
                            {[
                                { icon: Receipt,  label: "Payment History",     href: "/portal/payments",     iconCls: "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" },
                                { icon: FileText, label: "Lease Agreement",     href: "/portal/lease",        iconCls: "bg-sky-50 dark:bg-sky-900/25 text-sky-600 dark:text-sky-400" },
                                { icon: Wrench,   label: "Submit Maintenance",  href: "/portal/maintenance",  iconCls: "bg-amber-50 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400" },
                                { icon: Home,     label: "Landlord Contact",    href: "/portal/landlord",     iconCls: "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-600 dark:text-emerald-400" },
                            ].map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="tenant-quick-link-item flex items-center justify-between p-3 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${link.iconCls}`}>
                                            <link.icon className="tenant-qk-icon w-3.5 h-3.5" strokeWidth={2} />
                                        </div>
                                        <span className="text-sm font-medium text-ink dark:text-ink-dark">{link.label}</span>
                                    </div>
                                    <ArrowRight className="tenant-qk-arrow w-4 h-4 text-ink-subtle dark:text-ink-subtle-dark" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

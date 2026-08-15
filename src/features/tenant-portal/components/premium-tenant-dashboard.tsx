// components/premium-tenant-dashboard.tsx
"use client";

import { useTenantDashboardQuery, useTenantPaymentHistoryQuery } from "../hooks/use-tenant-portal-queries";
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
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    Home,
    Loader2,
    Lock,
    Phone,
    Receipt,
    ShieldCheck,
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: Math.abs(amount) < 1 ? 2 : 0,
    }).format(amount);

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

const StatusBadge = ({ status, className = "" }: { status: string; className?: string }) => {
    const tone = statusTone(status);
    const colorClasses = {
        success: "bg-success/10 text-success dark:bg-success/15 border-success/20",
        danger: "bg-danger/10 text-danger dark:bg-danger/15 border-danger/20",
        warning: "bg-warning/10 text-warning dark:bg-warning/15 border-warning/20",
        neutral: "bg-ink/5 text-ink-muted dark:bg-ink/10 border-ink/10",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[tone]} ${className}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-ink-muted"}`} />
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="group relative bg-surface dark:bg-surface-dark border border-border/60 dark:border-border-dark/60 rounded-xl p-5 hover:border-brand-200 dark:hover:border-brand-700/50 hover:shadow-card-hover transition-all duration-300"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-ink/5 dark:bg-ink/10 ${toneClasses[tone]} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="w-4 h-4" />
                </div>
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
                    <div className="h-8 w-24 bg-ink/5 dark:bg-ink/10 animate-pulse rounded" />
                ) : (
                    <p className="text-2xl font-semibold text-ink dark:text-ink-dark">{value}</p>
                )}
                {hint && <p className="text-xs text-ink-subtle dark:text-ink-subtle-dark">{hint}</p>}
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
        primary:
            "bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-button hover:shadow-elevated",
        secondary:
            "bg-ink/5 text-ink hover:bg-ink/8 dark:bg-ink/10 dark:text-ink-dark dark:hover:bg-ink/15",
        outline:
            "bg-transparent text-ink border border-border dark:text-ink-dark dark:border-border-dark hover:bg-ink/5 dark:hover:bg-ink/10",
    };

    return (
        <Link
            href={href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${variantClasses[variant]}`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </Link>
    );
};

// Real, null-safe transaction row with receipt navigation.
interface TransactionItemProps {
    type: string;
    amount: number;
    occurredAt: string;
    status?: string;
    mpesaRef?: string | null;
    billingPeriod?: string;
}

const TransactionItem = ({ type, amount, occurredAt, status, mpesaRef, billingPeriod }: TransactionItemProps) => {
    const isCredit = type === "PAYMENT" || type === "REFUND";
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-4 bg-surface dark:bg-surface-dark border border-border/40 dark:border-border-dark/40 rounded-lg hover:border-brand-200 dark:hover:border-brand-700/50 hover:shadow-sm transition-all duration-200 group"
        >
            <div className="flex items-start gap-4 min-w-0">
                <div className={`p-2.5 rounded-lg shrink-0 ${isCredit ? "bg-success/10 text-success" : "bg-ink/5 text-ink-muted dark:bg-ink/10"}`}>
                    {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ink dark:text-ink-dark">{typeLabels[type] || titleCaseStatus(type)}</p>
                        {status && <StatusBadge status={status} />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-subtle dark:text-ink-subtle-dark">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDateTime(occurredAt)}</span>
                        {mpesaRef && (
                            <>
                                <span className="text-ink/20">•</span>
                                <span className="font-mono truncate">{mpesaRef}</span>
                            </>
                        )}
                    </div>
                    {billingPeriod && <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{billingPeriod}</p>}
                </div>
            </div>

            <p className={`text-sm font-semibold tabular-nums shrink-0 ${isCredit ? "text-success" : "text-ink dark:text-ink-dark"}`}>
                {isCredit ? "+" : "-"}
                {formatCurrency(Math.abs(amount))}
            </p>
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYMENT WIDGET (HIGH CONVERSION — FULLY WIRED)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type PayState = "idle" | "phone" | "processing" | "pending" | "error";

const PAY_POLL_INTERVAL_MS = 5000;

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
                const done = await checkStatus(result.id);
                if (!done) {
                    polls += 1;
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
        { id: "mpesa" as const, label: "M-Pesa", icon: Smartphone, timing: "Instant", popular: true },
        { id: "bank" as const, label: "Bank Transfer", icon: CreditCard, timing: "1-2 days", popular: false, comingSoon: true },
        { id: "card" as const, label: "Card", icon: Wallet, timing: "Instant", popular: false, comingSoon: true },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/20 dark:to-brand-900/10 border border-brand-200/60 dark:border-brand-800/40 rounded-2xl p-6 shadow-card"
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
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* Balance Due */}
                            <div className="mb-6">
                                <p className="text-xs text-ink-muted dark:text-ink-muted-dark font-medium uppercase tracking-wider mb-2">
                                    {overdueAmount > 0 ? "Overdue Amount" : currentBalance > 0 ? "Balance Due" : "Advance Payment"}
                                </p>
                                <p className="text-4xl font-bold text-ink dark:text-ink-dark tabular-nums">
                                    {formatCurrency(suggestedAmount || 0)}
                                </p>
                                {currentBalance === 0 && (
                                    <p className="text-sm text-success mt-2 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" />
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
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-muted-dark font-medium">
                                        KSh
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        inputMode="numeric"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        placeholder={suggestedAmount > 0 ? suggestedAmount.toString() : "0"}
                                        className="w-full pl-16 pr-4 py-3.5 bg-surface dark:bg-surface-dark border border-border/60 dark:border-border-dark/60 rounded-lg text-ink dark:text-ink-dark text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                                    />
                                </div>

                                {quickAmounts.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {quickAmounts.map((amount) => (
                                            <button
                                                key={amount}
                                                type="button"
                                                onClick={() => setCustomAmount(String(amount))}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                                                    customAmount === String(amount)
                                                        ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                                        : "border-border dark:border-border-dark text-ink-muted dark:text-ink-muted-dark hover:border-brand-300 dark:hover:border-brand-700 hover:text-ink dark:hover:text-ink-dark"
                                                }`}
                                            >
                                                {formatCurrency(amount)}
                                            </button>
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
                                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-3">Payment Method</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map((method) => {
                                        const selected = selectedMethod === method.id;
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => !method.comingSoon && setSelectedMethod(method.id)}
                                                disabled={method.comingSoon}
                                                title={method.comingSoon ? "Coming soon" : undefined}
                                                className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                                                    selected
                                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                                                        : "border-border/40 dark:border-border-dark/40 hover:border-brand-200 dark:hover:border-brand-800"
                                                } ${method.comingSoon ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                {method.popular && (
                                                    <span className="absolute -top-2 -right-2 bg-success text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                        POPULAR
                                                    </span>
                                                )}
                                                {method.comingSoon && (
                                                    <span className="absolute -top-2 -left-2 bg-ink/10 dark:bg-ink/20 text-ink-muted dark:text-ink-muted-dark text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                        SOON
                                                    </span>
                                                )}
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <method.icon className="w-5 h-5 text-ink dark:text-ink-dark" />
                                                    <span className="text-xs font-medium text-ink dark:text-ink-dark">{method.label}</span>
                                                    <span className="text-[10px] text-ink-subtle dark:text-ink-subtle-dark">{method.timing}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                type="button"
                                onClick={() => setPayState("phone")}
                                disabled={!amountValid}
                                className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-ink/10 disabled:text-ink-muted dark:disabled:bg-ink/10 text-white font-semibold rounded-lg shadow-button hover:shadow-elevated hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5" />
                                {displayAmount > 0 ? `Pay ${formatCurrency(displayAmount)}` : "Enter Amount"}
                                <ArrowRight className="w-4 h-4 ml-auto" />
                            </button>
                        </motion.div>
                    )}

                    {payState === "phone" && (
                        <motion.div
                            key="phone"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className="mb-6">
                                <p className="text-xs text-ink-muted dark:text-ink-muted-dark font-medium uppercase tracking-wider mb-2">
                                    Confirm payment
                                </p>
                                <p className="text-3xl font-bold text-ink dark:text-ink-dark tabular-nums">
                                    {formatCurrency(displayAmount)}
                                </p>
                                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1.5">
                                    A one-time M-Pesa prompt will be sent to your phone. Enter your PIN to confirm.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-2">
                                    M-Pesa number
                                </label>
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
                                <button
                                    type="button"
                                    onClick={initiatePayment}
                                    disabled={!amountValid || !phoneValid}
                                    className="py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-ink/10 disabled:text-ink-muted dark:disabled:bg-ink/10 text-white font-semibold rounded-lg shadow-button hover:shadow-elevated hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    <Smartphone className="w-5 h-5" />
                                    Pay now
                                </button>
                                <button
                                    type="button"
                                    onClick={resetPay}
                                    className="px-5 py-4 bg-ink/5 hover:bg-ink/8 dark:bg-ink/10 dark:hover:bg-ink/15 text-ink dark:text-ink-dark font-semibold rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {payState === "processing" && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-10 text-center"
                        >
                            <div className="relative w-16 h-16 mx-auto mb-5">
                                <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping" />
                                <div className="absolute inset-0 rounded-full bg-brand-500/20" />
                                <div className="absolute inset-2.5 rounded-full bg-brand-600 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-white animate-spin" strokeWidth={2.5} />
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-ink dark:text-ink-dark">Sending payment request…</p>
                            <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
                                Preparing your secure M-Pesa STK push
                            </p>
                        </motion.div>
                    )}

                    {payState === "pending" && (
                        <motion.div
                            key="pending"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="mb-6 flex items-start gap-4">
                                <div className="relative w-14 h-14 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping" />
                                    <div className="absolute inset-2.5 rounded-full bg-brand-600 flex items-center justify-center">
                                        <Smartphone className="w-5 h-5 text-white" strokeWidth={2.2} />
                                    </div>
                                </div>
                                <div className="min-w-0 pt-1">
                                    <p className="text-sm font-semibold text-ink dark:text-ink-dark">Awaiting M-Pesa confirmation</p>
                                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">{payMessage}</p>
                                    {sentToPhone && (
                                        <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
                                            Prompt sent to <span className="font-mono font-semibold text-ink dark:text-ink-dark">{sentToPhone}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-ink-subtle dark:text-ink-subtle-dark mt-2">
                                        Your balance updates automatically once the payment is confirmed.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={refreshStatus}
                                    className="flex-1 py-3 bg-ink/5 hover:bg-ink/8 dark:bg-ink/10 dark:hover:bg-ink/15 text-ink dark:text-ink-dark font-semibold rounded-lg transition-all duration-200"
                                >
                                    Check status
                                </button>
                                <button
                                    type="button"
                                    onClick={resetPay}
                                    className="px-5 py-3 text-sm font-medium text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {payState === "error" && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-start gap-4 p-4 bg-danger/5 border border-danger/20 rounded-lg"
                        >
                            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-ink dark:text-ink-dark">Payment could not be completed</p>
                                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">{payMessage}</p>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setPayState("idle")}
                                        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        Try again
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetPay}
                                        className="px-4 py-2.5 text-sm font-medium text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark rounded-lg transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Trust Signals */}
            <div className="mt-4 pt-4 border-t border-brand-200/40 dark:border-brand-800/20">
                <div className="flex items-center justify-center gap-6 text-xs text-ink-subtle dark:text-ink-subtle-dark">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>256-bit SSL</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>PCI Compliant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Encrypted</span>
                    </div>
                </div>
            </div>

            {/* Auto-pay Nudge */}
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

    // Streak: walk consecutive months (ending at the most recent payment's month)
    // and count months that have at least one on-time payment and no late payment.
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
        // months must be consecutive
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
// MAIN DASHBOARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const HISTORY_FETCH_SIZE = 100;

export const PremiumTenantDashboard = () => {
    const { data: dashboard, isLoading, error } = useTenantDashboardQuery();
    const { data: historyData } = useTenantPaymentHistoryQuery(0, HISTORY_FETCH_SIZE);
    const router = useRouter();

    const score = useMemo(() => computePaymentScore(historyData?.content ?? []), [historyData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !dashboard) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 max-w-md">
                    <AlertCircle className="w-12 h-12 text-danger mx-auto" />
                    <h3 className="text-lg font-semibold text-ink dark:text-ink-dark">Unable to load dashboard</h3>
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                        We encountered an error while loading your dashboard. Please refresh the page or try again later.
                    </p>
                    <button
                        onClick={() => router.refresh()}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    const { tenantName, tenantPhone, unitNumber, propertyName, currentBalance, overdueAmount, nextDueAmount, nextDueDate, monthlyRent, recentPayments, leaseStatus } = dashboard;

    // Real "total paid this year" from the full history
    const totalPaidThisYear = (historyData?.content ?? [])
        .filter((p) => p.type === "PAYMENT" && new Date(p.occurredAt).getFullYear() === new Date().getFullYear())
        .reduce((sum, p) => sum + Math.abs(p.amount), 0);

    const activity = recentPayments.length > 0 ? recentPayments : (historyData?.content ?? []).slice(0, 5);

    return (
        <div className="space-y-8 pb-12">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-brand-600 to-brand-700 dark:from-brand-700 dark:to-brand-900 text-white rounded-2xl p-8 shadow-elevated relative overflow-hidden"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="relative">
                    <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                        <div>
                            <p className="text-brand-100 text-sm font-medium mb-1 flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Unit {unitNumber} · {propertyName}
                            </p>
                            <h1 className="text-3xl font-bold">Welcome back, {tenantName.split(" ")[0]}</h1>
                        </div>
                        <StatusBadge status={leaseStatus} className="bg-white/10 border-white/20 text-white" />
                    </div>

                    <div className="space-y-2 mb-6">
                        <p className="text-brand-100 text-sm font-medium uppercase tracking-wider">Account Balance</p>
                        <div className="flex items-baseline gap-4 flex-wrap">
                            <p className="text-5xl font-bold tabular-nums">{formatCurrency(currentBalance)}</p>
                            {currentBalance === 0 && (
                                <div className="flex items-center gap-1.5 text-brand-100">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">All clear</span>
                                </div>
                            )}
                        </div>
                        <p className="text-brand-100">
                            {currentBalance > 0
                                ? overdueAmount > 0
                                    ? `${formatCurrency(overdueAmount)} overdue • Payment required`
                                    : dueSummary(nextDueDate)
                                : "No balance due • Account settled"}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3">
                        <QuickAction icon={Wallet} label="Make Payment" href="#payment" variant="primary" />
                        <QuickAction icon={FileText} label="View Lease" href="/portal/lease" variant="outline" />
                        <QuickAction icon={Wrench} label="Maintenance" href="/portal/maintenance" variant="outline" />
                    </div>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={AlertCircle}
                    label="Overdue"
                    value={overdueAmount > 0 ? formatCurrency(overdueAmount) : "Ksh 0"}
                    hint={overdueAmount === 0 ? "No arrears" : "Immediate payment required"}
                    tone={overdueAmount > 0 ? "danger" : "success"}
                    loading={isLoading}
                />
                <MetricCard
                    icon={Calendar}
                    label="Next Due"
                    value={nextDueDate ? dueSummary(nextDueDate) : "Not scheduled"}
                    hint={nextDueAmount > 0 ? formatCurrency(nextDueAmount) : "-"}
                    tone={nextDueDate ? "warning" : "neutral"}
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
                    value={formatCurrency(totalPaidThisYear)}
                    hint="This year"
                    tone="success"
                    trend={score.totalPayments > 0 ? { value: score.onTimeRate, direction: "up" } : undefined}
                    loading={isLoading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Payment Widget + Analytics */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Payment Widget */}
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

                    {/* Recent Payments */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-ink dark:text-ink-dark">Recent Activity</h2>
                            <Link
                                href="/portal/payments"
                                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 group"
                            >
                                View all
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {activity.length === 0 ? (
                            <div className="bg-surface dark:bg-surface-dark border border-border/40 dark:border-border-dark/40 rounded-xl p-10 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-ink/5 dark:bg-ink/10 flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-ink-muted dark:text-ink-muted-dark" />
                                </div>
                                <p className="text-sm font-medium text-ink dark:text-ink-dark">No activity yet</p>
                                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1 max-w-xs mx-auto">
                                    Your ledger will populate here as soon as rent charges and payments are recorded.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activity.slice(0, 5).map((payment) => (
                                    <TransactionItem
                                        key={payment.id}
                                        type={payment.type}
                                        amount={payment.amount}
                                        occurredAt={payment.occurredAt}
                                        status={payment.status}
                                        mpesaRef={payment.mpesaTransactionId}
                                        billingPeriod={
                                            payment.billingPeriodStart && payment.billingPeriodEnd
                                                ? `${formatDate(payment.billingPeriodStart)} - ${formatDate(payment.billingPeriodEnd)}`
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Right Column: Insights & Actions */}
                <div className="space-y-6">
                    {/* Payment Score */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="bg-surface dark:bg-surface-dark border border-border/60 dark:border-border-dark/60 rounded-xl p-6 shadow-card"
                    >
                        <h3 className="text-lg font-semibold text-ink dark:text-ink-dark mb-4 flex items-center gap-2">
                            <BadgeCheck className="w-5 h-5 text-brand-600" />
                            Payment Score
                        </h3>

                        <div className="flex items-center justify-center mb-4">
                            <div className="relative w-32 h-32">
                                <svg className="transform -rotate-90 w-32 h-32">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-ink/5 dark:text-ink/10"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 56}`}
                                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - score.onTimeRate / 100)}`}
                                        className="text-success transition-all duration-1000"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-ink dark:text-ink-dark">{score.onTimeRate}%</span>
                                    <span className="text-xs text-ink-muted dark:text-ink-muted-dark">On-time</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ink-muted dark:text-ink-muted-dark">Total Payments</span>
                                <span className="font-medium text-ink dark:text-ink-dark">{score.totalPayments}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ink-muted dark:text-ink-muted-dark">Late Payments</span>
                                <span className={`font-medium ${score.latePayments > 0 ? "text-danger" : "text-success"}`}>{score.latePayments}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ink-muted dark:text-ink-muted-dark">Current Streak</span>
                                <span className="font-medium text-brand-600 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5" />
                                    {score.currentStreakMonths} month{score.currentStreakMonths === 1 ? "" : "s"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border/40 dark:border-border-dark/40">
                            <p className="text-xs text-ink-subtle dark:text-ink-subtle-dark text-center">
                                Keep it up! Perfect payment history helps you secure better rentals in the future.
                            </p>
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        className="bg-surface dark:bg-surface-dark border border-border/60 dark:border-border-dark/60 rounded-xl p-6 shadow-card"
                    >
                        <h3 className="text-lg font-semibold text-ink dark:text-ink-dark mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            {[
                                { icon: Receipt, label: "Payment History", href: "/portal/payments" },
                                { icon: FileText, label: "Lease Agreement", href: "/portal/lease" },
                                { icon: Wrench, label: "Submit Maintenance Request", href: "/portal/maintenance" },
                                { icon: Home, label: "Landlord Contact", href: "/portal/landlord" },
                            ].map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-ink/5 dark:hover:bg-ink/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <link.icon className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark" />
                                        <span className="text-sm font-medium text-ink dark:text-ink-dark">{link.label}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-ink-subtle dark:text-ink-subtle-dark group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

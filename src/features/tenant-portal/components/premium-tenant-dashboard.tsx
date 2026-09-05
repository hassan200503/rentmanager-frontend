// components/premium-tenant-dashboard.tsx
"use client";

import {
    useTenantDashboardQuery,
    useTenantPaymentHistoryQuery,
    useTenantPaymentSummaryQuery,
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
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Home,
    Loader2,
    Lock,
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
import { MpesaMark, BankMark, CardMark } from "./payment-brand-marks";

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

    // For the hero, which sits on a fixed brand-green gradient in both
    // themes: a monochrome white pill, no tone color at all — including the
    // dot, previously hardcoded to the tone color regardless of context. The
    // caller used to pass tone-colored classes as an override string
    // concatenated after colorClasses[tone] in the same className; several
    // of those utilities target the same CSS property (bg-success/10 vs.
    // bg-white/10, text-success vs. text-white), so which one actually won
    // depended on Tailwind's internal stylesheet ordering, not source order —
    // an unpredictable way to guarantee legible white text on a green hero.
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
                y: -4,
                transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            // Glass card: was a hardcoded rgba(255,255,255,...) inline style with
            // no dark-mode counterpart, so it rendered a near-white pane on a dark
            // page — the four cards a renter sees first, wrong in the one theme
            // that should look most "premium." backdrop-blur/shadow stay inline
            // (arbitrary values Tailwind can't express); color/border/shadow tint
            // move to classes so dark: can actually apply.
            className="group relative overflow-hidden rounded-xl p-5 transition-all duration-400 bg-white/[0.92] dark:bg-surface-dark/80 border border-white/60 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
            style={{ backdropFilter: 'blur(16px) saturate(180%)' }}
        >
            {/* Hover glow effect */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, rgba(5, 150, 105, 0.08) 0%, transparent 70%)'
                }}
            />
            
            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    <motion.div 
                        className={`p-2.5 rounded-lg bg-gradient-to-br ${iconGradients[tone]} ${toneClasses[tone]} transition-transform duration-400`}
                        whileHover={{ 
                            rotate: 3,
                            scale: 1.05,
                            transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
                        }}
                    >
                        <Icon className="w-4 h-4" />
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
                            className="text-2xl font-semibold text-ink dark:text-ink-dark tabular-nums"
                        >
                            {value}
                        </motion.p>
                    )}
                    {hint && (
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-xs text-ink-subtle dark:text-ink-subtle-dark"
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
        primary:
            "bg-white text-brand-700 hover:bg-white/95 shadow-button hover:shadow-elevated",
        secondary:
            "bg-ink/5 text-ink hover:bg-ink/8 dark:bg-ink/10 dark:text-ink-dark dark:hover:bg-ink/15",
        outline:
            "bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:border-white/40 backdrop-blur-sm",
    };

    return (
        <motion.div
            whileHover={{ 
                scale: 1.02, 
                y: -2 
            }}
            whileTap={{ 
                scale: 0.98 
            }}
            transition={{
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1]
            }}
        >
            <Link
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${variantClasses[variant]}`}
            >
                <Icon className="w-4 h-4" />
                {label}
            </Link>
        </motion.div>
    );
};

// Real, null-safe transaction row with receipt navigation.
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
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ animationDelay: `${index * 50}ms` }}
            className="tenant-txn-card flex items-center justify-between p-4 group"
        >
            <div className="flex items-start gap-4 min-w-0">
                <div className={`tenant-txn-icon ${isCredit ? "credit" : "debit"} p-2.5 rounded-lg shrink-0`}>
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

            <p className={`tenant-txn-amount ${isCredit ? "credit" : ""} text-sm font-semibold tabular-nums shrink-0 ${isCredit ? "text-success" : "text-ink dark:text-ink-dark"}`}>
                {isCredit ? "+" : "-"}
                {formatCurrency(Math.abs(toMoneyNumber(amount)))}
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
        { id: "mpesa" as const, Mark: MpesaMark, label: "M-Pesa", timing: "Instant", popular: true },
        { id: "bank" as const, Mark: BankMark, label: "Bank Transfer", timing: "1–2 days", popular: false, comingSoon: true },
        { id: "card" as const, Mark: CardMark, label: "Card", timing: "Instant", popular: false, comingSoon: true },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            // Was a `color-mix(in srgb, ..., white)` gradient — mixing with the
            // literal color white, so this always rendered as a pale mint card
            // even in dark mode. This is where a renter actually pays rent; a
            // washed-out light panel breaking the dark theme on the one action
            // that moves their money is the worst place for that bug to be.
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
                                    {/* Was a fixed rgba(255,255,255,...) background with the
                                        focus "grow + glow" effect done by directly mutating
                                        e.target.style in onFocus/onBlur — invisible to React,
                                        wrong every time the two handlers' values drifted from
                                        the base style, and (like the surfaces above) permanently
                                        light-mode. CSS :focus does the identical effect natively,
                                        with a dark: counterpart, and can't drift out of sync. */}
                                    <input
                                        type="number"
                                        min="1"
                                        inputMode="numeric"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
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
                                                transition={{
                                                    duration: 0.2,
                                                    ease: [0.34, 1.56, 0.64, 1]
                                                }}
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
                                <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-3">Payment Method</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map((method) => {
                                        const selected = selectedMethod === method.id;
                                        const { Mark } = method;
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => !method.comingSoon && setSelectedMethod(method.id)}
                                                disabled={method.comingSoon}
                                                aria-pressed={selected}
                                                title={method.comingSoon ? "Coming soon" : undefined}
                                                // A real border rather than a 2px ring: at rest it is a
                                                // hairline, selected it becomes a brand-tinted card that
                                                // sits forward. (Was inline rgba(255,255,255,...) with no
                                                // dark counterpart — a washed-out white tile in dark mode.)
                                                className={`group relative flex flex-col items-center gap-2 rounded-xl px-3 pt-4 pb-3 transition-all duration-200 disabled:opacity-55 ${
                                                    method.comingSoon
                                                        ? "cursor-not-allowed"
                                                        : "cursor-pointer hover:-translate-y-0.5"
                                                } ${
                                                    selected
                                                        ? "bg-gradient-to-b from-brand-50 to-brand-100 dark:from-brand-900/35 dark:to-emerald-900/20 border border-brand-400 dark:border-brand-600 shadow-[0_0_0_3px_rgba(5,150,105,0.12),0_4px_12px_rgba(5,150,105,0.13)] dark:shadow-[0_0_0_3px_rgba(16,185,129,0.18),0_4px_12px_rgba(0,0,0,0.25)]"
                                                        : "bg-white/[0.72] dark:bg-white/5 border border-black/[0.07] dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none"
                                                }`}
                                            >
                                                {method.popular && !method.comingSoon && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-sm dark:bg-white dark:text-ink">
                                                        Popular
                                                    </span>
                                                )}
                                                {method.comingSoon && (
                                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-black/5 bg-ink/[0.07] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted dark:bg-white/10 dark:text-ink-muted-dark">
                                                        Soon
                                                    </span>
                                                )}

                                                <span className="flex h-[26px] items-center">
                                                    <Mark />
                                                </span>
                                                <span className="text-[11px] font-semibold leading-none text-ink dark:text-ink-dark">
                                                    {method.label}
                                                </span>
                                                <span className="text-[10px] leading-none text-ink-subtle dark:text-ink-subtle-dark">
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
                                whileHover={{ 
                                    y: -2, 
                                    scale: 1.01 
                                }}
                                whileTap={{ 
                                    y: 0, 
                                    scale: 0.99 
                                }}
                                transition={{
                                    duration: 0.2,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                // Disabled background was rgba(0,0,0,0.1) — a 10% black tint
                                // that reads as a faint dark button on a light card, but is
                                // nearly invisible on the dark-mode card behind it, leaving
                                // white text floating with almost no button shape at all.
                                className={`tenant-btn-premium w-full py-4 font-bold rounded-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    amountValid
                                        ? "text-white"
                                        : "bg-ink/10 dark:bg-white/10 text-ink-muted dark:text-ink-muted-dark"
                                }`}
                                style={
                                    amountValid
                                        ? {
                                              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25), 0 4px 16px rgba(5, 150, 105, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                          }
                                        : undefined
                                }
                            >
                                <Zap className="w-5 h-5" />
                                {displayAmount > 0 ? `Pay ${formatCurrency(displayAmount)}` : "Enter Amount"}
                                <ArrowRight className="w-4 h-4 ml-auto" />
                            </motion.button>
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
                                <motion.button
                                    type="button"
                                    onClick={initiatePayment}
                                    disabled={!amountValid || !phoneValid}
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ y: 0, scale: 0.99 }}
                                    className={`tenant-btn-premium py-4 font-bold rounded-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                        amountValid && phoneValid
                                            ? "text-white"
                                            : "bg-ink/10 dark:bg-white/10 text-ink-muted dark:text-ink-muted-dark"
                                    }`}
                                    style={
                                        amountValid && phoneValid
                                            ? {
                                                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25), 0 4px 16px rgba(5, 150, 105, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                              }
                                            : undefined
                                    }
                                >
                                    <Smartphone className="w-5 h-5" />
                                    Pay now
                                </motion.button>
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

            {/* Trust Signals -- every claim here must trace to real behavior
                (see AGENTS.md: "No claim on a public page that you cannot
                trace to working code"). This used to include a "PCI
                Compliant" badge; removed because it was false -- this system
                never processes card numbers, it sends an M-Pesa STK push and
                the renter enters their PIN on their own phone. A fabricated
                compliance claim actively undermines the trust it's meant to
                build. The three claims below are each backed by real code:
                the payment rail (M-Pesa STK push), the transport (HTTPS/TLS,
                same as every page), and the append-only ledger + receipt
                generation from this session's earlier hardening work. */}
            <div className="mt-4 pt-4 border-t border-brand-200/40 dark:border-brand-800/20">
                <div className="flex items-center justify-center gap-2 text-xs text-ink-subtle dark:text-ink-subtle-dark flex-wrap">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10">
                        <Smartphone className="w-3.5 h-3.5 text-brand-600" />
                        <span>M-Pesa secured</span>
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10">
                        <Lock className="w-3.5 h-3.5 text-brand-600" />
                        <span>Bank-grade encryption</span>
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10">
                        <Receipt className="w-3.5 h-3.5 text-brand-600" />
                        <span>Every payment recorded</span>
                    </span>
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

// Shaped like the loaded layout below (hero, 4-metric grid, two-column
// content) rather than a centered spinner, so nothing visibly jumps into
// place once data arrives — the landlord and admin dashboards already do
// this with the same .tenant-skeleton / .tenant-skeleton-hero shimmer
// classes; this was the one renter-facing surface still using a spinner.
// Exported so app/portal/page.tsx's Suspense fallback (the brief window
// before this component's own code finishes loading) can show the same
// shape too, instead of a different spinner flashing before this one.
export const TenantDashboardSkeleton = () => (
    <div className="space-y-8 pb-12" aria-busy="true" aria-label="Loading your dashboard">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="tenant-skeleton rounded-2xl h-[26rem]" />
                <div className="space-y-3">
                    <div className="tenant-skeleton h-6 w-32 rounded" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="tenant-skeleton h-[4.5rem] rounded-xl" />
                    ))}
                </div>
            </div>
            <div className="space-y-6">
                <div className="tenant-skeleton rounded-2xl h-64" />
                <div className="tenant-skeleton rounded-2xl h-48" />
            </div>
        </div>
    </div>
);

export const PremiumTenantDashboard = () => {
    const { data: dashboard, isLoading, error } = useTenantDashboardQuery();
    const { data: historyData } = useTenantPaymentHistoryQuery(0, HISTORY_FETCH_SIZE);
    const { data: summary } = useTenantPaymentSummaryQuery();
    const router = useRouter();

    const score = useMemo(() => computePaymentScore(historyData?.content ?? []), [historyData]);

    // The score is computed from one page of history (HISTORY_FETCH_SIZE), not
    // the full ledger. For a long tenancy that silently understates a lifetime
    // figure, so when the ledger is larger than the window the card says what
    // the number actually covers instead of implying it is all-time.
    const scoreIsWindowed = (historyData?.totalElements ?? 0) > HISTORY_FETCH_SIZE;

    if (isLoading) {
        return <TenantDashboardSkeleton />;
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

    const { tenantName, tenantPhone, unitNumber, propertyName, nextDueDate, recentPayments, leaseStatus } = dashboard;
    const currentBalance = toMoneyNumber(dashboard.currentBalance);
    const overdueAmount = toMoneyNumber(dashboard.overdueAmount);
    const nextDueAmount = toMoneyNumber(dashboard.nextDueAmount);
    const monthlyRent = toMoneyNumber(dashboard.monthlyRent);

    // Total paid comes from the server-side aggregate, not a client-side sum.
    // This previously filtered historyData.content — one page of at most
    // HISTORY_FETCH_SIZE rows — and was labelled "This year", so a renter with a
    // long ledger would be shown a money figure that silently understated what
    // they had actually paid. A displayed amount must never be a partial sum
    // dressed up as a total; the backend already computes totalPaid across the
    // whole ledger, so use that and label it for what it is.
    const totalPaid = summary?.totalPaid;

    const activity = recentPayments.length > 0 ? recentPayments : (historyData?.content ?? []).slice(0, 5);

    return (
        <div className="space-y-8 pb-12">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    duration: 0.6, 
                    ease: [0.16, 1, 0.3, 1]
                }}
                className="relative overflow-hidden rounded-2xl p-8 shadow-elevated"
                style={{
                    background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 12s ease infinite'
                }}
            >
                {/* Floating Orb Decorations */}
                <div 
                    className="absolute pointer-events-none"
                    style={{
                        width: '500px',
                        height: '500px',
                        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
                        borderRadius: '50%',
                        top: '-20%',
                        right: '-10%',
                        animation: 'float-slow 20s ease-in-out infinite',
                        filter: 'blur(60px)'
                    }}
                />
                <div 
                    className="absolute pointer-events-none"
                    style={{
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        bottom: '-15%',
                        left: '-5%',
                        animation: 'float-slow 25s ease-in-out infinite reverse',
                        filter: 'blur(50px)'
                    }}
                />

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                            duration: 0.5, 
                            delay: 0.1,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="flex items-start justify-between mb-8 gap-4 flex-wrap"
                    >
                        <div>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full text-sm font-medium"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'rgba(255, 255, 255, 0.95)'
                                }}
                            >
                                <Home className="w-4 h-4" />
                                Unit {unitNumber} · {propertyName}
                            </motion.p>
                            <motion.h1 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                className="text-white font-bold"
                                style={{
                                    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                                    letterSpacing: '-0.03em',
                                    lineHeight: '1.1',
                                    textShadow: '0 2px 12px rgba(0, 0, 0, 0.2)'
                                }}
                            >
                                Welcome back, {tenantName.split(" ")[0]}
                            </motion.h1>
                        </div>
                        <StatusBadge status={leaseStatus} onBrand />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                            duration: 0.5, 
                            delay: 0.4,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="space-y-2 mb-6"
                    >
                        <p className="text-sm font-medium uppercase tracking-wider"
                            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        >
                            Account Balance
                        </p>
                        <div className="flex items-baseline gap-4 flex-wrap">
                            <motion.p 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ 
                                    duration: 0.6, 
                                    delay: 0.5,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                className="text-white font-extrabold tabular-nums"
                                style={{
                                    fontSize: 'clamp(3rem, 6vw, 5rem)',
                                    letterSpacing: '-0.04em',
                                    lineHeight: '1',
                                    textShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                                    fontVariantNumeric: 'tabular-nums'
                                }}
                            >
                                {formatCurrency(currentBalance)}
                            </motion.p>
                            {currentBalance === 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                                    className="flex items-center gap-1.5"
                                    style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">All clear</span>
                                </motion.div>
                            )}
                        </div>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                        >
                            {currentBalance > 0
                                ? overdueAmount > 0
                                    ? `${formatCurrency(overdueAmount)} overdue • Payment required`
                                    : dueSummary(nextDueDate)
                                : "No balance due • Account settled"}
                        </motion.p>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                            duration: 0.5, 
                            delay: 0.8,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="flex flex-wrap gap-3"
                    >
                        <QuickAction icon={Wallet} label="Make Payment" href="#payment" variant="primary" />
                        <QuickAction icon={FileText} label="View Lease" href="/portal/lease" variant="outline" />
                        <QuickAction icon={Wrench} label="Maintenance" href="/portal/maintenance" variant="outline" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={AlertCircle}
                    label="Overdue"
                    value={formatCurrency(overdueAmount)}
                    hint={overdueAmount === 0 ? "No arrears" : "Immediate payment required"}
                    tone={overdueAmount > 0 ? "danger" : "success"}
                    loading={isLoading}
                />
                {/* "Not scheduled" used to be what almost every renter saw here.
                    The backend only matched a ledger entry dated today or later,
                    but RentChargeScheduler never posts ahead — so for most of
                    every month no such entry existed. It now projects the next
                    charge from the scheduler's own rule, and "Not scheduled" is
                    left for the one case where it is true: a tenancy with no
                    further rent to come.

                    The hint carries the exact date as well as the amount —
                    "when" and "how much" are the two things a renter opens this
                    tile for, and a relative "Due in 27 days" alone can't be
                    checked against their own calendar.

                    Tone is amber only as the date approaches. Every active
                    renter now always has a next due date, so a permanent
                    warning colour would mean nothing at all. */}
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
                    hint="All time"
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
                            <div className="tenant-txn-card p-10 text-center">
                                <div className="relative w-14 h-14 mx-auto mb-4">
                                    <div className="absolute inset-0 rounded-xl bg-brand-500/10 blur-lg" />
                                    <div className="relative rounded-xl bg-gradient-to-br from-brand-500/15 to-brand-300/5 flex items-center justify-center">
                                        <Receipt className="w-6 h-6 text-brand-600" strokeWidth={2} />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-ink dark:text-ink-dark">No activity yet</p>
                                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1 max-w-xs mx-auto">
                                    Your ledger will populate here as soon as rent charges and payments are recorded.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
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
                        transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="tenant-score-card p-6"
                    >
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-ink dark:text-ink-dark flex items-center gap-2">
                                <BadgeCheck className="w-5 h-5 text-brand-600" />
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

                        {/* First-run state. A 0% ring beside "Keep it up!" reads as a
                            broken widget rather than a new account — there is no score
                            to show until at least one payment exists, so say that
                            instead of rendering a hollow zero. */}
                        {score.totalPayments === 0 ? (
                            <div className="py-2 text-center">
                                <div className="relative mx-auto mb-4 h-24 w-24">
                                    <svg className="h-24 w-24 -rotate-90" aria-hidden="true">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="7"
                                            fill="none"
                                            strokeDasharray="4 9"
                                            strokeLinecap="round"
                                            className="text-ink/12 dark:text-white/15"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BadgeCheck className="h-8 w-8 text-ink/20 dark:text-white/25" strokeWidth={1.75} />
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-ink dark:text-ink-dark">
                                    Your record starts here
                                </p>
                                {/* Only claims what ships today: payments are recorded and
                                    each one has a downloadable receipt. Deliberately does NOT
                                    promise a portable/exportable rental reference — that
                                    feature does not exist yet (AGENTS.md: no claim you cannot
                                    trace to working code). */}
                                <p className="mx-auto mt-1.5 max-w-[15rem] text-xs leading-relaxed text-ink-muted dark:text-ink-muted-dark">
                                    Once you pay rent through the portal, every payment is recorded
                                    here with a receipt you can download any time.
                                </p>
                            </div>
                        ) : (
                        <>
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative w-32 h-32">
                                <svg className="tenant-score-ring transform -rotate-90 w-32 h-32">
                                    <defs>
                                        <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#10B981" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                    </defs>
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
                                        stroke="url(#score-gradient)"
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
                            {[
                                { label: "Total Payments", value: String(score.totalPayments), tone: "default" },
                                { label: "Late Payments", value: String(score.latePayments), tone: score.latePayments > 0 ? "danger" : "success" },
                                { label: "Current Streak", value: `${score.currentStreakMonths} month${score.currentStreakMonths === 1 ? "" : "s"}`, tone: "brand", streak: true },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + i * 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex items-center justify-between text-sm row-fade"
                                >
                                    <span className="text-ink-muted dark:text-ink-muted-dark">{stat.label}</span>
                                    <span className={`font-medium ${stat.tone === "danger" ? "text-danger" : stat.tone === "success" ? "text-success" : stat.tone === "brand" ? "text-brand-600" : "text-ink dark:text-ink-dark"} flex items-center gap-1`}>
                                        {stat.streak && <Zap className="w-3.5 h-3.5" />}
                                        {stat.value}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border/40 dark:border-border-dark/40">
                            <p className="text-xs text-ink-subtle dark:text-ink-subtle-dark text-center">
                                {score.latePayments === 0
                                    ? "A clean payment history helps you secure better rentals in the future."
                                    : "On-time payments strengthen the record you can show future landlords."}
                            </p>
                        </div>
                        </>
                        )}
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="tenant-quicklinks-card p-6"
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
                                    className="tenant-quick-link-item flex items-center justify-between p-3 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <link.icon className="tenant-qk-icon w-4 h-4 text-ink-muted dark:text-ink-muted-dark" />
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

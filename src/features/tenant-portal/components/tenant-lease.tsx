// components/tenant-lease.tsx
"use client";

import {
    useTenantDashboardQuery,
    useTenantLeaseQuery,
    useTenantPaymentSummaryQuery,
    useTenantAutoPaySettingsQuery,
    useTenantDepositQuery,
    tenantPortalKeys,
} from "../hooks/use-tenant-portal-queries";
import {
    useToggleAutoPayMutation,
    useUpdateAutoPayPhoneMutation,
} from "../hooks/use-tenant-portal-mutations";
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    BadgeCheck,
    Building2,
    Calendar,
    CalendarClock,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    FileText,
    Home,
    Loader2,
    Lock,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    RefreshCw,
    Shield,
    Smartphone,
    User,
    XCircle,
    Zap,
} from "lucide-react";
import { formatDate } from "./tenant-format";
import { formatCurrency, toMoneyNumber } from "@/shared/utils/money";
import { tenantPortalApi, type DepositResponse, type DepositStatus, type TenantLeaseResponse } from "../api/tenant-portal-api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    PortalPage,
    PortalPageHeader,
    PortalCard,
    PortalEmptyState,
    PortalErrorState,
} from "./portal-chrome";
import { MpesaMark } from "./payment-brand-marks";
import { isValidMpesaPhone, normalizeMpesaPhone } from "@/lib/mpesa/phone";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


/** Whole days from today to iso. Negative once passed. */
const daysUntil = (iso: string | null): number => {
    if (!iso) return Number.MAX_SAFE_INTEGER;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return Number.MAX_SAFE_INTEGER;
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86_400_000);
};

/** Validates a CSS hex colour from the backend before trusting it in inline styles. */
const safeHex = (color: string | null | undefined): string | null =>
    color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATUS / DEPOSIT CHIPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LEASE_STATUS_STYLE: Record<string, string> = {
    ACTIVE: "badge-emerald",
    EXPIRED: "badge-neutral",
    TERMINATED: "badge-danger",
    PENDING: "badge-warning",
};

const DEPOSIT_STATUS_META: Record<DepositStatus, { label: string; cls: string }> = {
    UNPAID:             { label: "Unpaid",             cls: "tenant-status-chip-neutral" },
    HELD:               { label: "Held by landlord",   cls: "tenant-status-chip-success" },
    PARTIALLY_REFUNDED: { label: "Partially refunded", cls: "tenant-status-chip-warning" },
    REFUNDED:           { label: "Refunded",           cls: "tenant-status-chip-success" },
    FORFEITED:          { label: "Forfeited",          cls: "tenant-status-chip-danger"  },
};
const DepositStatusChip = ({ status }: { status: DepositStatus }) => {
    const m = DEPOSIT_STATUS_META[status] ?? DEPOSIT_STATUS_META.UNPAID;
    return <span className={`tenant-status-chip ${m.cls} inline-flex`}>{m.label}</span>;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEASE HERO CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LeaseHeroCard = ({
    lease,
    monthlyRent,
    nextDueDate,
}: {
    lease: TenantLeaseResponse;
    monthlyRent: number;
    nextDueDate: string | null;
}) => {
    const accent = safeHex(lease.landlordPrimaryColor) ?? "#059669";

    const leaseProgress = useMemo(() => {
        if (!lease.startDate || !lease.endDate) return null;
        const start = new Date(lease.startDate).getTime();
        const end = new Date(lease.endDate).getTime();
        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        const total = end - start;
        if (total <= 0) return null;
        const elapsed = Math.max(0, now - start);
        const pct = Math.min(100, Math.round((elapsed / total) * 100));
        const daysLeft = Math.max(0, Math.round((end - now) / 86_400_000));
        return { pct, daysLeft };
    }, [lease.startDate, lease.endDate]);

    const statusCls = LEASE_STATUS_STYLE[lease.status?.toUpperCase?.()] ?? "badge-neutral";

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_12px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
            style={{
                background: `linear-gradient(135deg, ${accent}12 0%, ${accent}06 60%, transparent 100%)`,
                backdropFilter: "blur(16px) saturate(180%)",
                backgroundColor: "rgba(255,255,255,0.92)",
            }}
        >
            {/* Dark mode overlay */}
            <div
                className="absolute inset-0 hidden dark:block pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${accent}10 60%, transparent 100%)`, backgroundColor: "rgba(15,23,42,0.85)" }}
            />
            {/* Ambient orb */}
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-20 dark:opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`, filter: "blur(40px)" }} />

            <div className="relative p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                    {/* Property info */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`${statusCls} !text-[10px]`}>{lease.status?.toLowerCase()}</span>
                        </div>
                        <h2 className="text-xl font-bold text-fg dark:text-fg-dark leading-tight">
                            {lease.propertyName}
                        </h2>
                        <p className="mt-0.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                            {lease.unitLabel ? `${lease.unitNumber} · ${lease.unitLabel}` : `Unit ${lease.unitNumber}`}
                        </p>
                    </div>

                    {/* Monthly rent */}
                    <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-0.5">
                            Monthly Rent
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-fg dark:text-fg-dark">
                            {formatCurrency(monthlyRent)}
                        </p>
                        {nextDueDate && (
                            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                Next due {formatDate(nextDueDate)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                        { icon: Calendar, label: "Start date", value: formatDate(lease.startDate) },
                        { icon: Calendar, label: "End date", value: lease.endDate ? formatDate(lease.endDate) : "Ongoing" },
                        { icon: CreditCard, label: "Deposit", value: formatCurrency(lease.depositAmount) },
                        { icon: Shield, label: "Lease #", value: lease.leaseNumber, mono: true },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2.5">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${accent}15`, color: accent }}
                            >
                                <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark leading-none mb-0.5">
                                    {item.label}
                                </p>
                                <p className={`text-xs font-semibold text-fg dark:text-fg-dark truncate ${item.mono ? "font-mono-nums" : ""}`}>
                                    {item.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Lease progress bar */}
                {leaseProgress && (
                    <div>
                        <div className="flex items-center justify-between text-[11px] text-fg-muted dark:text-fg-muted-dark mb-1.5">
                            <span>Lease progress — {leaseProgress.pct}% elapsed</span>
                            <span className={leaseProgress.daysLeft <= 30 ? "font-semibold text-warning-dark dark:text-warning" : ""}>
                                {leaseProgress.daysLeft === 0
                                    ? "Expires today"
                                    : leaseProgress.daysLeft === 1
                                      ? "1 day left"
                                      : `${leaseProgress.daysLeft} days left`}
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden bg-ink/8 dark:bg-white/10">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: leaseProgress.daysLeft <= 30 ? "#d97706" : accent }}
                                initial={{ width: 0 }}
                                animate={{ width: `${leaseProgress.pct}%` }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAY WIDGET (inline — compact version, consistent with payments page)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type PayState = "idle" | "phone_prompt" | "initiating" | "pending" | "success" | "error";

interface LeasePayWidgetProps {
    currentBalance: number;
    overdueAmount: number;
    monthlyRent: number;
    tenantPhone: string;
    leaseStatus: string;
}

const LeasePayWidget = ({
    currentBalance,
    overdueAmount,
    monthlyRent,
    tenantPhone,
    leaseStatus,
}: LeasePayWidgetProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [payState, setPayState] = useState<PayState>("idle");
    const [payMessage, setPayMessage] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState(tenantPhone);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [sentToPhone, setSentToPhone] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const canPay = leaseStatus === "ACTIVE";
    const suggestedAmount = overdueAmount > 0 ? overdueAmount : currentBalance > 0 ? currentBalance : 0;
    const displayAmount = customAmount ? parseFloat(customAmount) : suggestedAmount;
    const amountValid = !isNaN(displayAmount) && displayAmount > 0;
    const effectivePhone = mpesaPhone || tenantPhone;
    const phoneValid = isValidMpesaPhone(effectivePhone);

    const quickAmounts = useMemo(() => {
        const s = new Set<number>();
        if (overdueAmount > 0) s.add(Math.round(overdueAmount));
        if (currentBalance > 0 && currentBalance !== overdueAmount) s.add(Math.round(currentBalance));
        if (monthlyRent > 0) s.add(Math.round(monthlyRent));
        return [...s].slice(0, 3);
    }, [overdueAmount, currentBalance, monthlyRent]);

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
                queryClient.invalidateQueries({ queryKey: tenantPortalKeys.dashboard });
                queryClient.invalidateQueries({ queryKey: tenantPortalKeys.paymentHistory(0) });
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
        try {
            const result = await tenantPortalApi.initiatePortalPayment(displayAmount, phone);
            setRequestId(result.id);
            setSentToPhone(`0${phone.slice(3)}`);
            setPayState("pending");
            setPayMessage("STK push sent — enter your M-Pesa PIN.");
            pollRef.current = setInterval(async () => {
                const done = await checkStatus(result.id);
                if (!done) setPayMessage("Still awaiting confirmation. Check your M-Pesa messages.");
            }, 5000);
        } catch (err) {
            setPayState("error");
            setPayMessage(err instanceof Error ? err.message : "Failed to initiate payment.");
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

    if (!canPay) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl border-[1.5px] border-brand-200 dark:border-brand-800/60 shadow-[0_2px_12px_rgba(5,150,105,0.08),0_8px_32px_rgba(5,150,105,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]"
            style={{ background: "linear-gradient(145deg, rgba(236,253,245,0.97) 0%, rgba(209,250,229,0.7) 100%)" }}
        >
            <div className="absolute inset-0 hidden dark:block pointer-events-none" style={{ background: "linear-gradient(145deg, rgba(6,78,59,0.28) 0%, rgba(4,120,87,0.15) 100%)" }} />
            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5 gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[0_2px_8px_rgba(5,150,105,0.3)]">
                            <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-fg dark:text-fg-dark">Pay Rent</h3>
                                <MpesaMark />
                            </div>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                {currentBalance > 0
                                    ? `Balance due: ${formatCurrency(currentBalance)}`
                                    : "Account settled — make an advance payment"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-success bg-success/10 border border-success/20 px-2 py-1 rounded-full">
                        <Lock className="h-3 w-3" strokeWidth={2} />
                        Secure
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {payState === "idle" && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -12 }}>
                            {/* Balance */}
                            <p className="text-3xl font-bold tabular-nums text-fg dark:text-fg-dark mb-4">
                                {formatCurrency(suggestedAmount > 0 ? suggestedAmount : 0)}
                                {currentBalance === 0 && (
                                    <span className="ml-3 text-sm font-normal text-success inline-flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                                        All clear
                                    </span>
                                )}
                            </p>

                            {/* Quick amounts */}
                            {quickAmounts.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {quickAmounts.map((a) => (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => setCustomAmount(String(a))}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-200 ${
                                                customAmount === String(a)
                                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/35 text-brand-700 dark:text-brand-300"
                                                    : "border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:border-brand-300 bg-white/70 dark:bg-white/5"
                                            }`}
                                        >
                                            {formatCurrency(a)}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setCustomAmount("")}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:border-brand-300 bg-white/70 dark:bg-white/5 transition-all"
                                    >
                                        Custom
                                    </button>
                                </div>
                            )}

                            {customAmount !== "" && (
                                <div className="relative mb-4">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-fg-muted dark:text-fg-muted-dark">KSh</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder="Enter amount"
                                        className="input-field pl-12 w-full text-lg font-bold tabular-nums"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPayState("phone_prompt")}
                                    disabled={!amountValid}
                                    className="btn-primary flex-1 justify-center gap-2 py-3 font-bold"
                                >
                                    <Smartphone className="h-4 w-4" strokeWidth={2} />
                                    {amountValid ? `Pay ${formatCurrency(displayAmount)}` : "Pay via M-Pesa"}
                                </button>
                                <Link href="/portal/payments" className="btn-outline btn-sm flex items-center gap-1.5 shrink-0">
                                    Full history <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {payState === "phone_prompt" && (
                        <motion.div key="phone" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-2xl font-bold tabular-nums text-fg dark:text-fg-dark">{formatCurrency(displayAmount)}</p>
                                <button onClick={reset} className="text-xs text-fg-muted hover:text-fg-dark underline underline-offset-2">
                                    Change
                                </button>
                            </div>
                            <div className="space-y-3 mb-4">
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
                                <button onClick={reset} className="btn-outline flex-none px-5">Back</button>
                                <button
                                    onClick={initiatePayment}
                                    disabled={!amountValid || !phoneValid}
                                    className="btn-primary flex-1 gap-2"
                                >
                                    <Smartphone className="h-4 w-4" strokeWidth={2} />
                                    Pay {formatCurrency(displayAmount)}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {payState === "initiating" && (
                        <motion.div key="initiating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
                            <div className="relative w-12 h-12 mx-auto mb-3">
                                <div className="absolute inset-0 rounded-full bg-brand-500/15 animate-ping" />
                                <div className="absolute inset-2 rounded-full bg-brand-600 flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 text-white animate-spin" strokeWidth={2.5} />
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">Sending payment request…</p>
                        </motion.div>
                    )}

                    {payState === "pending" && (
                        <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex items-start gap-3 mb-4">
                                <div className="relative w-10 h-10 shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-brand-500/15 animate-ping" />
                                    <div className="absolute inset-1.5 rounded-full bg-brand-600 flex items-center justify-center">
                                        <Smartphone className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">Awaiting M-Pesa confirmation</p>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{payMessage}</p>
                                    {sentToPhone && (
                                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                            Prompt sent to <span className="font-mono-nums font-semibold text-fg dark:text-fg-dark">{sentToPhone}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={refreshStatus} className="btn-outline btn-sm flex items-center gap-1.5">
                                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                                    Check status
                                </button>
                                <button onClick={reset} className="text-xs text-fg-subtle dark:text-fg-subtle-dark hover:text-fg-muted">
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
                                <button onClick={() => setPayState("phone_prompt")} className="btn-primary btn-sm">Try again</button>
                                <button onClick={reset} className="btn-outline btn-sm">Cancel</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Trust footer */}
                <div className="mt-5 pt-4 border-t border-brand-200/50 dark:border-brand-800/30 flex items-center justify-center gap-4 text-[11px] text-fg-subtle dark:text-fg-subtle-dark flex-wrap">
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-brand-600" />Bank-grade encryption</span>
                    <span className="h-3 w-px bg-border dark:bg-border-dark" />
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-brand-600" />Instant confirmation</span>
                </div>
            </div>
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTO-PAY CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AutoPayCard = ({
    autoPaySettings,
    tenantPhone,
    isHighlighted,
    cardRef,
}: {
    autoPaySettings: NonNullable<ReturnType<typeof useTenantAutoPaySettingsQuery>["data"]>;
    tenantPhone: string;
    isHighlighted: boolean;
    cardRef: React.RefObject<HTMLDivElement | null>;
}) => {
    const toggleMut = useToggleAutoPayMutation();
    const phoneMut = useUpdateAutoPayPhoneMutation();
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");

    const autoPay = autoPaySettings.enabled;
    const storedPhone = autoPaySettings.mpesaPhone ?? tenantPhone ?? "";
    const effectivePhone = editingPhone ? phoneInput : storedPhone;
    const phoneValid = isValidMpesaPhone(effectivePhone);

    const handleToggle = () => {
        const phone = normalizeMpesaPhone(storedPhone);
        if (!isValidMpesaPhone(phone)) {
            setPhoneInput(storedPhone);
            setEditingPhone(true);
            return;
        }
        toggleMut.mutate({ enabled: !autoPay, mpesaPhone: phone });
    };

    const handleSavePhone = () => {
        if (!phoneValid) return;
        phoneMut.mutate({ mpesaPhone: normalizeMpesaPhone(phoneInput) });
        setEditingPhone(false);
    };

    return (
        <motion.div
            ref={cardRef as React.RefObject<HTMLDivElement>}
            tabIndex={-1}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`tenant-panel !p-5 outline-none transition-shadow ${isHighlighted ? "ring-2 ring-brand/40 border-brand/30" : ""}`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${autoPay ? "bg-success/10 text-success" : "bg-ink/5 dark:bg-white/8 text-fg-muted dark:text-fg-muted-dark"}`}>
                        <Zap className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">Auto-Pay</p>
                            {autoPay && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            {autoPay
                                ? `Paid automatically on your due date via ${autoPaySettings.mpesaPhone ?? "your M-Pesa"}`
                                : "Never miss a due date — rent paid automatically"}
                        </p>
                    </div>
                </div>
                {/* Toggle */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={autoPay}
                    onClick={handleToggle}
                    disabled={toggleMut.isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-60 ${autoPay ? "bg-success" : "bg-border dark:bg-border-dark"}`}
                >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${autoPay ? "translate-x-6" : "translate-x-1"}`} />
                </button>
            </div>

            {/* Status rows */}
            {autoPaySettings.lastAutoPayDate && (
                <div className="flex items-center gap-2 text-xs text-fg-subtle dark:text-fg-subtle-dark mb-3">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={2} />
                    Last auto-payment on {formatDate(autoPaySettings.lastAutoPayDate)}
                </div>
            )}
            {autoPaySettings.consecutiveFailures > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-warning/8 border border-warning/20 px-3 py-2 mb-3">
                    <AlertCircle className="h-3.5 w-3.5 text-warning-dark dark:text-warning shrink-0 mt-0.5" strokeWidth={2} />
                    <p className="text-xs text-warning-dark dark:text-warning font-medium">
                        {autoPaySettings.consecutiveFailures} consecutive failure{autoPaySettings.consecutiveFailures > 1 ? "s" : ""} — ensure sufficient M-Pesa balance on your due date
                    </p>
                </div>
            )}
            {autoPaySettings.lastFailureReason && (
                <div className="flex items-start gap-2 rounded-lg bg-danger/5 border border-danger/20 px-3 py-2 mb-3">
                    <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                        <p className="text-xs font-medium text-danger">Last attempt failed</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{autoPaySettings.lastFailureReason}</p>
                    </div>
                </div>
            )}

            {/* Phone row (only when enabled) */}
            {autoPay && (
                <div className="pt-3 border-t border-border dark:border-border-dark">
                    {editingPhone ? (
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted dark:text-fg-muted-dark" />
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="0712345678"
                                    className="input-field pl-9 w-full text-sm"
                                />
                            </div>
                            <button onClick={handleSavePhone} disabled={!phoneValid || phoneMut.isPending} className="btn-primary btn-sm shrink-0">
                                {phoneMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </button>
                            <button onClick={() => setEditingPhone(false)} className="btn-outline btn-sm shrink-0">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                <span className="font-mono-nums">{storedPhone || "—"}</span>
                            </span>
                            <button onClick={() => { setPhoneInput(storedPhone); setEditingPhone(true); }} className="btn-ghost btn-sm text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark">
                                Change
                            </button>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LANDLORD CONTACT CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LandlordContactCard = ({ lease }: { lease: TenantLeaseResponse }) => {
    const {
        landlordName, landlordPhone, landlordEmail, landlordLogoUrl,
        landlordVerified, landlordSince, landlordAddress, landlordPrimaryColor,
        propertyAddress,
    } = lease;
    const accent = safeHex(landlordPrimaryColor) ?? "var(--color-brand)";

    const initials = (landlordName ?? "L")
        .split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "L";

    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="tenant-panel !p-0 overflow-hidden"
        >
            {/* Accent strip */}
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 60%, transparent))` }} aria-hidden />

            <div className="p-5">
                {/* Landlord identity */}
                <div className="flex items-center gap-3 mb-4">
                    {landlordLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={landlordLogoUrl} alt="" aria-hidden className="h-11 w-11 rounded-xl object-cover ring-1 ring-black/[0.07] dark:ring-white/10 shrink-0" />
                    ) : (
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, #000))` }}
                        >
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-fg dark:text-fg-dark text-sm leading-tight">{landlordName}</p>
                            {landlordVerified && (
                                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand dark:text-brand-400" strokeWidth={2.5} aria-label="Verified landlord" />
                            )}
                        </div>
                        {landlordSince && (
                            <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark mt-0.5">
                                Member since {formatDate(landlordSince)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick-contact actions */}
                {(landlordPhone || landlordEmail) ? (
                    <div className="flex gap-1.5 mb-4">
                        {landlordPhone && (
                            <a href={`tel:${landlordPhone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success/8 py-2 text-xs font-semibold text-success-dark dark:text-success hover:bg-success/14 active:scale-95 transition-all">
                                <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                                Call
                            </a>
                        )}
                        {landlordPhone && (
                            <a href={(() => { const d = landlordPhone.replace(/\D/g, ""); return `https://wa.me/${d.startsWith("0") && d.length === 10 ? `254${d.slice(1)}` : d}`; })()} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#15803d]/20 bg-[#dcfce7] dark:bg-[#14532d]/35 py-2 text-xs font-semibold text-[#15803d] dark:text-[#4ade80] hover:bg-[#bbf7d0] dark:hover:bg-[#14532d]/55 active:scale-95 transition-all">
                                <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                                WhatsApp
                            </a>
                        )}
                        {landlordEmail && (
                            <a href={`mailto:${landlordEmail}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand/20 bg-brand/5 dark:bg-brand/10 py-2 text-xs font-semibold text-brand dark:text-brand-300 hover:bg-brand/10 active:scale-95 transition-all">
                                <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                                Email
                            </a>
                        )}
                    </div>
                ) : (
                    <p className="mb-4 rounded-lg bg-border-subtle/60 dark:bg-border-subtle-dark/40 px-3 py-2.5 text-xs text-fg-subtle dark:text-fg-subtle-dark text-center">
                        Contact details not yet added by landlord
                    </p>
                )}

                {/* Detail rows */}
                <div className="space-y-2 text-xs border-t border-border dark:border-border-dark pt-4 mb-4">
                    {landlordPhone && (
                        <div className="flex items-center gap-2 text-fg-muted dark:text-fg-muted-dark">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.75} />
                            <a href={`tel:${landlordPhone}`} className="hover:text-brand dark:hover:text-brand-300 transition-colors font-mono-nums">
                                {landlordPhone}
                            </a>
                        </div>
                    )}
                    {landlordEmail && (
                        <div className="flex items-center gap-2 text-fg-muted dark:text-fg-muted-dark">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.75} />
                            <a href={`mailto:${landlordEmail}`} className="hover:text-brand dark:hover:text-brand-300 transition-colors break-all">
                                {landlordEmail}
                            </a>
                        </div>
                    )}
                    {landlordAddress && (
                        <div className="flex items-start gap-2 text-fg-muted dark:text-fg-muted-dark">
                            <Home className="h-3.5 w-3.5 shrink-0 text-fg-subtle dark:text-fg-subtle-dark mt-0.5" strokeWidth={1.75} />
                            <span className="leading-relaxed">{landlordAddress}</span>
                        </div>
                    )}
                    {propertyAddress && (
                        <div className="flex items-start gap-2 text-fg-muted dark:text-fg-muted-dark">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-fg-subtle dark:text-fg-subtle-dark mt-0.5" strokeWidth={1.75} />
                            <span className="leading-relaxed">{propertyAddress}</span>
                        </div>
                    )}
                </div>

                {/* Full profile link */}
                <Link
                    href="/portal/landlord"
                    className="flex items-center justify-between w-full rounded-lg border border-border dark:border-border-dark px-3 py-2.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:border-brand/40 dark:hover:border-brand/30 hover:text-brand dark:hover:text-brand-300 hover:bg-brand/4 transition-all group"
                >
                    <span>Full landlord profile</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </Link>
            </div>
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MANAGER / EMERGENCY CONTACT CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ManagerContactCard = ({ lease }: { lease: TenantLeaseResponse }) => {
    const { managerName, managerPhone, managerEmail, emergencyContactPhone, emergencyContact24h } = lease;
    if (!managerName && !managerPhone && !emergencyContactPhone) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="tenant-panel !p-5"
        >
            {/* Manager */}
            {(managerName || managerPhone || managerEmail) && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/8 dark:bg-brand/15">
                            <User className="h-3.5 w-3.5 text-brand dark:text-brand-300" strokeWidth={2} />
                        </div>
                        <p className="text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Property Manager</p>
                    </div>
                    {managerName && <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-2">{managerName}</p>}
                    {(managerPhone || managerEmail) && (
                        <div className="flex gap-2 mb-2">
                            {managerPhone && (
                                <a href={`tel:${managerPhone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/25 bg-success/8 py-2 text-xs font-semibold text-success-dark dark:text-success hover:bg-success/15 active:scale-95 transition-all">
                                    <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                                    Call
                                </a>
                            )}
                            {managerPhone && (
                                <a href={(() => { const d = managerPhone.replace(/\D/g, ""); return `https://wa.me/${d.startsWith("0") && d.length === 10 ? `254${d.slice(1)}` : d}`; })()} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#15803d]/20 bg-[#dcfce7] dark:bg-[#14532d]/35 py-2 text-xs font-semibold text-[#15803d] dark:text-[#4ade80] hover:bg-[#bbf7d0] active:scale-95 transition-all">
                                    <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                                    WhatsApp
                                </a>
                            )}
                            {managerEmail && (
                                <a href={`mailto:${managerEmail}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand/20 bg-brand/5 py-2 text-xs font-semibold text-brand dark:text-brand-300 hover:bg-brand/10 active:scale-95 transition-all">
                                    <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                                    Email
                                </a>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Emergency contact */}
            {emergencyContactPhone && (
                <div className={managerName || managerPhone ? "pt-3 border-t border-border dark:border-border-dark" : ""}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/10">
                                <Phone className="h-3.5 w-3.5 text-danger" strokeWidth={2} />
                            </div>
                            <p className="text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Emergency</p>
                        </div>
                        {emergencyContact24h && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-[10px] font-semibold text-danger">
                                24/7
                            </span>
                        )}
                    </div>
                    <a
                        href={`tel:${emergencyContactPhone}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/8 py-3 text-sm font-bold text-danger hover:bg-danger/15 active:scale-95 transition-all"
                    >
                        <Phone className="h-4 w-4" strokeWidth={2.5} />
                        {emergencyContactPhone}
                    </a>
                </div>
            )}
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEPOSIT CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DepositCard = ({ deposit }: { deposit: DepositResponse }) => {
    const amountRequired = toMoneyNumber(deposit.amountRequired);
    const amountPaid = toMoneyNumber(deposit.amountPaid);
    const amountRefunded = toMoneyNumber(deposit.amountRefunded);
    const paidPct = amountRequired > 0 ? Math.min(100, Math.round((amountPaid / amountRequired) * 100)) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="tenant-panel !p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/8 dark:bg-brand/15 text-brand dark:text-brand-300">
                        <Shield className="h-[18px] w-[18px]" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Security Deposit</p>
                        <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">
                            {/* NOT "held in escrow" — no escrow facility. The landlord holds it directly. */}
                            Held by your landlord
                        </p>
                    </div>
                </div>
                <DepositStatusChip status={deposit.status} />
            </div>

            {/* Progress bar (paid vs required) */}
            {amountRequired > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-fg-muted dark:text-fg-muted-dark mb-1">
                        <span>{paidPct}% paid</span>
                        <span className="font-data">{formatCurrency(amountPaid)} of {formatCurrency(amountRequired)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-ink/8 dark:bg-white/10">
                        <motion.div
                            className="h-full rounded-full bg-brand-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${paidPct}%` }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        />
                    </div>
                </div>
            )}

            {/* Status-specific info */}
            <div className="space-y-2 text-sm">
                {deposit.paidAt && (
                    <div className="flex items-center justify-between text-fg-muted dark:text-fg-muted-dark">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />Paid on</span>
                        <span className="font-medium text-fg dark:text-fg-dark">{formatDate(deposit.paidAt)}</span>
                    </div>
                )}
                {(deposit.status === "REFUNDED" || deposit.status === "PARTIALLY_REFUNDED") && (
                    <>
                        <div className="flex items-center justify-between text-fg-muted dark:text-fg-muted-dark">
                            <span>Amount refunded</span>
                            <span className="font-data font-semibold text-success">{formatCurrency(amountRefunded)}</span>
                        </div>
                        {deposit.refundedAt && (
                            <div className="flex items-center justify-between text-fg-muted dark:text-fg-muted-dark">
                                <span>Refunded on</span>
                                <span className="font-medium text-fg dark:text-fg-dark">{formatDate(deposit.refundedAt)}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {deposit.status === "HELD" && (
                <p className="mt-3 pt-3 border-t border-border dark:border-border-dark text-xs text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                    Will be refunded, minus any lawful deductions, after move-out inspection.
                </p>
            )}
            {deposit.status === "FORFEITED" && (
                <p className="mt-3 pt-3 border-t border-border dark:border-border-dark text-xs text-fg-muted dark:text-fg-muted-dark">
                    Contact your landlord if you believe this is in error.
                </p>
            )}
        </motion.div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEASE TERMS CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LeaseTermsCard = ({ terms }: { terms: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="tenant-panel !p-5"
    >
        <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/8 dark:bg-brand/15 text-brand dark:text-brand-300">
                <FileText className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-fg dark:text-fg-dark">Lease Terms</p>
        </div>

        {terms ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-fg-muted dark:text-fg-muted-dark space-y-3">
                {terms.split("\n").filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center py-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/4 dark:bg-white/6 mb-3">
                    <FileText className="h-5 w-5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">No terms provided by landlord</p>
                <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark mt-1">
                    Your landlord hasn&apos;t added lease terms yet. Contact them directly for details.
                </p>
            </div>
        )}
    </motion.div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TenantLeasePage = () => {
    const { data: dashboardData } = useTenantDashboardQuery();
    const { data: lease, isLoading, isError, refetch } = useTenantLeaseQuery();
    const { data: summary } = useTenantPaymentSummaryQuery();
    const { data: autoPaySettings } = useTenantAutoPaySettingsQuery();
    const { data: deposit } = useTenantDepositQuery();
    const searchParams = useSearchParams();

    const setupAutoPay = searchParams.get("setup") === "autopay";
    const autoPayCardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (setupAutoPay && autoPaySettings && autoPayCardRef.current) {
            autoPayCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            autoPayCardRef.current.focus({ preventScroll: true });
        }
    }, [setupAutoPay, autoPaySettings]);

    const currentBalance = toMoneyNumber(summary?.currentBalance);
    const overdueAmount = toMoneyNumber(summary?.overdueAmount);
    const monthlyRent = toMoneyNumber(lease?.monthlyRent);
    const tenantPhone = dashboardData?.tenantPhone ?? "";

    if (isLoading) {
        return (
            <PortalPage>
                <PortalPageHeader icon={Home} eyebrow="Your home" title="Lease" />
                <div className="tenant-panel !p-6 space-y-4">
                    <div className="tenant-skeleton-premium h-7 w-48 rounded" />
                    <div className="tenant-skeleton-premium h-1.5 w-full rounded-full" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="tenant-skeleton-premium h-8 w-8 rounded-xl" />
                                <div className="tenant-skeleton-premium h-3 w-16 rounded" />
                                <div className="tenant-skeleton-premium h-4 w-20 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                        <div className="tenant-panel !p-6"><div className="tenant-skeleton-premium h-52 w-full rounded-xl" /></div>
                        <div className="tenant-panel !p-6"><div className="tenant-skeleton-premium h-32 w-full rounded-xl" /></div>
                    </div>
                    <div className="space-y-5">
                        <div className="tenant-panel !p-6"><div className="tenant-skeleton-premium h-40 w-full rounded-xl" /></div>
                        <div className="tenant-panel !p-6"><div className="tenant-skeleton-premium h-52 w-full rounded-xl" /></div>
                    </div>
                </div>
            </PortalPage>
        );
    }

    if (isError) {
        return (
            <PortalPage>
                <PortalPageHeader icon={Home} eyebrow="Your home" title="Lease" />
                <PortalErrorState
                    title="Couldn't load your lease"
                    description="This is usually temporary. Check your connection and try again."
                    onRetry={() => refetch()}
                />
            </PortalPage>
        );
    }

    if (!lease) {
        return (
            <PortalPage>
                <PortalPageHeader icon={Home} eyebrow="Your home" title="Lease" />
                <PortalCard padded={false}>
                    <PortalEmptyState
                        icon={Home}
                        title="No active lease yet"
                        description="Your lease will appear here once your reservation is confirmed and your landlord creates the agreement."
                    />
                </PortalCard>
            </PortalPage>
        );
    }

    const canPay = lease.status === "ACTIVE";
    const leaseStatus = lease.status;

    // Expiry alerts
    const daysLeft = daysUntil(lease.endDate);
    const expiringUrgent = canPay && daysLeft >= 0 && daysLeft <= 30;
    const expiringSoon = canPay && daysLeft >= 0 && daysLeft <= 90 && daysLeft > 30;

    const hasManager = !!(lease.managerName || lease.managerPhone || lease.managerEmail || lease.emergencyContactPhone);

    return (
        <PortalPage>
            <PortalPageHeader
                icon={Home}
                thumbnailUrl={lease.propertyThumbnailUrl}
                eyebrow="Your home"
                title={lease.propertyName}
                subtitle={lease.unitLabel ? `${lease.unitNumber} · ${lease.unitLabel}` : `Unit ${lease.unitNumber}`}
                actions={
                    <span className={`${LEASE_STATUS_STYLE[leaseStatus?.toUpperCase?.()] ?? "badge-neutral"} !text-[10px]`}>
                        {leaseStatus?.toLowerCase()}
                    </span>
                }
            />

            {/* ── Lease Hero ──────────────────────────────────────── */}
            <LeaseHeroCard
                lease={lease}
                monthlyRent={monthlyRent}
                nextDueDate={dashboardData?.nextDueDate ?? null}
            />

            {/* ── Alert Banners ──────────────────────────────────── */}
            {!canPay && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="tenant-panel !p-4 sm:!p-5 flex items-start gap-3.5 border-l-4 border-l-warning"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning-dark dark:text-warning">
                        <Clock className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            This tenancy is {leaseStatus?.toLowerCase?.().replace(/_/g, " ") ?? "no longer active"}
                        </p>
                        <p className="mt-0.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                            Rent collection is closed for this lease. Your payment history and receipts remain available for your records.
                        </p>
                    </div>
                </motion.div>
            )}

            {(expiringUrgent || expiringSoon) && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className={`tenant-panel !p-4 sm:!p-5 flex items-start gap-3.5 border-l-4 ${expiringUrgent ? "border-l-danger" : "border-l-warning"}`}
                >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${expiringUrgent ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning-dark dark:text-warning"}`}>
                        <CalendarClock className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            {daysLeft === 0 ? "Your lease expires today" : daysLeft === 1 ? "Your lease expires tomorrow" : `Your lease expires in ${daysLeft} days`}
                        </p>
                        <p className="mt-0.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                            {expiringUrgent ? "Contact your landlord urgently to confirm renewal or plan your move-out." : "Reach out to your landlord to discuss renewal."}
                        </p>
                    </div>
                    {lease.landlordPhone && (
                        <a href={`tel:${lease.landlordPhone}`} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-warning/30 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-warning-dark dark:text-warning hover:bg-warning/10 active:scale-95 transition-all">
                            <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                            Call landlord
                        </a>
                    )}
                </motion.div>
            )}

            {overdueAmount > 0 && canPay && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 bg-danger/5 border border-danger/20"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10">
                            <AlertCircle className="h-4 w-4 text-danger" strokeWidth={2} />
                        </div>
                        <p className="text-sm text-fg dark:text-fg-dark">
                            <span className="font-bold text-danger">{formatCurrency(overdueAmount)} overdue</span>
                            {" — "}paying now keeps your record clean.
                        </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-danger shrink-0" strokeWidth={2} />
                </motion.div>
            )}

            {/* ── Main content grid ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — pay + deposit + terms */}
                <div className="lg:col-span-2 space-y-5">
                    <LeasePayWidget
                        currentBalance={currentBalance}
                        overdueAmount={overdueAmount}
                        monthlyRent={monthlyRent}
                        tenantPhone={tenantPhone}
                        leaseStatus={leaseStatus}
                    />
                    {deposit && <DepositCard deposit={deposit} />}
                    <LeaseTermsCard terms={lease.terms} />
                </div>

                {/* Right sidebar — auto-pay + landlord + manager */}
                <div className="space-y-5">
                    {autoPaySettings && (
                        <AutoPayCard
                            autoPaySettings={autoPaySettings}
                            tenantPhone={tenantPhone}
                            isHighlighted={setupAutoPay}
                            cardRef={autoPayCardRef}
                        />
                    )}
                    <LandlordContactCard lease={lease} />
                    {hasManager && <ManagerContactCard lease={lease} />}
                </div>
            </div>
        </PortalPage>
    );
};

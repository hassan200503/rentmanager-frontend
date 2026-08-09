// components/tenant-dashboard.tsx
"use client";

import { useTenantDashboardQuery } from "../hooks/use-tenant-portal-queries";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tenantPortalApi } from "../api/tenant-portal-api";
import { PlatformReviewCard } from "@/features/reviews/components/platform-review-card";
import { Loader2, AlertTriangle, Home, CreditCard, AlertCircle as AlertCircleIcon, TrendingUp, ChevronRight, Smartphone, ArrowDownLeft, ArrowUpRight, Receipt, Wallet, Wrench } from "lucide-react";
import Link from "next/link";

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: Math.abs(amount) < 1 ? 2 : 0 }).format(amount);

export const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

export const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const KpiCard = ({ icon: Icon, label, value, trend, iconColor, iconBg, className = "" }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    trend?: { value: number; positive: boolean };
    iconColor?: string;
    iconBg?: string;
    className?: string;
}) => (
    <div className={`card-elevated transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dropdown ${className}`}>
        <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg || "var(--color-brand-50)", color: iconColor || "var(--color-brand)" }}>
                <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
            </div>
        </div>
        <p className="kpi-label mb-1">{label}</p>
        <p className="kpi-value mb-1.5" aria-live="polite">{value}</p>
        {trend && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend.positive ? "text-success" : "text-danger"}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d={trend.positive ? "M5 1.5L8.5 6H1.5L5 1.5Z" : "M5 7L1.5 2H8.5L5 7Z"} fill="currentColor" />
                </svg>
                {trend.value}%
            </span>
        )}
    </div>
);

export const StatusBadge = ({ status }: { status: string }) => {
    const statusMap: Record<string, string> = {
        ACTIVE: "badge-emerald",
        EXPIRED: "badge-neutral",
        TERMINATED: "badge-danger",
        PENDING: "badge-warning",
        DUE: "badge-warning",
        PARTIALLY_PAID: "badge-info",
        OVERDUE: "badge-danger",
        PAID: "badge-emerald",
        OVERPAID: "badge-brand",
    };
    const cls = statusMap[status?.toUpperCase?.()] ?? "badge-neutral";
    return <span className={`${cls} !text-[10px]`}>{status?.toLowerCase()}</span>;
};

export const TenantDashboard = () => {
    const router = useRouter();
    const { data, isLoading, isError, refetch } = useTenantDashboardQuery();

    const [payState, setPayState] = useState<"idle" | "phone_prompt" | "initiating" | "pending" | "success" | "error">("idle");
    const [payMessage, setPayMessage] = useState("");
    const [payAmount, setPayAmount] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState("");
    const [requestId, setRequestId] = useState<string | null>(null);
    const [sentToPhone, setSentToPhone] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        const amount = parseFloat(payAmount || ((data?.currentBalance ?? 0).toString()));
        if (isNaN(amount) || amount <= 0) return;
        const phone = (mpesaPhone || data?.tenantPhone || "").replace(/\s+/g, "");
        if (!phone) return;

        setPayState("initiating");
        setPayMessage("");
        try {
            const result = await tenantPortalApi.initiatePortalPayment(amount, phone);
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
    }, [payAmount, data, mpesaPhone, checkStatus]);

    const refreshStatus = useCallback(async () => {
        if (requestId) {
            setPayMessage("Checking…");
            await checkStatus(requestId);
        }
    }, [requestId, checkStatus]);

    const resetPay = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        setPayState("idle");
        setPayMessage("");
        setPayAmount("");
        setRequestId(null);
        setSentToPhone("");
        setMpesaPhone("");
    }, []);

    if (isLoading) {
        return (
            <div className="page-container space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="card-elevated p-4 space-y-2">
                            <div className="skeleton h-3 w-1/3" />
                            <div className="skeleton h-7 w-1/2" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card-elevated p-4"><div className="skeleton h-48 w-full" /></div>
                    <div className="card-elevated p-4"><div className="skeleton h-48 w-full" /></div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-container">
                <div className="card p-6 text-center max-w-md mx-auto">
                    <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load dashboard</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Please try again</p>
                    <button onClick={() => refetch()} className="btn-outline btn-sm">Retry</button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="page-container">
                <div className="card p-8 text-center max-w-md mx-auto">
                    <Home className="h-12 w-12 mx-auto text-fg-muted dark:text-fg-muted-dark mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No lease yet</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Your portal will activate once your reservation is confirmed and lease is created.</p>
                </div>
            </div>
        );
    }

    const { tenantName, tenantPhone, currentBalance, nextDueDate, overdueAmount, leaseStatus, unitNumber, propertyName, monthlyRent } = data;

    const isOverdue = overdueAmount > 0;
    const canPay = leaseStatus === "ACTIVE";

    const payButtonDisabled = payState === "initiating" || payState === "pending";

    return (
        <div className="page-container space-y-6 animate-fade-in-up">
            {/* Welcome Header */}
            <div className="hero-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Welcome back</p>
                        <h1 className="page-title !text-[1.75rem] mt-1">{tenantName}</h1>
                        <p className="page-subtitle !text-sm mt-1">Unit {unitNumber} · {propertyName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700">
                            <span className="status-dot-success status-dot-live" />
                            {leaseStatus?.toLowerCase()}
                        </span>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <KpiCard
                        icon={CreditCard}
                        label="Balance Due"
                        value={formatCurrency(Math.max(0, currentBalance))}
                        iconColor={isOverdue ? "var(--color-danger)" : "var(--color-brand)"}
                        iconBg={isOverdue ? "var(--color-danger-bg)" : "var(--color-brand-50)"}
                        trend={isOverdue ? { value: Math.round((overdueAmount / monthlyRent) * 100), positive: false } : undefined}
                    />
                    <KpiCard
                        icon={AlertCircleIcon}
                        label="Overdue"
                        value={formatCurrency(overdueAmount)}
                        iconColor="var(--color-danger)"
                        iconBg="var(--color-danger-bg)"
                    />
                    <KpiCard
                        icon={TrendingUp}
                        label="Next Due"
                        value={nextDueDate ? formatDate(nextDueDate) : "—"}
                        iconColor={isOverdue ? "var(--color-warning)" : "var(--color-success)"}
                        iconBg={isOverdue ? "var(--color-warning-bg)" : "var(--color-success-bg)"}
                    />
                    <KpiCard
                        icon={Home}
                        label="Monthly Rent"
                        value={formatCurrency(monthlyRent)}
                        iconColor="var(--color-brand)"
                        iconBg="var(--color-brand-50)"
                    />
                </div>
            </div>

            {/* Quick Actions & Payment History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card-elevated lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-header !text-sm !mb-0">Recent Payments</h3>
                        <Link href="/portal/payments" className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--color-brand)" }}>
                            View all <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                        </Link>
                    </div>
                    <TenantRecentPayments payments={data.recentPayments} />
                </div>

                <div className="card-elevated">
                    <h3 className="section-header !text-sm !mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        {payState === "phone_prompt" && canPay && (
                            <div className="card-sm space-y-3 mb-3">
                                <p className="text-xs font-medium text-fg dark:text-fg-dark">Pay {formatCurrency(parseFloat(payAmount || currentBalance.toString()))}</p>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-1 block">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted dark:text-fg-muted-dark font-mono-nums text-sm">KSh</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={payAmount || currentBalance}
                                            onChange={(e) => setPayAmount(e.target.value)}
                                            className="input-field pl-12 w-full text-sm"
                                            disabled={payButtonDisabled}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-1 block">M-Pesa Number</label>
                                    <input
                                        type="tel"
                                        value={mpesaPhone || tenantPhone || ""}
                                        onChange={(e) => setMpesaPhone(e.target.value)}
                                        placeholder="+254712345678"
                                        className="input-field w-full text-sm"
                                        disabled={payButtonDisabled}
                                        onKeyDown={(e) => { if (e.key === "Enter") initiatePayment(); }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        onClick={initiatePayment}
                                        disabled={payButtonDisabled || !(mpesaPhone || tenantPhone)}
                                        className="btn-primary btn-sm flex-1"
                                    >
                                        {payButtonDisabled ? (
                                            <><Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> Sending...</>
                                        ) : (
                                            <><Smartphone className="h-3 w-3" strokeWidth={2} /> Pay {formatCurrency(parseFloat(payAmount || currentBalance.toString()))}</>
                                        )}
                                    </button>
                                    <button
                                        onClick={resetPay}
                                        disabled={payButtonDisabled}
                                        className="btn-outline btn-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {payState === "initiating" && (
                            <div className="card-sm space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={2} />
                                    <span className="font-medium text-fg dark:text-fg-dark">Sending payment request…</span>
                                </div>
                            </div>
                        )}

                        {payState === "pending" && (
                            <div className="card-sm space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={2} />
                                    <span className="font-medium text-fg dark:text-fg-dark">Awaiting M-Pesa confirmation</span>
                                </div>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{payMessage}</p>
                                {sentToPhone && (
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                        Sent to <span className="font-medium font-mono-nums">{sentToPhone}</span>
                                    </p>
                                )}
                                <button onClick={refreshStatus} className="btn-outline btn-sm mt-1">Check Status</button>
                            </div>
                        )}

                        {payState === "error" && (
                            <div className="card-sm space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={2} />
                                    <span className="font-medium text-danger">Payment failed</span>
                                </div>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{payMessage}</p>
                                <button onClick={resetPay} className="btn-outline btn-sm">Try again</button>
                            </div>
                        )}

                        {payState === "idle" && canPay && (
                            <div className="space-y-3 mb-3">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-1 block">Amount to pay</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted dark:text-fg-muted-dark font-mono-nums text-sm">KSh</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={payAmount || currentBalance}
                                            onChange={(e) => setPayAmount(e.target.value)}
                                            className="input-field pl-12 w-full text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPayState("phone_prompt")}
                                    disabled={!payAmount && currentBalance <= 0}
                                    className="btn-primary w-full justify-center gap-2 py-2.5"
                                >
                                    <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                                    Continue to Payment
                                </button>
                            </div>
                        )}

                        <Link href="/portal/payments" className="group flex items-center gap-3 p-3 rounded-xl border border-border dark:border-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15 transition-all duration-200">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                                <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">View Payment History</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Download receipts, check status</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark group-hover:text-brand dark:group-hover:text-brand-400 transition-colors" strokeWidth={2} />
                        </Link>
                        <Link href="/portal/lease" className="group flex items-center gap-3 p-3 rounded-xl border border-border dark:border-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15 transition-all duration-200">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                                <Home className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">Lease Agreement</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">View terms, landlord contacts</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark group-hover:text-brand dark:group-hover:text-brand-400 transition-colors" strokeWidth={2} />
                        </Link>
                        <Link href="/portal/maintenance" className="group flex items-center gap-3 p-3 rounded-xl border border-border dark:border-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15 transition-all duration-200">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                                <Wrench className="h-4 w-4" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">Maintenance Request</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Submit a repair request</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark group-hover:text-brand dark:group-hover:text-brand-400 transition-colors" strokeWidth={2} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Rate the platform */}
            <PlatformReviewCard />
        </div>
    );
};

const TenantRecentPayments = ({ payments }: { payments: Array<{
    id: string;
    type: string;
    amount: number;
    source: string;
    externalReference: string | null;
    occurredAt: string;
    status: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    mpesaTransactionId: string | null;
}> }) => {
    if (!payments || payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-border-subtle dark:bg-border-subtle-dark mb-3">
                    <CreditCard className="h-6 w-6 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-fg dark:text-fg-dark">No payments yet</p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">Your payment history will appear here</p>
            </div>
        );
    }

    const TYPE_LABELS: Record<string, string> = {
        RENT_CHARGE: "Rent Charge",
        PAYMENT: "Payment",
        WAIVER: "Waiver",
        REFUND: "Refund",
        CREDIT_APPLIED: "Credit Applied",
        ADJUSTMENT: "Adjustment",
        DEPOSIT: "Deposit",
    };

    const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
        PAYMENT: { icon: ArrowDownLeft, color: "var(--color-success)", bg: "var(--color-success-bg)" },
        RENT_CHARGE: { icon: ArrowUpRight, color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
        DEPOSIT: { icon: Wallet, color: "var(--color-brand)", bg: "var(--color-brand-50)" },
    };

    return (
        <div className="space-y-2">
            {payments.slice(0, 5).map((tx) => {
                const meta = TYPE_META[tx.type] ?? { icon: Receipt, color: "var(--color-fg-muted)", bg: "var(--color-border-subtle)" };
                const MetaIcon = meta.icon;
                return (
                    <div key={tx.id} className="card-sm flex items-center gap-3 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: meta.bg, color: meta.color }}>
                            <MetaIcon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-fg dark:text-fg-dark">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark truncate">
                                {formatDate(tx.occurredAt)}
                                {tx.externalReference ? ` · ${tx.externalReference}` : ""}
                                {tx.mpesaTransactionId ? ` · M-Pesa: ${tx.mpesaTransactionId}` : ""}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <p className={`font-mono-nums font-semibold text-sm ${tx.type === "RENT_CHARGE" ? "text-danger" : tx.type === "PAYMENT" ? "text-success" : "text-fg"}`}>
                                {tx.type === "RENT_CHARGE" ? "+" : tx.type === "ADJUSTMENT" ? "" : "−"}{formatCurrency(tx.amount)}
                            </p>
                            <StatusBadge status={tx.status} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
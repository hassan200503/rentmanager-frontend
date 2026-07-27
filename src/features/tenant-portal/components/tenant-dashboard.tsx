// components/tenant-dashboard.tsx
"use client";

import { useTenantDashboardQuery } from "../hooks/use-tenant-portal-queries";
import { useCallback, useRef, useState } from "react";
import { tenantPortalApi, type RentPaymentRequestResponse } from "../api/tenant-portal-api";
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle, Home, CreditCard, AlertCircle as AlertCircleIcon, TrendingUp, ChevronRight, Smartphone, ExternalLink } from "lucide-react";
import Link from "next/link";

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

export const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

export const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const KpiCard = ({ icon: Icon, label, value, trend, subtitle, iconColor, iconBg, className = "", badge }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    trend?: { value: number; positive: boolean };
    subtitle?: string;
    iconColor?: string;
    iconBg?: string;
    className?: string;
    badge?: { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" | "emerald" };
}) => (
    <div className={`card-elevated ${className}`}>
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
    const { data, isLoading, isError, refetch } = useTenantDashboardQuery();

    if (isLoading) {
        return (
            <div className="space-y-6">
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
            <div className="card p-6 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load dashboard</p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Please try again</p>
                <button onClick={() => refetch()} className="btn-outline btn-sm">Retry</button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="card p-8 text-center">
                <Home className="h-12 w-12 mx-auto text-fg-muted dark:text-fg-muted-dark mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No lease yet</p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Your portal will activate once your reservation is confirmed and lease is created.</p>
            </div>
        );
    }

    const { tenantName, tenantPhone, tenantEmail, currentBalance, currentEntryId, nextDueDate, nextDueAmount, overdueAmount, leaseStatus, unitNumber, propertyName, monthlyRent, depositAmount } = data;

    const isOverdue = overdueAmount > 0;
    const hasActiveLease = leaseStatus === "ACTIVE";
    const canPay = hasActiveLease && currentEntryId && currentBalance > 0;

    const [payState, setPayState] = useState<"idle" | "phone_prompt" | "initiating" | "pending" | "success" | "error">("idle");
    const [payMessage, setPayMessage] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState(tenantPhone || "");
    const [requestId, setRequestId] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const initiatePayment = useCallback(async () => {
        if (!currentEntryId) return;
        setPayState("initiating");
        setPayMessage("");
        try {
            const result = await tenantPortalApi.collectPayment(currentEntryId, mpesaPhone);
            setRequestId(result.id);
            setPayState("pending");
            setPayMessage("STK push sent! Check your phone and enter your M-Pesa PIN to complete payment.");

            // Poll for status up to 10 times (every 5s = 50s total)
            let attempts = 0;
            pollRef.current = setInterval(async () => {
                attempts++;
                try {
                    const status = await tenantPortalApi.getPaymentRequestStatus(result.id);
                    if (status.status === "PAID") {
                        clearInterval(pollRef.current!);
                        pollRef.current = null;
                        setPayState("success");
                        setPayMessage("Payment received successfully!");
                        setTimeout(() => { refetch(); }, 1500);
                    } else if (status.status === "FAILED") {
                        clearInterval(pollRef.current!);
                        pollRef.current = null;
                        setPayState("error");
                        setPayMessage("Payment failed. Please try again.");
                    } else if (attempts >= 10) {
                        clearInterval(pollRef.current!);
                        pollRef.current = null;
                        setPayState("pending");
                        setPayMessage("Still waiting for confirmation. You can check your payment status on the Payments page.");
                    }
                } catch {
                    // ignore poll errors — retry next interval
                }
            }, 5000);
        } catch (err) {
            setPayState("error");
            setPayMessage(String(err) || "Failed to initiate payment. Please try again.");
        }
    }, [currentEntryId, mpesaPhone, refetch]);

    const resetPay = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
        setPayState("idle");
        setPayMessage("");
        setRequestId(null);
        setMpesaPhone(tenantPhone || "");
    };

    const payButtonDisabled = payState === "initiating" || payState === "pending";

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="hero-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-base font-semibold text-fg dark:text-fg-dark">Welcome back,</p>
                        <h1 className="page-title !text-[1.75rem] mt-0.5">{tenantName}</h1>
                        <p className="page-subtitle !text-sm mt-1">Unit {unitNumber} · {propertyName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={leaseStatus} />
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
                        badge={overdueAmount > 0 ? { label: "Action needed", variant: "danger" } : { label: "Clear", variant: "emerald" }}
                    />
                    <KpiCard
                        icon={TrendingUp}
                        label="Next Due"
                        value={nextDueDate ? formatDate(nextDueDate) : "—"}
                        subtitle={nextDueAmount > 0 ? formatCurrency(nextDueAmount) : "No upcoming payment"}
                        iconColor={isOverdue ? "var(--color-warning)" : "var(--color-success)"}
                        iconBg={isOverdue ? "var(--color-warning-bg)" : "var(--color-success-bg)"}
                    />
                    <KpiCard
                        icon={Home}
                        label="Monthly Rent"
                        value={formatCurrency(monthlyRent)}
                        subtitle="Fixed for lease term"
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
                                <p className="text-xs font-medium text-fg dark:text-fg-dark">Enter your M-Pesa number</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="tel"
                                        value={mpesaPhone}
                                        onChange={(e) => setMpesaPhone(e.target.value)}
                                        placeholder="+254712345678"
                                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                                            focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                        disabled={payButtonDisabled}
                                        onKeyDown={(e) => { if (e.key === "Enter") initiatePayment(); }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={initiatePayment}
                                        disabled={payButtonDisabled || !mpesaPhone}
                                        className="btn-primary btn-sm flex-1"
                                    >
                                        {payButtonDisabled ? (
                                            <><Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> Sending...</>
                                        ) : (
                                            <><Smartphone className="h-3 w-3" strokeWidth={2} /> Confirm</>
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

                        {payState === "pending" && (
                            <div className="card-sm space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={2} />
                                    <span className="font-medium text-fg dark:text-fg-dark">Awaiting M-Pesa confirmation</span>
                                </div>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{payMessage}</p>
                            </div>
                        )}

                        {payState === "success" && (
                            <div className="card-sm space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={2} />
                                    <span className="font-medium text-success">Payment successful!</span>
                                </div>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Your dashboard will update shortly.</p>
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
                            <button
                                onClick={() => setPayState("phone_prompt")}
                                className="btn-primary w-full justify-start gap-3 py-3"
                            >
                                <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                                <div>
                                    <p className="font-medium">Pay Now</p>
                                    <p className="text-xs opacity-80">{formatCurrency(currentBalance)} due</p>
                                </div>
                            </button>
                        )}

                        <Link href="/portal/payments" className="btn-secondary w-full justify-start gap-3 py-3">
                            <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                            <div>
                                <p className="font-medium text-fg dark:text-fg-dark">View Payment History</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Download receipts, check status</p>
                            </div>
                        </Link>
                        <Link href="/portal/lease" className="btn-secondary w-full justify-start gap-3 py-3">
                            <Home className="h-5 w-5" strokeWidth={1.75} />
                            <div>
                                <p className="font-medium text-fg dark:text-fg-dark">Lease Agreement</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">View terms, landlord contacts</p>
                            </div>
                        </Link>
                        <button className="btn-secondary w-full justify-start gap-3 py-3" disabled>
                            <Loader2 className="h-5 w-5" strokeWidth={1.75} />
                            <div>
                                <p className="font-medium text-fg dark:text-fg-dark">Maintenance Request</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Submit a repair request (coming soon)</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
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
            <div className="p-6 text-center">
                <CreditCard className="h-10 w-10 mx-auto text-fg-muted dark:text-fg-muted-dark mb-2" strokeWidth={1.5} />
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">No payment history yet</p>
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

    return (
        <div className="space-y-2">
            {payments.slice(0, 5).map((tx) => (
                <div key={tx.id} className="card-sm flex items-center justify-between gap-4">
                    <div>
                        <p className="font-medium text-fg dark:text-fg-dark">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {formatDate(tx.occurredAt)}
                            {tx.externalReference ? ` · ${tx.externalReference}` : ""}
                            {tx.mpesaTransactionId ? ` · M-Pesa: ${tx.mpesaTransactionId}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className={`font-mono-nums font-medium ${tx.type === "RENT_CHARGE" ? "text-danger" : tx.type === "PAYMENT" ? "text-success" : "text-fg"}`}>
                            {tx.type === "RENT_CHARGE" ? "+" : tx.type === "ADJUSTMENT" ? "" : "−"}{formatCurrency(tx.amount)}
                        </p>
                        <StatusBadge status={tx.status} />
                    </div>
                </div>
            ))}
        </div>
    );
};
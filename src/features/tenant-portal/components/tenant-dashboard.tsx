// components/tenant-dashboard.tsx
"use client";

import { useTenantDashboardQuery } from "../hooks/use-tenant-portal-queries";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tenantPortalApi } from "../api/tenant-portal-api";
import {
    AlertCircle as AlertCircleIcon,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    FileText,
    Home,
    Loader2,
    Receipt,
    ShieldCheck,
    Smartphone,
    TrendingUp,
    Wallet,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";

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

export const StatusBadge = ({ status }: { status: string }) => (
    <span className={`tenant-status-chip tenant-status-chip-${statusTone(status)} inline-flex`}>
        {titleCaseStatus(status)}
    </span>
);

const KpiCard = ({
    icon,
    label,
    value,
    hint,
    tone = "neutral",
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    hint?: string;
    tone?: "brand" | "success" | "warning" | "danger" | "neutral";
}) => {
    const Icon = icon;

    return (
        <div className={`tenant-kpi-card tenant-kpi-${tone} tenant-kpi-premium`}>
            <div className="tenant-kpi-icon tenant-kpi-icon-premium">
                <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
                <p className="tenant-kpi-label">{label}</p>
                <p className="tenant-kpi-value" aria-live="polite">{value}</p>
                {hint && <p className="tenant-kpi-hint">{hint}</p>}
            </div>
        </div>
    );
};

const ActionLink = ({
    href,
    icon,
    title,
    description,
}: {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
}) => {
    const Icon = icon;

    return (
        <Link href={href} className="tenant-action-row tenant-action-row-premium group">
            <span className="tenant-action-icon">
                <Icon className="h-4 w-4" strokeWidth={1.9} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="tenant-action-title">{title}</span>
                <span className="tenant-action-description">{description}</span>
            </span>
            <ChevronRight className="tenant-action-chevron h-4 w-4" strokeWidth={2.2} />
        </Link>
    );
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
                if (pollRef.current) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
                router.push(`/portal/payment-success?requestId=${rid}`);
                return true;
            }
            if (status.status === "FAILED") {
                if (pollRef.current) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
                setPayState("error");
                setPayMessage("Payment failed. Please try again.");
                return true;
            }
        } catch {
            // Polling should stay quiet; the user can manually check again.
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
            setPayMessage("STK push sent. Check your phone and enter your M-Pesa PIN to complete payment.");

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
            setPayMessage("Checking...");
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
            <div className="tenant-dashboard-page page-container space-y-5">
                <div className="tenant-skeleton-hero tenant-skeleton-premium" style={{ height: "16rem" }} />
                <div className="tenant-kpi-grid">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="tenant-kpi-card">
                            <div className="tenant-skeleton-premium h-9 w-9" style={{ borderRadius: "0.78rem" }} />
                            <div className="flex-1 space-y-2">
                                <div className="tenant-skeleton-premium h-3 w-1/3" />
                                <div className="tenant-skeleton-premium h-7 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="tenant-dashboard-grid">
                    <div className="tenant-panel">
                        <div className="tenant-skeleton-premium h-60 w-full" />
                    </div>
                    <div className="tenant-panel">
                        <div className="tenant-skeleton-premium h-60 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="tenant-dashboard-page page-container">
                <div className="tenant-empty-state">
                    <AlertTriangle className="h-9 w-9 text-danger" strokeWidth={1.6} />
                    <div>
                        <p className="tenant-empty-title">Failed to load dashboard</p>
                        <p className="tenant-empty-copy">Please try again.</p>
                    </div>
                    <button onClick={() => refetch()} className="btn-outline btn-sm">Retry</button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="tenant-dashboard-page page-container">
                <div className="tenant-empty-state">
                    <Home className="h-10 w-10 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.5} />
                    <div>
                        <p className="tenant-empty-title">No lease yet</p>
                        <p className="tenant-empty-copy">Your portal will activate once your reservation is confirmed and lease is created.</p>
                    </div>
                </div>
            </div>
        );
    }

    const {
        tenantName,
        tenantPhone,
        currentBalance,
        nextDueDate,
        nextDueAmount,
        overdueAmount,
        leaseStatus,
        unitNumber,
        propertyName,
        monthlyRent,
    } = data;

    const firstName = tenantName.split(" ").filter(Boolean)[0] ?? tenantName;
    const isOverdue = overdueAmount > 0;
    const hasBalance = currentBalance > 0;
    const canPay = leaseStatus === "ACTIVE";
    const payButtonDisabled = payState === "initiating" || payState === "pending";
    const balanceTone = isOverdue ? "is-overdue" : hasBalance ? "is-due" : "is-clear";
    const balanceHelper = isOverdue
        ? `${formatCurrency(overdueAmount)} is overdue.`
        : hasBalance
            ? "Ready for secure M-Pesa checkout."
            : "All clear. No rent balance is due right now.";
    const nextDueText = nextDueDate ? formatDate(nextDueDate) : "-";
    const payPreviewAmount = parseFloat(payAmount || currentBalance.toString());

    return (
        <div className="tenant-dashboard-page page-container animate-fade-in-up">
            <section className="tenant-hero-panel tenant-premium-hero">
                <div className="tenant-hero-main">
                    <div className="tenant-hero-copy">
                        <p className="tenant-eyebrow">Tenant command center</p>
                        <h1 className="tenant-hero-title tenant-hero-title-premium">Welcome back, {firstName}</h1>
                        <p className="tenant-hero-subtitle">
                            Unit {unitNumber} at {propertyName}
                        </p>
                        <div className="tenant-hero-chips">
                            <StatusBadge status={leaseStatus} />
                            <span className="tenant-context-chip inline-flex">
                                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.9} />
                                {dueSummary(nextDueDate)}
                            </span>
                            <span className="tenant-context-chip inline-flex">
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.9} />
                                Verified portal
                            </span>
                        </div>
                    </div>

                    <div className={`tenant-balance-card tenant-balance-card-premium ${balanceTone}`}>
                        <div className="tenant-balance-gradient-overlay"></div>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="tenant-balance-label">Balance due</p>
                                <p className="tenant-balance-value">{formatCurrency(Math.max(0, currentBalance))}</p>
                            </div>
                            <div className="tenant-balance-icon">
                                {hasBalance ? (
                                    <Wallet className="h-5 w-5" strokeWidth={1.9} />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.9} />
                                )}
                            </div>
                        </div>
                        <p className="tenant-balance-copy">{balanceHelper}</p>
                        <div className="tenant-balance-strip">
                            <span>
                                <span>Overdue</span>
                                <strong>{formatCurrency(overdueAmount)}</strong>
                            </span>
                            <span>
                                <span>Next due</span>
                                <strong>{nextDueText}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="tenant-kpi-grid" aria-label="Rent summary">
                <KpiCard
                    icon={CreditCard}
                    label="Balance Due"
                    value={formatCurrency(Math.max(0, currentBalance))}
                    hint={hasBalance ? "Outstanding now" : "Account settled"}
                    tone={isOverdue ? "danger" : hasBalance ? "warning" : "success"}
                />
                <KpiCard
                    icon={AlertCircleIcon}
                    label="Overdue"
                    value={formatCurrency(overdueAmount)}
                    hint={isOverdue ? "Needs attention" : "No arrears"}
                    tone={isOverdue ? "danger" : "neutral"}
                />
                <KpiCard
                    icon={TrendingUp}
                    label="Next Due"
                    value={nextDueText}
                    hint={nextDueAmount > 0 ? formatCurrency(nextDueAmount) : dueSummary(nextDueDate)}
                    tone={isOverdue ? "warning" : "brand"}
                />
                <KpiCard
                    icon={Home}
                    label="Monthly Rent"
                    value={formatCurrency(monthlyRent)}
                    hint="Recurring lease charge"
                    tone="neutral"
                />
            </section>

            <div className="tenant-dashboard-grid">
                <section className="tenant-panel tenant-panel-premium tenant-ledger-panel">
                    <div className="tenant-panel-header">
                        <div>
                            <p className="tenant-panel-kicker">Ledger</p>
                            <h2 className="tenant-panel-title">Recent payments</h2>
                        </div>
                        <Link href="/portal/payments" className="tenant-panel-link">
                            View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </Link>
                    </div>
                    <TenantRecentPayments payments={data.recentPayments} />
                </section>

                <aside className="tenant-panel tenant-panel-premium tenant-payment-panel">
                    <div className="tenant-panel-header">
                        <div>
                            <p className="tenant-panel-kicker">M-Pesa checkout</p>
                            <h2 className="tenant-panel-title">Quick actions</h2>
                        </div>
                        <span className="tenant-secure-chip inline-flex">
                            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                            Secure
                        </span>
                    </div>

                    <div className="tenant-payment-stack">
                        {payState === "idle" && canPay && (
                            <div className="tenant-pay-box">
                                <div className="tenant-pay-box-header">
                                    <span>Amount to pay</span>
                                    <strong>{formatCurrency(payPreviewAmount || 0)}</strong>
                                </div>
                                <label className="tenant-field-label" htmlFor="tenant-pay-amount">Amount</label>
                                <div className="tenant-money-input">
                                    <span>KSh</span>
                                    <input
                                        id="tenant-pay-amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={payAmount || currentBalance}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="tenant-input tenant-input-premium pl-12"
                                    />
                                </div>
                                <button
                                    onClick={() => setPayState("phone_prompt")}
                                    disabled={!payAmount && currentBalance <= 0}
                                    className="tenant-primary-action tenant-btn-premium-blue"
                                >
                                    <Smartphone className="h-4 w-4" strokeWidth={2} />
                                    Continue to Payment
                                </button>
                                <p className="tenant-payment-footnote">
                                    {hasBalance ? "You will confirm the phone number before the STK push is sent." : "No balance is due. Enter a custom amount to make an advance payment."}
                                </p>
                            </div>
                        )}

                        {payState === "phone_prompt" && canPay && (
                            <div className="tenant-pay-box">
                                <div className="tenant-pay-box-header">
                                    <span>Confirm payment</span>
                                    <strong>{formatCurrency(payPreviewAmount || 0)}</strong>
                                </div>
                                <label className="tenant-field-label" htmlFor="tenant-confirm-amount">Amount</label>
                                <div className="tenant-money-input">
                                    <span>KSh</span>
                                    <input
                                        id="tenant-confirm-amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={payAmount || currentBalance}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        className="tenant-input tenant-input-premium pl-12"
                                        disabled={payButtonDisabled}
                                    />
                                </div>
                                <label className="tenant-field-label" htmlFor="tenant-mpesa-phone">M-Pesa number</label>
                                <input
                                    id="tenant-mpesa-phone"
                                    type="tel"
                                    value={mpesaPhone || tenantPhone || ""}
                                    onChange={(e) => setMpesaPhone(e.target.value)}
                                    placeholder="+254712345678"
                                    className="tenant-input tenant-input-premium"
                                    disabled={payButtonDisabled}
                                    onKeyDown={(e) => { if (e.key === "Enter") initiatePayment(); }}
                                />
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <button
                                        onClick={initiatePayment}
                                        disabled={payButtonDisabled || !(mpesaPhone || tenantPhone)}
                                        className="tenant-primary-action tenant-btn-premium-blue"
                                    >
                                        {payButtonDisabled ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Smartphone className="h-4 w-4" strokeWidth={2} />
                                                Pay now
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={resetPay}
                                        disabled={payButtonDisabled}
                                        className="tenant-secondary-action tenant-btn-premium-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {payState === "initiating" && (
                            <div className="tenant-payment-state tenant-payment-state-premium">
                                <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                                <div>
                                    <p>Sending payment request</p>
                                    <span>Preparing your M-Pesa STK push.</span>
                                </div>
                            </div>
                        )}

                        {payState === "pending" && (
                            <div className="tenant-payment-state tenant-payment-state-premium">
                                <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                                <div className="min-w-0">
                                    <p>Awaiting M-Pesa confirmation</p>
                                    <span>{payMessage}</span>
                                    {sentToPhone && <span>Sent to <strong>{sentToPhone}</strong></span>}
                                    <button onClick={refreshStatus} className="tenant-secondary-action tenant-btn-premium-secondary mt-3">Check status</button>
                                </div>
                            </div>
                        )}

                        {payState === "error" && (
                            <div className="tenant-payment-state tenant-payment-state-premium is-error">
                                <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                                <div>
                                    <p>Payment failed</p>
                                    <span>{payMessage}</span>
                                    <button onClick={resetPay} className="tenant-secondary-action tenant-btn-premium-secondary mt-3">Try again</button>
                                </div>
                            </div>
                        )}

                        {!canPay && (
                            <div className="tenant-payment-state tenant-payment-state-premium">
                                <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={2} />
                                <div>
                                    <p>Payments paused</p>
                                    <span>Your lease status is {titleCaseStatus(leaseStatus)}.</span>
                                </div>
                            </div>
                        )}

                        <div className="tenant-action-list">
                            <ActionLink
                                href="/portal/payments"
                                icon={CreditCard}
                                title="View payment history"
                                description="Receipts, status, and ledger details"
                            />
                            <ActionLink
                                href="/portal/lease"
                                icon={FileText}
                                title="Lease agreement"
                                description="Terms, rent cycle, and contacts"
                            />
                            <ActionLink
                                href="/portal/maintenance"
                                icon={Wrench}
                                title="Maintenance request"
                                description="Submit and track repair requests"
                            />
                        </div>
                    </div>
                </aside>
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
            <div className="tenant-ledger-empty tenant-empty-state-premium">
                <div className="tenant-ledger-empty-icon">
                    <CreditCard className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <div>
                    <p>No payments yet</p>
                    <span>Your payment history will appear here once a transaction is recorded.</span>
                </div>
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

    const TYPE_META: Record<string, { icon: LucideIcon; tone: string }> = {
        PAYMENT: { icon: ArrowDownLeft, tone: "success" },
        RENT_CHARGE: { icon: ArrowUpRight, tone: "danger" },
        DEPOSIT: { icon: Wallet, tone: "brand" },
        REFUND: { icon: ArrowUpRight, tone: "warning" },
    };

    return (
        <div className="tenant-ledger-list">
            {payments.slice(0, 5).map((tx) => {
                const meta = TYPE_META[tx.type] ?? { icon: Receipt, tone: "neutral" };
                const MetaIcon = meta.icon;
                const reference = tx.mpesaTransactionId
                    ? `M-Pesa: ${tx.mpesaTransactionId}`
                    : tx.externalReference ?? tx.source;
                const isCharge = tx.type === "RENT_CHARGE";
                const amountPrefix = isCharge ? "+" : tx.type === "ADJUSTMENT" ? "" : "-";

                return (
                    <div key={tx.id} className="tenant-ledger-row tenant-ledger-row-premium">
                        <div className={`tenant-ledger-icon tenant-ledger-icon-premium icon-${meta.tone}`}>
                            <MetaIcon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div className="tenant-ledger-main">
                            <div className="tenant-ledger-title-line">
                                <p>{TYPE_LABELS[tx.type] ?? titleCaseStatus(tx.type)}</p>
                                <StatusBadge status={tx.status} />
                            </div>
                            <p className="tenant-ledger-meta">
                                {formatDate(tx.occurredAt)}
                                {reference ? ` - ${reference}` : ""}
                            </p>
                        </div>
                        <p className={`tenant-ledger-amount ${isCharge ? "is-charge" : "is-credit"}`}>
                            {amountPrefix}{formatCurrency(tx.amount)}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

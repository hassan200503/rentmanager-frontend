// components/tenant-lease.tsx
"use client";

import { useTenantDashboardQuery, useTenantLeaseQuery, useTenantPaymentSummaryQuery, useTenantAutoPaySettingsQuery, useTenantDepositQuery } from "../hooks/use-tenant-portal-queries";
import { useToggleAutoPayMutation } from "../hooks/use-tenant-portal-mutations";
import { AlertTriangle, Home, Mail, Phone, Calendar, CreditCard, Shield, FileText, MapPin, User, Clock, Smartphone, Loader2, CheckCircle2, Bell, BellOff, CalendarClock } from "lucide-react";
import { formatDate } from "./tenant-format";
import { formatCurrency } from "@/shared/utils/money";
import { tenantPortalApi, type DepositStatus } from "../api/tenant-portal-api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalPage, PortalPageHeader, PortalCard, PortalEmptyState, PortalErrorState } from "./portal-chrome";

export const TenantLeasePage = () => {
    const { data: dashboardData } = useTenantDashboardQuery();
    const { data: lease, isLoading, isError, refetch } = useTenantLeaseQuery();
    const { data: summary, refetch: refetchSummary } = useTenantPaymentSummaryQuery();
    const { data: autoPaySettings } = useTenantAutoPaySettingsQuery();
    const { data: deposit } = useTenantDepositQuery();
    const toggleAutoPayMut = useToggleAutoPayMutation();
    const searchParams = useSearchParams();
    const autoPay = autoPaySettings?.enabled ?? false;

    const setupAutoPay = searchParams.get("setup") === "autopay";
    const autoPayCardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (setupAutoPay && autoPaySettings && autoPayCardRef.current) {
            autoPayCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            autoPayCardRef.current.focus({ preventScroll: true });
        }
    }, [setupAutoPay, autoPaySettings]);

    const [payState, setPayState] = useState<"idle" | "phone_prompt" | "initiating" | "pending" | "success" | "error">("idle");
    const [payMessage, setPayMessage] = useState("");
    const [payAmount, setPayAmount] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState("");
    const [requestId, setRequestId] = useState<string | null>(null);
    const [sentToPhone, setSentToPhone] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentBalance = summary?.currentBalance ?? 0;
    const leaseStatus = lease?.status;
    const canPay = leaseStatus === "ACTIVE";

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
                setPayState("success");
                setPayMessage("Payment received successfully!");
                setTimeout(() => { refetchSummary(); }, 1500);
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
    }, [refetchSummary]);

    const initiatePayment = useCallback(async () => {
        const amount = parseFloat(payAmount || currentBalance.toString());
        if (isNaN(amount) || amount <= 0) return;
        const phone = (mpesaPhone || dashboardData?.tenantPhone || "").replace(/\s+/g, "");
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
            const message = err instanceof Error ? err.message : "Failed to initiate payment";
            setPayState("error");
            setPayMessage(message);
        }
    }, [payAmount, currentBalance, mpesaPhone, checkStatus, dashboardData?.tenantPhone]);

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
        setRequestId(null);
        setSentToPhone("");
    }, []);

    const handleToggleAutoPay = async () => {
        const next = !autoPay;
        const phone = autoPaySettings?.mpesaPhone || mpesaPhone || dashboardData?.tenantPhone || "";
        await toggleAutoPayMut.mutateAsync({ enabled: next, mpesaPhone: phone });
    };

    // This page previously rolled its own <div className="space-y-6"> wrapper
    // and a hand-built header instead of PortalPage/PortalPageHeader — the
    // same "one page still on its own dialect" gap already found and fixed on
    // the payments page this session. Every state below now goes through the
    // shared chrome, matching tenant-maintenance.tsx's established pattern.
    if (isLoading) {
        return (
            <PortalPage>
                <div className="tenant-panel !p-6"><div className="tenant-skeleton-premium h-8 w-1/4 mb-4" /><div className="tenant-skeleton-premium h-32 w-full" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="tenant-panel !p-6"><div className="tenant-skeleton-premium h-48 w-full" /></div>
                    <div className="tenant-panel !p-6"><div className="tenant-skeleton-premium h-48 w-full" /></div>
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

    const {
        leaseNumber,
        startDate,
        endDate,
        monthlyRent,
        depositAmount,
        status,
        unitNumber,
        unitLabel,
        propertyName,
        propertyAddress,
        landlordName,
        landlordPhone,
        landlordEmail,
        terms,
    } = lease;

    const statusMap: Record<string, string> = {
        ACTIVE: "badge-emerald",
        EXPIRED: "badge-neutral",
        TERMINATED: "badge-danger",
        PENDING: "badge-warning",
    };
    const statusClass = statusMap[status?.toUpperCase?.()] ?? "badge-neutral";

    return (
        <PortalPage>
            {/* Header — was a hand-rolled div mixing .page-title/.kpi-label
                (the generic, pre-portal-chrome typography) inside a
                .tenant-panel; PortalPageHeader is the shared eyebrow/title
                pattern every other portal page already renders through. */}
            <PortalPageHeader
                icon={Home}
                eyebrow="Your home"
                title={propertyName}
                subtitle={unitLabel ? `${unitNumber} · ${unitLabel}` : `Unit ${unitNumber}`}
                actions={
                    <div className="flex items-center gap-3">
                        <span className={`${statusClass} !text-[10px]`}>{status?.toLowerCase()}</span>
                        <div className="text-right">
                            <p className="kpi-label">Monthly Rent</p>
                            <p className="kpi-value font-data">{formatCurrency(monthlyRent)}</p>
                        </div>
                    </div>
                }
            />

            {/* Tenancy-ended notice. Leases expire automatically the night
                after their end date, and until recently that silently locked
                the renter out of this whole portal. They keep read access
                now, so the page has to say plainly which state they are in —
                otherwise an expired lease renders identically to a live one,
                minus a Pay button, with no explanation. */}
            {!canPay && (
                <div className="tenant-panel !p-4 sm:!p-5 flex items-start gap-3.5 border-l-4 border-l-warning">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning">
                        <Clock className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            This tenancy is {status?.toLowerCase() ?? "no longer active"}
                        </p>
                        <p className="mt-0.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                            Rent collection is closed for this lease. Your payment history, receipts and
                            deposit record stay available here for your own records — download anything
                            you need for a deposit claim or a future landlord reference.
                        </p>
                    </div>
                </div>
            )}

            <PortalCard>
                {/* Key Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <LeaseDetailItem icon={Calendar} label="Start Date" value={formatDate(startDate)} />
                    <LeaseDetailItem icon={Calendar} label="End Date" value={endDate ? formatDate(endDate) : "Ongoing"} />
                    {/* "Deposit Paid" was the label here, but this figure is
                        activeLease.getSecurityDeposit() — the amount the lease
                        requires, not a payment confirmation. A renter who hasn't
                        paid a shilling of it yet (no Deposit record exists) would
                        have been told "Deposit Paid: Ksh 30,000" — a materially
                        false claim about their own money. The Security Deposit
                        card lower on this page (rendered only once a real
                        Deposit record exists) is where actual payment status
                        belongs; this slot describes a lease term. */}
                    <LeaseDetailItem icon={CreditCard} label="Security Deposit" value={formatCurrency(depositAmount)} />
                    <LeaseDetailItem icon={Shield} label="Lease #" value={leaseNumber} />
                </div>
            </PortalCard>

            {/* Lease expiry countdown — only shown when active and within 90 days */}
            {status === "ACTIVE" && endDate && (() => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const end = new Date(endDate); end.setHours(0, 0, 0, 0);
                const daysLeft = Math.round((end.getTime() - today.getTime()) / 86_400_000);
                if (daysLeft > 90 || daysLeft < 0) return null;
                const urgent = daysLeft <= 30;
                return (
                    <div className={`tenant-panel !p-4 sm:!p-5 flex items-start gap-3.5 border-l-4 ${urgent ? "border-l-danger" : "border-l-warning"}`}>
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${urgent ? "bg-danger-bg dark:bg-danger-bg-dark text-danger-dark dark:text-danger" : "bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning"}`}>
                            <CalendarClock className="h-4.5 w-4.5" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                                {daysLeft === 0
                                    ? "Your lease expires today"
                                    : daysLeft === 1
                                        ? "Your lease expires tomorrow"
                                        : `Your lease expires in ${daysLeft} days`}
                            </p>
                            <p className="mt-0.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                                {urgent
                                    ? "Contact your landlord soon to confirm renewal or plan your move-out."
                                    : "You have time to plan — reach out to your landlord to discuss renewal."}
                            </p>
                        </div>
                    </div>
                );
            })()}

            {/* Pay Rent */}
            {canPay && payState === "idle" && (
                <div className="tenant-panel !p-6 border-2 border-brand/20 dark:border-brand/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="section-header !text-sm !mb-1">Pay Rent</h3>
                            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                                Balance due: <span className="font-semibold text-danger-dark dark:text-danger">{formatCurrency(currentBalance)}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => setPayState("phone_prompt")}
                            className="btn-primary gap-2 py-2.5 px-5"
                        >
                            <Smartphone className="h-5 w-5" strokeWidth={1.75} />
                            Pay Now
                        </button>
                        <button
                            onClick={handleToggleAutoPay}
                            disabled={toggleAutoPayMut.isPending}
                            className={`btn-outline btn-sm gap-2 ${autoPay ? "text-brand border-brand/40 dark:border-brand/40" : ""}`}
                            title={autoPay ? "Auto-pay is on" : "Enable auto-pay"}
                        >
                            {toggleAutoPayMut.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                            ) : autoPay ? (
                                <Bell className="h-4 w-4" strokeWidth={2} />
                            ) : (
                                <BellOff className="h-4 w-4" strokeWidth={2} />
                            )}
                            {autoPay ? "Auto-Pay On" : "Auto-Pay"}
                        </button>
                    </div>
                </div>
            )}

            {canPay && payState === "phone_prompt" && (
                <div className="tenant-panel !p-6 border-2 border-brand/20 dark:border-brand/20">
                    <h3 className="section-header !text-sm !mb-4">Pay Rent</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="label-text">Amount to pay</label>
                            <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted dark:text-fg-muted-dark font-mono-nums text-sm">KSh</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={payAmount || currentBalance}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    className="input-field pl-12 w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label-text">M-Pesa Phone Number</label>
                            <input
                                type="tel"
                                value={mpesaPhone || dashboardData?.tenantPhone || ""}
                                onChange={(e) => setMpesaPhone(e.target.value)}
                                placeholder="+254712345678"
                                className="input-field mt-1 w-full"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={resetPay} className="btn-outline flex-1">Cancel</button>
                            <button
                                onClick={initiatePayment}
                                disabled={!(mpesaPhone || dashboardData?.tenantPhone)}
                                className="btn-primary flex-1"
                            >
                                Pay {formatCurrency(parseFloat(payAmount || currentBalance.toString()))}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {payState === "initiating" && (
                <div className="tenant-panel !p-6">
                    <div className="flex items-center gap-3 py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                        <span className="text-sm text-fg-muted dark:text-fg-muted-dark">Sending payment request…</span>
                    </div>
                </div>
            )}

            {payState === "pending" && (
                <div className="tenant-panel !p-6">
                    <div className="flex items-center gap-3 py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                        <span className="text-sm text-fg-muted dark:text-fg-muted-dark">Awaiting M-Pesa confirmation…</span>
                    </div>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-2">{payMessage}</p>
                    {sentToPhone && (
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                            STK push sent to <span className="font-medium font-mono-nums">{sentToPhone}</span>
                        </p>
                    )}
                    <button onClick={refreshStatus} className="btn-outline btn-sm mt-3">
                        Check Status
                    </button>
                </div>
            )}

            {payState === "success" && (
                <div className="tenant-panel !p-6 border-2 border-success/20 dark:border-success/20">
                    <div className="flex items-center gap-3 py-2">
                        <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={2} />
                        <span className="text-sm font-medium text-success">Payment successful!</span>
                    </div>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">Your balance will update shortly.</p>
                </div>
            )}

            {payState === "error" && (
                <div className="tenant-panel !p-6 border-2 border-danger/20 dark:border-danger/20">
                    <div className="flex items-center gap-3 py-2">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                        <span className="text-sm font-medium text-danger">Payment failed</span>
                    </div>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">{payMessage}</p>
                    <button onClick={resetPay} className="btn-outline btn-sm mt-3">Try again</button>
                </div>
            )}

            {/* Auto-Pay Settings */}
            {autoPaySettings && (
                <div
                    ref={autoPayCardRef}
                    tabIndex={-1}
                    id="autopay-settings"
                    className={`tenant-panel !p-6 outline-none ${
                        setupAutoPay ? "ring-2 ring-brand/40 border-brand/30 animate-pulse-once" : ""
                    }`}
                >
                    <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-brand" strokeWidth={2} />
                        Auto-Pay Settings
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-fg-muted dark:text-fg-muted-dark">Status</span>
                            <span className={`font-medium ${autoPay ? "text-success" : "text-fg-muted dark:text-fg-muted-dark"}`}>
                                {autoPay ? "Enabled" : "Disabled"}
                            </span>
                        </div>
                        {autoPaySettings.mpesaPhone && (
                            <div className="flex items-center justify-between">
                                <span className="text-fg-muted dark:text-fg-muted-dark">M-Pesa Phone</span>
                                <span className="font-mono-nums">{autoPaySettings.mpesaPhone}</span>
                            </div>
                        )}
                        {autoPaySettings.lastAutoPayDate && (
                            <div className="flex items-center justify-between">
                                <span className="text-fg-muted dark:text-fg-muted-dark">Last Auto-Pay</span>
                                <span className="font-medium">{formatDate(autoPaySettings.lastAutoPayDate)}</span>
                            </div>
                        )}
                        {autoPaySettings.consecutiveFailures > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-fg-muted dark:text-fg-muted-dark">Consecutive Failures</span>
                                <span className="font-medium text-danger">{autoPaySettings.consecutiveFailures}</span>
                            </div>
                        )}
                        {autoPaySettings.lastFailureReason && (
                            <div className="flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5">
                                <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" strokeWidth={2} />
                                <div>
                                    <p className="text-xs font-medium text-danger">Last attempt didn&apos;t go through</p>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                        {autoPaySettings.lastFailureReason}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="pt-3 border-t border-border dark:border-border-dark flex items-center justify-between gap-3">
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                {autoPay
                                    ? "Rent is deducted automatically on your due date."
                                    : "Never miss a due date — rent is paid automatically each month."}
                            </p>
                            <button
                                onClick={handleToggleAutoPay}
                                disabled={toggleAutoPayMut.isPending}
                                className={`btn-sm shrink-0 gap-2 ${
                                    autoPay
                                        ? "btn-primary"
                                        : "btn-outline border-brand/40 dark:border-brand/40 text-brand dark:text-brand-300"
                                }`}
                            >
                                {toggleAutoPayMut.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                ) : autoPay ? (
                                    <BellOff className="h-4 w-4" strokeWidth={2} />
                                ) : (
                                    <Bell className="h-4 w-4" strokeWidth={2} />
                                )}
                                {toggleAutoPayMut.isPending ? "Saving…" : autoPay ? "Turn Off" : "Turn On"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Deposit -- trust feature: shows what's actually happened to it,
                not just the amount. Only renders once a Deposit record exists (i.e. the
                deposit has actually been paid); before that the amount alone is already
                shown in the Key Details grid above. */}
            {deposit && (
                <div className="tenant-panel !p-6">
                    <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-brand" strokeWidth={2} />
                        Security Deposit
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-fg-muted dark:text-fg-muted-dark">Status</span>
                            <DepositStatusChip status={deposit.status} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-fg-muted dark:text-fg-muted-dark">Amount held</span>
                            <span className="font-medium font-data">{formatCurrency(deposit.amountPaid)}</span>
                        </div>
                        {deposit.paidAt && (
                            <div className="flex items-center justify-between">
                                <span className="text-fg-muted dark:text-fg-muted-dark">Paid on</span>
                                <span className="font-medium">{formatDate(deposit.paidAt)}</span>
                            </div>
                        )}
                        {(deposit.status === "REFUNDED" || deposit.status === "PARTIALLY_REFUNDED") && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-fg-muted dark:text-fg-muted-dark">Amount refunded</span>
                                    <span className="font-medium font-data text-success">{formatCurrency(deposit.amountRefunded)}</span>
                                </div>
                                {deposit.refundedAt && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-fg-muted dark:text-fg-muted-dark">Refunded on</span>
                                        <span className="font-medium">{formatDate(deposit.refundedAt)}</span>
                                    </div>
                                )}
                            </>
                        )}
                        {deposit.status === "HELD" && (
                            <p className="pt-3 border-t border-border dark:border-border-dark text-xs text-fg-muted dark:text-fg-muted-dark">
                                Held by your landlord for the duration of your tenancy. It will be refunded, minus any lawful deductions, after move-out inspection.
                            </p>
                        )}
                        {deposit.status === "FORFEITED" && (
                            <p className="pt-3 border-t border-border dark:border-border-dark text-xs text-fg-muted dark:text-fg-muted-dark">
                                This deposit was forfeited. Contact your landlord if you believe this is in error.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Lease Terms & Landlord Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Lease Terms */}
                <div className="tenant-panel !p-6">
                    <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand" strokeWidth={2} />
                        Lease Terms
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-fg-muted dark:text-fg-muted-dark">
                        {terms ? (
                            terms.split("\n").map((paragraph, i) => (
                                <p key={i} className="mb-3">{paragraph}</p>
                            ))
                        ) : (
                            <p className="text-fg-muted dark:text-fg-muted-dark">No terms provided by landlord.</p>
                        )}
                    </div>
                </div>

                {/* Landlord Contact */}
                <div className="tenant-panel !p-6">
                    <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-brand" strokeWidth={2} />
                        Landlord Contact
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60 transition-all duration-200 hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-0.5 hover:shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                                <User className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Name</p>
                                <p className="font-medium text-fg dark:text-fg-dark">{landlordName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60 transition-all duration-200 hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-0.5 hover:shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                                <Phone className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Phone</p>
                                {/* Absent contact details previously rendered an empty <a href="tel:">
                                    — an invisible, unclickable link that made the row look broken.
                                    Fall back to a dash, matching the landlord page. */}
                                {landlordPhone ? (
                                    <a href={`tel:${landlordPhone}`} className="font-medium text-fg dark:text-fg-dark hover:text-brand transition-colors">{landlordPhone}</a>
                                ) : (
                                    <p className="font-medium text-fg-subtle dark:text-fg-subtle-dark">Not provided</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60 transition-all duration-200 hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-0.5 hover:shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                                <Mail className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Email</p>
                                {landlordEmail ? (
                                    <a href={`mailto:${landlordEmail}`} className="font-medium text-fg dark:text-fg-dark hover:text-brand transition-colors break-all">{landlordEmail}</a>
                                ) : (
                                    <p className="font-medium text-fg-subtle dark:text-fg-subtle-dark">Not provided</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60 transition-all duration-200 hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-0.5 hover:shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                                <MapPin className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Property Address</p>
                                <p className="font-medium text-fg dark:text-fg-dark">{propertyAddress}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Dates */}
            <div className="tenant-panel !p-6">
                <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand" strokeWidth={2} />
                    Important Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DateCard icon={Calendar} label="Lease Start" date={startDate} />
                    <DateCard icon={Calendar} label="Lease End" date={endDate ?? null} />
                    <DateCard icon={CreditCard} label="Rent Due" date={null} custom="1st of each month" />
                </div>
            </div>
        </PortalPage>
    );
};

const DEPOSIT_STATUS_META: Record<DepositStatus, { label: string; className: string }> = {
    UNPAID: { label: "Unpaid", className: "tenant-status-chip-neutral" },
    // NOT "held in escrow" — this system has no escrow facility and takes no
    // custody of deposits (see AGENTS.md: "There is no escrow"). The landlord
    // holds it directly; RentManager only records that it was paid and what
    // has happened to it since.
    HELD: { label: "Held by landlord", className: "tenant-status-chip-success" },
    PARTIALLY_REFUNDED: { label: "Partially refunded", className: "tenant-status-chip-warning" },
    REFUNDED: { label: "Refunded", className: "tenant-status-chip-success" },
    FORFEITED: { label: "Forfeited", className: "tenant-status-chip-danger" },
};

const DepositStatusChip = ({ status }: { status: DepositStatus }) => {
    const meta = DEPOSIT_STATUS_META[status] ?? DEPOSIT_STATUS_META.UNPAID;
    return <span className={`tenant-status-chip ${meta.className} inline-flex`}>{meta.label}</span>;
};

const LeaseDetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="text-center">
        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 mb-2">
            {/* @ts-expect-error - React 19 ElementType inference issue */}
            <Icon className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-0.5">{label}</p>
        <p className="font-medium text-fg dark:text-fg-dark text-sm">{value}</p>
    </div>
);

const DateCard = ({ icon: Icon, label, date, custom }: { icon: React.ElementType; label: string; date: string | null; custom?: string }) => (
    <div className="text-center p-4 rounded-xl bg-surface border border-border/60">
        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 mb-2">
            {/* @ts-expect-error - React 19 ElementType inference issue */}
            <Icon className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-1">{label}</p>
        <p className="font-medium text-fg dark:text-fg-dark">{custom ?? (date ? formatDate(date) : "—")}</p>
    </div>
);
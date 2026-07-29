// components/tenant-lease.tsx
"use client";

import { useTenantDashboardQuery, useTenantLeaseQuery, useTenantPaymentSummaryQuery } from "../hooks/use-tenant-portal-queries";
import { AlertTriangle, Home, Mail, Phone, Calendar, CreditCard, Shield, FileText, MapPin, User, Clock, Smartphone, Loader2, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "./tenant-dashboard";
import { tenantPortalApi } from "../api/tenant-portal-api";
import { useCallback, useEffect, useRef, useState } from "react";

export const TenantLeasePage = () => {
    const { data: dashboardData } = useTenantDashboardQuery();
    const { data: lease, isLoading, isError, refetch } = useTenantLeaseQuery();
    const { data: summary, refetch: refetchSummary } = useTenantPaymentSummaryQuery();

    const [payState, setPayState] = useState<"idle" | "phone_prompt" | "initiating" | "pending" | "success" | "error">("idle");
    const [payMessage, setPayMessage] = useState("");
    const [payAmount, setPayAmount] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState("");
    const [requestId, setRequestId] = useState<string | null>(null);
    const [sentToPhone, setSentToPhone] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (dashboardData?.tenantPhone && !mpesaPhone) setMpesaPhone(dashboardData.tenantPhone);
    }, [dashboardData?.tenantPhone]);

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
        const phone = mpesaPhone.replace(/\s+/g, "");
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
    }, [payAmount, currentBalance, mpesaPhone, checkStatus]);

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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="card-elevated p-6"><div className="skeleton h-8 w-1/4 mb-4" /><div className="skeleton h-32 w-full" /></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card-elevated p-6"><div className="skeleton h-48 w-full" /></div>
                    <div className="card-elevated p-6"><div className="skeleton h-48 w-full" /></div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="card p-6 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load lease</p>
                <button onClick={() => refetch()} className="mt-2 btn-outline btn-sm">Retry</button>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="card p-8 text-center">
                <Home className="h-12 w-12 mx-auto text-fg-muted dark:text-fg-muted-dark mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No active lease</p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Your lease will appear here once your reservation is confirmed and the landlord creates the lease agreement.</p>
            </div>
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
        <div className="space-y-6">
            {/* Lease Header */}
            <div className="card-elevated p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Lease</p>
                            <span className={`${statusClass} !text-[10px]`}>{status?.toLowerCase()}</span>
                        </div>
                        <h1 className="page-title !text-[1.5rem] mb-1">{propertyName}</h1>
                        <p className="page-subtitle !text-sm">{unitLabel ? `${unitNumber} · ${unitLabel}` : `Unit ${unitNumber}`}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                            <p className="kpi-label">Monthly Rent</p>
                            <p className="kpi-value font-data">{formatCurrency(monthlyRent)}</p>
                        </div>
                    </div>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border dark:border-border-dark">
                    <LeaseDetailItem icon={Calendar} label="Start Date" value={formatDate(startDate)} />
                    <LeaseDetailItem icon={Calendar} label="End Date" value={endDate ? formatDate(endDate) : "Ongoing"} />
                    <LeaseDetailItem icon={CreditCard} label="Deposit Paid" value={formatCurrency(depositAmount)} />
                    <LeaseDetailItem icon={Shield} label="Lease #" value={leaseNumber} />
                </div>
            </div>

            {/* Pay Rent */}
            {canPay && payState === "idle" && (
                <div className="card-elevated p-6 border-2 border-brand/20 dark:border-brand/20">
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
                    </div>
                </div>
            )}

            {canPay && payState === "phone_prompt" && (
                <div className="card-elevated p-6 border-2 border-brand/20 dark:border-brand/20">
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
                                value={mpesaPhone}
                                onChange={(e) => setMpesaPhone(e.target.value)}
                                placeholder="+254712345678"
                                className="input-field mt-1 w-full"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={resetPay} className="btn-outline flex-1">Cancel</button>
                            <button
                                onClick={initiatePayment}
                                disabled={!mpesaPhone}
                                className="btn-primary flex-1"
                            >
                                Pay {formatCurrency(parseFloat(payAmount || currentBalance.toString()))}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {payState === "initiating" && (
                <div className="card-elevated p-6">
                    <div className="flex items-center gap-3 py-2">
                        <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                        <span className="text-sm text-fg-muted dark:text-fg-muted-dark">Sending payment request…</span>
                    </div>
                </div>
            )}

            {payState === "pending" && (
                <div className="card-elevated p-6">
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
                <div className="card-elevated p-6 border-2 border-success/20 dark:border-success/20">
                    <div className="flex items-center gap-3 py-2">
                        <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={2} />
                        <span className="text-sm font-medium text-success">Payment successful!</span>
                    </div>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">Your balance will update shortly.</p>
                </div>
            )}

            {payState === "error" && (
                <div className="card-elevated p-6 border-2 border-danger/20 dark:border-danger/20">
                    <div className="flex items-center gap-3 py-2">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                        <span className="text-sm font-medium text-danger">Payment failed</span>
                    </div>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">{payMessage}</p>
                    <button onClick={resetPay} className="btn-outline btn-sm mt-3">Try again</button>
                </div>
            )}

            {/* Lease Terms & Landlord Contact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Lease Terms */}
                <div className="card-elevated p-6">
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
                <div className="card-elevated p-6">
                    <h3 className="section-header !text-sm !mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-brand" strokeWidth={2} />
                        Landlord Contact
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                                <User className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Name</p>
                                <p className="font-medium text-fg dark:text-fg-dark">{landlordName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Phone</p>
                                <a href={`tel:${landlordPhone}`} className="font-medium text-fg dark:text-fg-dark hover:text-brand transition-colors">{landlordPhone}</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">Email</p>
                                <a href={`mailto:${landlordEmail}`} className="font-medium text-fg dark:text-fg-dark hover:text-brand transition-colors">{landlordEmail}</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
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
            <div className="card-elevated p-6">
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
        </div>
    );
};

const LeaseDetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="text-center">
        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 mb-2">
            <Icon className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-0.5">{label}</p>
        <p className="font-medium text-fg dark:text-fg-dark text-sm">{value}</p>
    </div>
);

const DateCard = ({ icon: Icon, label, date, custom }: { icon: React.ElementType; label: string; date: string | null; custom?: string }) => (
    <div className="text-center p-4 rounded-xl bg-surface border border-border/60">
        <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 mb-2">
            <Icon className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-1">{label}</p>
        <p className="font-medium text-fg dark:text-fg-dark">{custom ?? (date ? formatDate(date) : "—")}</p>
    </div>
);
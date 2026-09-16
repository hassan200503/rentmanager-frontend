"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ShieldCheck,
    AlertTriangle,
    Loader2,
    X,
    CheckCircle2,
    Ban,
    ReceiptText,
    Info,
    Smartphone,
    RefreshCw,
    User,
    Phone,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import {
    useLeaseDeposit,
    useRefundDepositMutation,
    useForfeitDepositMutation,
    useInitiateRefundMutation,
    useCancelPendingRefundMutation,
} from "../hooks/use-deposit-queries";
import type { DepositStatus, InitiateDepositRefundRequest, RefundDepositRequest } from "../types/deposit-types";
import { formatCurrencyPrecise, toMoneyNumber } from "@/shared/utils/money";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

// ── Status presentation ────────────────────────────────────────────────────────

const STATUS_META: Record<DepositStatus, {
    label: string;
    chip: string;
    glow: string;
    cardAccent: string;
    Icon: typeof ShieldCheck
}> = {
    UNPAID: {
        label: "Unpaid",
        chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40",
        glow: "shadow-amber-100 dark:shadow-amber-900/20",
        cardAccent: "border-amber-200/60 dark:border-amber-800/30",
        Icon: AlertTriangle,
    },
    HELD: {
        label: "Held",
        chip: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40",
        glow: "shadow-blue-100 dark:shadow-blue-900/20",
        cardAccent: "border-blue-200/60 dark:border-blue-800/30",
        Icon: ShieldCheck,
    },
    PARTIALLY_REFUNDED: {
        label: "Partially Refunded",
        chip: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/40",
        glow: "shadow-orange-100 dark:shadow-orange-900/20",
        cardAccent: "border-orange-200/60 dark:border-orange-800/30",
        Icon: ReceiptText,
    },
    REFUNDED: {
        label: "Refunded",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40",
        glow: "shadow-emerald-100 dark:shadow-emerald-900/20",
        cardAccent: "border-emerald-200/60 dark:border-emerald-800/30",
        Icon: CheckCircle2,
    },
    FORFEITED: {
        label: "Forfeited",
        chip: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/40",
        glow: "shadow-zinc-100 dark:shadow-zinc-900/20",
        cardAccent: "border-zinc-200/60 dark:border-zinc-700/30",
        Icon: Ban,
    },
};

function StatusBadge({ status, hasPending }: { status: DepositStatus; hasPending?: boolean }) {
    const meta = STATUS_META[status] ?? STATUS_META.HELD;
    const { Icon, label, chip } = meta;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold shadow-sm ${chip}`}>
            {hasPending ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
            ) : (
                <Icon className="h-3 w-3" strokeWidth={2.5} />
            )}
            {hasPending ? "Pending Refund" : label}
        </span>
    );
}

// ── Figure tile ─────────────────────────────────────────────────────────────

interface FigureTileProps {
    label: string;
    value: string;
    sub?: string;
    accent?: "emerald" | "amber" | "zinc" | "default";
}

function FigureTile({ label, value, sub, accent = "default" }: FigureTileProps) {
    const accentStyles = {
        default: "border-border/50 dark:border-border-dark/50 bg-ink/[0.01] dark:bg-white/[0.01]",
        emerald: "border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/40 dark:bg-emerald-900/10",
        amber:   "border-amber-200/60 dark:border-amber-800/30 bg-amber-50/40 dark:bg-amber-900/10",
        zinc:    "border-zinc-200/60 dark:border-zinc-700/30 bg-zinc-50/40 dark:bg-zinc-900/10",
    };
    const valueStyles = {
        default: "text-fg dark:text-fg-dark",
        emerald: "text-emerald-700 dark:text-emerald-400",
        amber:   "text-amber-700 dark:text-amber-400",
        zinc:    "text-zinc-600 dark:text-zinc-400",
    };
    return (
        <div className={`rounded-xl border px-4 py-3 transition-all duration-200 ${accentStyles[accent]}`}>
            <p className="text-[10px] font-bold text-fg-muted dark:text-fg-muted-dark uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-base font-bold font-data tabular-nums leading-tight ${valueStyles[accent]}`}>{value}</p>
            {sub && <p className="text-[10px] text-fg-muted dark:text-fg-muted-dark mt-1">{sub}</p>}
        </div>
    );
}

// ── STK Push Refund Modal ──────────────────────────────────────────────────────

interface StkRefundModalProps {
    depositId: string;
    amountPaid: string;
    currency: string;
    leaseId: string;
    renterName: string | null;
    renterPhone: string | null;
    onClose: () => void;
}

function StkRefundModal({ depositId, amountPaid, currency, leaseId, renterName, renterPhone, onClose }: StkRefundModalProps) {
    const initiateMutation = useInitiateRefundMutation(leaseId);

    const [landlordPhone, setLandlordPhone] = useState("");
    const [deduction, setDeduction] = useState("");
    const [reason, setReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [sent, setSent] = useState(false);

    const paid = toMoneyNumber(amountPaid);
    const deductionNum = deduction === "" ? 0 : toMoneyNumber(deduction);
    const refundAmount = Math.max(0, paid - deductionNum);
    const hasDeduction = deductionNum > 0;
    const isFullForfeit = deductionNum >= paid;

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!landlordPhone.trim()) errs.landlordPhone = "Enter your M-Pesa phone number";
        if (deduction !== "" && (isNaN(Number(deduction)) || Number(deduction) < 0))
            errs.deduction = "Must be 0 or a positive number";
        if (isFullForfeit) errs.deduction = "Full deduction — use Forfeit instead";
        if (hasDeduction && !reason.trim()) errs.reason = "Required when deducting for damages or unpaid bills";
        if (refundAmount <= 0) errs.deduction = "Refund amount must be greater than zero";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const request: InitiateDepositRefundRequest = {
            landlordPhone: landlordPhone.trim(),
            deductionAmount: deductionNum,
            deductionReason: reason.trim() || null,
            remarks: remarks.trim() || null,
        };

        await initiateMutation.mutateAsync({ depositId, request });
        setSent(true);
    };

    if (sent) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-surface dark:bg-surface-dark rounded-3xl border border-border/60 dark:border-border-dark/60 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] p-8 max-w-sm w-full animate-fade-in-up text-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 via-brand/10 to-transparent mx-auto mb-6 ring-1 ring-brand/20 shadow-lg shadow-brand/10">
                        <Smartphone className="h-9 w-9 text-brand" strokeWidth={1.5} />
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand ring-2 ring-surface dark:ring-surface-dark">
                            <Sparkles className="h-2.5 w-2.5 text-white" strokeWidth={2} />
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-fg dark:text-fg-dark mb-2">Check your phone</h2>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-5 leading-relaxed">
                        An M-Pesa prompt has been sent to{" "}
                        <span className="font-semibold text-fg dark:text-fg-dark">{landlordPhone}</span>. Enter your PIN to authorise{" "}
                        <span className="font-bold text-brand">{formatCurrencyPrecise(refundAmount, currency)}</span>.
                    </p>
                    {renterPhone && (
                        <div className="rounded-2xl border border-amber-200/70 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/80 to-amber-50/40 dark:from-amber-900/15 dark:to-transparent p-4 mb-5 text-left">
                            <div className="flex gap-2.5 items-start">
                                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                    After confirming, also send{" "}
                                    <span className="font-bold">{formatCurrencyPrecise(refundAmount, currency)}</span>{" "}
                                    to <span className="font-semibold">{renterName ?? "the tenant"}</span> at{" "}
                                    <span className="font-bold font-mono">{renterPhone}</span> via M-Pesa Send Money.
                                </p>
                            </div>
                        </div>
                    )}
                    <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark mb-6">
                        This page updates automatically once confirmed.
                    </p>
                    <button onClick={onClose} className="btn-secondary w-full">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface dark:bg-surface-dark rounded-3xl border border-border/60 dark:border-border-dark/60 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] w-full max-w-lg animate-fade-in-up max-h-[92vh] overflow-hidden flex flex-col">
                {/* Sticky header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/50 dark:border-border-dark/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 ring-1 ring-brand/20">
                                <Smartphone className="h-5 w-5 text-brand" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-fg dark:text-fg-dark">Refund via M-Pesa</h2>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    Held: <span className="font-semibold text-fg dark:text-fg-dark">{formatCurrencyPrecise(amountPaid, currency)}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={initiateMutation.isPending}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-fg-muted dark:text-fg-muted-dark hover:bg-ink/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                        >
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                    {/* Renter info card */}
                    {(renterName || renterPhone) && (
                        <div className="rounded-2xl border border-border/60 dark:border-border-dark/60 bg-gradient-to-r from-ink/[0.015] to-transparent dark:from-white/[0.015] p-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 shrink-0">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-fg-muted dark:text-fg-muted-dark uppercase tracking-widest mb-0.5">Refunding to</p>
                                <p className="text-sm font-bold text-fg dark:text-fg-dark truncate">{renterName ?? "—"}</p>
                                {renterPhone && (
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark font-mono mt-0.5">{renterPhone}</p>
                                )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark shrink-0" strokeWidth={2} />
                        </div>
                    )}

                    {/* How it works */}
                    <div className="rounded-2xl border border-blue-200/60 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/70 to-blue-50/30 dark:from-blue-900/15 dark:to-transparent p-4 flex gap-3">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            An M-Pesa STK prompt will be sent to your phone. Enter your PIN to authorise. The deposit is automatically recorded as refunded when Safaricom confirms.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" id="stk-refund-form">
                        {/* Landlord M-Pesa phone */}
                        <div>
                            <label className="form-label">
                                Your M-Pesa number <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted dark:text-fg-muted-dark pointer-events-none" strokeWidth={1.5} />
                                <input
                                    type="tel"
                                    value={landlordPhone}
                                    onChange={(e) => {
                                        setLandlordPhone(e.target.value);
                                        setFieldErrors((p) => ({ ...p, landlordPhone: "" }));
                                    }}
                                    placeholder="e.g. 0712 345678"
                                    className="form-input w-full pl-9"
                                />
                            </div>
                            {fieldErrors.landlordPhone && (
                                <p className="mt-1 text-xs text-danger">{fieldErrors.landlordPhone}</p>
                            )}
                            <p className="mt-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                The M-Pesa prompt will be sent here. Must match your Daraja credentials.
                            </p>
                        </div>

                        {/* Deduction */}
                        <div>
                            <label className="form-label">
                                Deduction ({currency})
                                <span className="ml-1 font-normal text-fg-muted dark:text-fg-muted-dark">— leave blank or 0 for a full refund</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={deduction}
                                onChange={(e) => {
                                    setDeduction(e.target.value);
                                    setFieldErrors((p) => ({ ...p, deduction: "" }));
                                }}
                                placeholder="0.00"
                                className="form-input w-full"
                            />
                            {fieldErrors.deduction && (
                                <p className="mt-1 text-xs text-danger">{fieldErrors.deduction}</p>
                            )}
                        </div>

                        {/* Deduction reason */}
                        {hasDeduction && (
                            <div>
                                <label className="form-label">
                                    Reason for deduction <span className="text-danger">*</span>
                                </label>
                                <input
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        setFieldErrors((p) => ({ ...p, reason: "" }));
                                    }}
                                    placeholder="e.g. Water heater damage, unpaid water bill"
                                    className="form-input w-full"
                                />
                                {fieldErrors.reason && (
                                    <p className="mt-1 text-xs text-danger">{fieldErrors.reason}</p>
                                )}
                            </div>
                        )}

                        {/* Refund summary */}
                        <div className="rounded-2xl border border-border/60 dark:border-border-dark/60 bg-gradient-to-r from-ink/[0.02] to-transparent dark:from-white/[0.02] px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-fg-muted dark:text-fg-muted-dark uppercase tracking-widest mb-0.5">Amount to authorise</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    {hasDeduction ? `Held ${formatCurrencyPrecise(amountPaid, currency)} − deduction ${formatCurrencyPrecise(deductionNum, currency)}` : "Full deposit amount"}
                                </p>
                            </div>
                            <span className={`text-xl font-bold font-data tabular-nums ${refundAmount > 0 ? "text-brand" : "text-fg-muted dark:text-fg-muted-dark"}`}>
                                {formatCurrencyPrecise(refundAmount, currency)}
                            </span>
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="form-label">Remarks (optional)</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={2}
                                placeholder="Any additional notes for the record"
                                className="form-input w-full resize-none"
                            />
                        </div>

                        {initiateMutation.error && (
                            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
                                <p className="text-xs text-danger">
                                    {getProcessErrorMessage(initiateMutation.error, "Could not send the M-Pesa prompt. Please try again.")}
                                </p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Sticky footer */}
                <div className="px-6 pb-6 pt-4 border-t border-border/50 dark:border-border-dark/50 shrink-0 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={initiateMutation.isPending}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="stk-refund-form"
                        disabled={initiateMutation.isPending || refundAmount <= 0}
                        className="btn-primary gap-2"
                    >
                        {initiateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                        {initiateMutation.isPending ? "Sending prompt…" : "Send M-Pesa Prompt"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Manual Refund Modal (legacy / fallback) ────────────────────────────────────

interface ManualRefundModalProps {
    depositId: string;
    amountPaid: string;
    currency: string;
    leaseId: string;
    onClose: () => void;
}

function ManualRefundModal({ depositId, amountPaid, currency, leaseId, onClose }: ManualRefundModalProps) {
    const mutation = useRefundDepositMutation(leaseId);

    const [deduction, setDeduction] = useState("");
    const [reason, setReason] = useState("");
    const [reference, setReference] = useState("");
    const [remarks, setRemarks] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const paid = toMoneyNumber(amountPaid);
    const deductionNum = deduction === "" ? 0 : toMoneyNumber(deduction);
    const refundAmount = Math.max(0, paid - deductionNum);
    const hasDeduction = deductionNum > 0;
    const isFullForfeit = deductionNum >= paid;

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (deduction !== "" && (isNaN(Number(deduction)) || Number(deduction) < 0)) errs.deduction = "Must be 0 or a positive number";
        if (isFullForfeit) errs.deduction = "Deduction equals or exceeds the held amount — use Forfeit instead";
        if (hasDeduction && !reason.trim()) errs.reason = "Required when deducting for damages or unpaid bills";
        if (refundAmount > 0 && !reference.trim()) errs.reference = "Enter the M-Pesa receipt code";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const request: RefundDepositRequest = {
            deductionAmount: deductionNum,
            deductionReason: reason.trim() || null,
            refundReference: reference.trim() || null,
            refundRemarks: remarks.trim() || null,
        };
        await mutation.mutateAsync({ depositId, request });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface dark:bg-surface-dark rounded-3xl border border-border/60 dark:border-border-dark/60 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] w-full max-w-lg animate-fade-in-up max-h-[92vh] overflow-hidden flex flex-col">
                <div className="px-6 pt-6 pb-4 border-b border-border/50 dark:border-border-dark/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                                <ReceiptText className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-fg dark:text-fg-dark">Record Manual Refund</h2>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    Held: <span className="font-semibold text-fg dark:text-fg-dark">{formatCurrencyPrecise(amountPaid, currency)}</span>
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} disabled={mutation.isPending}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-fg-muted dark:text-fg-muted-dark hover:bg-ink/[0.05] dark:hover:bg-white/[0.05] transition-colors">
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                    <div className="rounded-2xl border border-blue-200/60 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/70 to-blue-50/30 dark:from-blue-900/15 dark:to-transparent p-4 flex gap-3">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            Send the refund from your M-Pesa first, then paste the Safaricom receipt code below to record it.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" id="manual-refund-form">
                        <div>
                            <label className="form-label">Deduction ({currency})<span className="ml-1 font-normal text-fg-muted dark:text-fg-muted-dark">— 0 for full refund</span></label>
                            <input type="number" step="0.01" min="0" value={deduction}
                                onChange={(e) => { setDeduction(e.target.value); setFieldErrors(p => ({ ...p, deduction: "" })); }}
                                placeholder="0.00" className="form-input w-full" />
                            {fieldErrors.deduction && <p className="mt-1 text-xs text-danger">{fieldErrors.deduction}</p>}
                        </div>
                        {hasDeduction && (
                            <div>
                                <label className="form-label">Reason for deduction <span className="text-danger">*</span></label>
                                <input value={reason}
                                    onChange={(e) => { setReason(e.target.value); setFieldErrors(p => ({ ...p, reason: "" })); }}
                                    placeholder="e.g. Water heater damage" className="form-input w-full" />
                                {fieldErrors.reason && <p className="mt-1 text-xs text-danger">{fieldErrors.reason}</p>}
                            </div>
                        )}
                        <div className="rounded-2xl border border-border/60 dark:border-border-dark/60 px-5 py-4 flex items-center justify-between bg-gradient-to-r from-ink/[0.02] to-transparent dark:from-white/[0.02]">
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark font-medium">Refund amount</p>
                            <span className="text-base font-bold text-fg dark:text-fg-dark font-data">{formatCurrencyPrecise(refundAmount, currency)}</span>
                        </div>
                        {refundAmount > 0 && (
                            <div>
                                <label className="form-label">M-Pesa transaction code <span className="text-danger">*</span></label>
                                <input value={reference}
                                    onChange={(e) => { setReference(e.target.value.toUpperCase().trim()); setFieldErrors(p => ({ ...p, reference: "" })); }}
                                    placeholder="e.g. RA65XXXX1A" className="form-input w-full font-mono tracking-wide" />
                                {fieldErrors.reference && <p className="mt-1 text-xs text-danger">{fieldErrors.reference}</p>}
                            </div>
                        )}
                        <div>
                            <label className="form-label">Remarks (optional)</label>
                            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
                                placeholder="Any additional notes" className="form-input w-full resize-none" />
                        </div>
                        {mutation.error && (
                            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
                                <p className="text-xs text-danger">{getProcessErrorMessage(mutation.error, "Could not record the refund.")}</p>
                            </div>
                        )}
                    </form>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-border/50 dark:border-border-dark/50 shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={mutation.isPending} className="btn-secondary">Cancel</button>
                    <button type="submit" form="manual-refund-form" disabled={mutation.isPending} className="btn-primary gap-2">
                        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                        {mutation.isPending ? "Recording…" : "Record Refund"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Pending Refund Banner ──────────────────────────────────────────────────────

interface PendingRefundBannerProps {
    depositId: string;
    leaseId: string;
    initiatedAt: string | null;
}

function PendingRefundBanner({ depositId, leaseId, initiatedAt }: PendingRefundBannerProps) {
    const cancelMutation = useCancelPendingRefundMutation(leaseId);
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        if (!initiatedAt) return;
        const update = () => {
            const diff = Math.floor((Date.now() - new Date(initiatedAt).getTime()) / 1000);
            if (diff < 60) setElapsed(`${diff}s ago`);
            else setElapsed(`${Math.floor(diff / 60)}m ago`);
        };
        update();
        const id = setInterval(update, 5_000);
        return () => clearInterval(id);
    }, [initiatedAt]);

    return (
        <div className="rounded-2xl border border-brand/30 dark:border-brand/20 bg-gradient-to-r from-brand/[0.06] to-transparent dark:from-brand/[0.08] px-4 py-3.5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="relative shrink-0">
                    <Loader2 className="h-5 w-5 text-brand animate-spin" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark leading-tight">Awaiting M-Pesa confirmation</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                        Prompt sent {elapsed}. Enter your PIN to authorise. Updates automatically.
                    </p>
                </div>
            </div>
            <button
                onClick={() => cancelMutation.mutate(depositId)}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border/60 dark:border-border-dark/60 text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark hover:border-fg/20 transition-all duration-200 shrink-0"
            >
                {cancelMutation.isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    : <RefreshCw className="h-3 w-3" strokeWidth={2} />
                }
                Cancel &amp; Retry
            </button>
        </div>
    );
}

// ── Main Section ───────────────────────────────────────────────────────────────

interface Props {
    leaseId: string;
    canManage: boolean;
}

export function DepositSection({ leaseId, canManage }: Props) {
    const { data: deposit, isLoading, error } = useLeaseDeposit(leaseId);
    const forfeitMutation = useForfeitDepositMutation(leaseId);

    const [showStkModal, setShowStkModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [pendingForfeit, setPendingForfeit] = useState(false);

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-border/60 dark:border-border-dark/60 bg-surface dark:bg-surface-dark shadow-sm p-5 space-y-3">
                <div className="skeleton h-4 w-28" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map(i => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    const is404 = (error as { status?: number } | null)?.status === 404;
    if (!deposit || is404) {
        return (
            <div className="rounded-2xl border border-border/60 dark:border-border-dark/60 bg-surface dark:bg-surface-dark shadow-sm p-5 animate-fade-in-up">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">No deposit has been recorded for this lease.</p>
            </div>
        );
    }

    if (error && !is404) {
        return (
            <div className="rounded-2xl border border-danger/20 bg-surface dark:bg-surface-dark shadow-sm p-5 animate-fade-in-up">
                <p className="text-sm text-danger">Could not load deposit details. Please refresh.</p>
            </div>
        );
    }

    const {
        id, status, amountPaid, amountRequired, amountRefunded, currency,
        deductionAmount, deductionReason, refundReference, refundRemarks,
        paidAt, refundedAt, renterName, renterPhone,
        hasPendingRefund, pendingRefundInitiatedAt,
    } = deposit;

    const isHeld = status === "HELD";
    const isSettled = status === "REFUNDED" || status === "PARTIALLY_REFUNDED" || status === "FORFEITED";
    const hasDeduction = deductionAmount && toMoneyNumber(deductionAmount) > 0;
    const meta = STATUS_META[status] ?? STATUS_META.HELD;

    const handleForfeit = async () => {
        await forfeitMutation.mutateAsync(id);
        setPendingForfeit(false);
    };

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

    return (
        <>
            <div className={`rounded-2xl border bg-surface dark:bg-surface-dark shadow-sm overflow-hidden animate-fade-in-up transition-all duration-300 ${
                hasPendingRefund ? "border-brand/30 dark:border-brand/20 shadow-md shadow-brand/5" : meta.cardAccent
            }`}>
                {/* Top accent bar — only for meaningful states */}
                {(isHeld || hasPendingRefund) && (
                    <div className={`h-0.5 ${
                        hasPendingRefund
                            ? "bg-gradient-to-r from-brand via-brand-400 to-brand-200"
                            : "bg-gradient-to-r from-blue-300 via-blue-200 to-transparent"
                    }`} />
                )}
                {status === "REFUNDED" && (
                    <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent" />
                )}

                <div className="p-5 space-y-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                status === "REFUNDED" ? "bg-emerald-50 dark:bg-emerald-900/20" :
                                status === "HELD" ? "bg-blue-50 dark:bg-blue-900/20" :
                                "bg-ink/[0.04] dark:bg-white/[0.04]"
                            }`}>
                                <meta.Icon className={`h-4 w-4 ${
                                    status === "REFUNDED" ? "text-emerald-600 dark:text-emerald-400" :
                                    status === "HELD" ? "text-blue-600 dark:text-blue-400" :
                                    "text-fg-muted dark:text-fg-muted-dark"
                                }`} strokeWidth={1.75} />
                            </div>
                            <h3 className="text-sm font-bold text-fg dark:text-fg-dark">Security Deposit</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={status} hasPending={hasPendingRefund} />
                        </div>
                    </div>

                    {/* Core figures */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <FigureTile
                            label="Required"
                            value={formatCurrencyPrecise(amountRequired, currency)}
                        />
                        <FigureTile
                            label="Collected"
                            value={formatCurrencyPrecise(amountPaid, currency)}
                            sub={paidAt ? fmtDate(paidAt) : undefined}
                        />
                        {isSettled && (
                            <FigureTile
                                label={status === "FORFEITED" ? "Forfeited" : "Refunded"}
                                value={status === "FORFEITED"
                                    ? formatCurrencyPrecise(amountPaid, currency)
                                    : formatCurrencyPrecise(amountRefunded, currency)}
                                sub={refundedAt ? fmtDate(refundedAt) : undefined}
                                accent={status === "FORFEITED" ? "zinc" : "emerald"}
                            />
                        )}
                    </div>

                    {/* Settled detail block */}
                    {isSettled && (hasDeduction || refundReference || refundRemarks) && (
                        <div className="rounded-xl border border-border/50 dark:border-border-dark/50 overflow-hidden divide-y divide-border/40 dark:divide-border-dark/40">
                            {hasDeduction && (
                                <div className="px-4 py-3 flex items-start gap-3 bg-amber-50/40 dark:bg-amber-900/10">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-fg-muted dark:text-fg-muted-dark uppercase tracking-widest mb-0.5">Deduction</p>
                                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400 font-data">{formatCurrencyPrecise(deductionAmount, currency)}</p>
                                        {deductionReason && <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{deductionReason}</p>}
                                    </div>
                                </div>
                            )}
                            {refundReference && (
                                <div className="px-4 py-3 bg-ink/[0.005] dark:bg-white/[0.005]">
                                    <p className="text-[10px] font-bold text-fg-muted dark:text-fg-muted-dark uppercase tracking-widest mb-1">M-Pesa Reference</p>
                                    <p className="text-sm font-mono tracking-wide text-fg dark:text-fg-dark">{refundReference}</p>
                                </div>
                            )}
                            {refundRemarks && (
                                <div className="px-4 py-3 bg-ink/[0.005] dark:bg-white/[0.005]">
                                    <p className="text-[10px] font-bold text-fg-muted dark:text-fg-muted-dark uppercase tracking-widest mb-1">Remarks</p>
                                    <p className="text-sm text-fg dark:text-fg-dark">{refundRemarks}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending STK banner */}
                    {isHeld && hasPendingRefund && (
                        <PendingRefundBanner
                            depositId={id}
                            leaseId={leaseId}
                            initiatedAt={pendingRefundInitiatedAt}
                        />
                    )}

                    {/* Actions */}
                    {isHeld && !hasPendingRefund && canManage && (
                        <div className="flex flex-wrap gap-2.5 pt-1">
                            <button
                                onClick={() => setShowStkModal(true)}
                                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark shadow-md shadow-brand/20 hover:shadow-lg hover:shadow-brand/25 hover:-translate-y-px transition-all duration-200"
                            >
                                <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
                                Refund via M-Pesa
                            </button>
                            <button
                                onClick={() => setShowManualModal(true)}
                                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border/60 dark:border-border-dark/60 bg-surface dark:bg-surface-dark text-sm font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark hover:border-fg/20 dark:hover:border-white/20 transition-all duration-200"
                            >
                                <ReceiptText className="h-3.5 w-3.5" strokeWidth={2} />
                                Record manually
                            </button>
                            <button
                                onClick={() => setPendingForfeit(true)}
                                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-border/60 dark:border-border-dark/60 bg-surface dark:bg-surface-dark text-sm font-medium text-fg-muted dark:text-fg-muted-dark hover:text-danger dark:hover:text-danger hover:border-danger/30 transition-all duration-200"
                            >
                                <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                                Forfeit
                            </button>
                        </div>
                    )}

                    {/* Inline forfeit confirm */}
                    {pendingForfeit && (
                        <div className="rounded-2xl border border-danger/30 dark:border-danger/20 bg-danger/[0.03] dark:bg-danger/[0.05] px-4 py-3.5 flex flex-wrap items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-danger shrink-0" strokeWidth={2} />
                            <p className="flex-1 text-sm font-medium text-danger">
                                Forfeit the full deposit? This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleForfeit}
                                    disabled={forfeitMutation.isPending}
                                    className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-danger text-white text-xs font-semibold hover:bg-danger-dark disabled:opacity-50 shadow-sm shadow-danger/20 transition-all duration-200"
                                >
                                    {forfeitMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                                    Confirm Forfeit
                                </button>
                                <button
                                    onClick={() => setPendingForfeit(false)}
                                    disabled={forfeitMutation.isPending}
                                    className="h-8 px-3 rounded-xl text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark border border-border/50 dark:border-border-dark/50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {forfeitMutation.error && (
                        <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                            <p className="text-xs text-danger">
                                {getProcessErrorMessage(forfeitMutation.error, "Could not forfeit the deposit.")}
                            </p>
                        </div>
                    )}

                    {/* Quick link to Refund Deposit hub */}
                    {isHeld && !hasPendingRefund && (
                        <div className="flex items-center gap-2 pt-1">
                            <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                            <Link
                                href="/dashboard/disbursements"
                                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-muted dark:text-fg-muted-dark hover:text-brand dark:hover:text-brand-400 transition-colors"
                            >
                                View all deposits
                                <ArrowRight className="h-3 w-3" strokeWidth={2} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {showStkModal && (
                <StkRefundModal
                    depositId={id}
                    amountPaid={amountPaid}
                    currency={currency}
                    leaseId={leaseId}
                    renterName={renterName}
                    renterPhone={renterPhone}
                    onClose={() => setShowStkModal(false)}
                />
            )}
            {showManualModal && (
                <ManualRefundModal
                    depositId={id}
                    amountPaid={amountPaid}
                    currency={currency}
                    leaseId={leaseId}
                    onClose={() => setShowManualModal(false)}
                />
            )}
        </>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ShieldCheck,
    Send,
    RefreshCw,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Ban,
    ReceiptText,
    Clock,
    X,
    Info,
    Smartphone,
    Phone,
    User,
    ArrowRight,
    ExternalLink,
    Filter,
} from "lucide-react";
import { useDepositsQuery, useInitiateRefundMutation, useCancelPendingRefundMutation, useForfeitDepositMutation } from "@/features/deposit/hooks/use-deposit-queries";
import type { DepositResponse, DepositStatus, InitiateDepositRefundRequest } from "@/features/deposit/types/deposit-types";
import { formatCurrencyPrecise, toMoneyNumber } from "@/shared/utils/money";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = DepositStatus | "";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
        : "—";

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Status meta ───────────────────────────────────────────────────────────────

const STATUS_META: Record<DepositStatus, { label: string; chip: string; dot: string; Icon: typeof ShieldCheck }> = {
    UNPAID:             { label: "Unpaid",             chip: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-400",   Icon: AlertTriangle },
    HELD:               { label: "Held",               chip: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-500",    Icon: ShieldCheck },
    PARTIALLY_REFUNDED: { label: "Partial Refund",     chip: "bg-orange-50 text-orange-700 border-orange-200",  dot: "bg-orange-400",  Icon: ReceiptText },
    REFUNDED:           { label: "Refunded",           chip: "bg-emerald-50 text-emerald-700 border-emerald-200",dot: "bg-emerald-500", Icon: CheckCircle2 },
    FORFEITED:          { label: "Forfeited",          chip: "bg-zinc-100 text-zinc-500 border-zinc-200",       dot: "bg-zinc-400",    Icon: Ban },
};

const STATUS_FILTER_TABS: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "" },
    { label: "Held", value: "HELD" },
    { label: "Partial", value: "PARTIALLY_REFUNDED" },
    { label: "Refunded", value: "REFUNDED" },
    { label: "Forfeited", value: "FORFEITED" },
];

function StatusChip({ status, hasPending }: { status: DepositStatus; hasPending?: boolean }) {
    const meta = STATUS_META[status] ?? STATUS_META.HELD;
    const { Icon, label, chip, dot } = meta;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${chip}`}>
            {hasPending ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
            ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            )}
            {hasPending ? "Pending" : label}
        </span>
    );
}

// ── STK Refund Modal ──────────────────────────────────────────────────────────

interface StkModalProps {
    deposit: DepositResponse;
    onClose: () => void;
}

function StkRefundModal({ deposit, onClose }: StkModalProps) {
    const initiateMutation = useInitiateRefundMutation(deposit.leaseId);

    const [landlordPhone, setLandlordPhone] = useState("");
    const [deduction, setDeduction] = useState("");
    const [reason, setReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [sent, setSent] = useState(false);

    const paid = toMoneyNumber(deposit.amountPaid);
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
        if (hasDeduction && !reason.trim()) errs.reason = "Required when deducting";
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
        await initiateMutation.mutateAsync({ depositId: deposit.id, request });
        setSent(true);
    };

    if (sent) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border/60 dark:border-border-dark/60 shadow-dropdown p-8 max-w-sm w-full animate-fade-in-up text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 mx-auto mb-5 ring-1 ring-brand/20">
                        <Smartphone className="h-8 w-8 text-brand" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-base font-bold text-fg dark:text-fg-dark mb-2">Check your phone</h2>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-5 leading-relaxed">
                        An M-Pesa prompt was sent to{" "}
                        <span className="font-semibold text-fg dark:text-fg-dark">{landlordPhone}</span>. Enter your PIN to authorise{" "}
                        <span className="font-semibold text-fg dark:text-fg-dark">{formatCurrencyPrecise(refundAmount, deposit.currency)}</span>.
                    </p>
                    {deposit.renterPhone && (
                        <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 dark:border-amber-800/30 dark:bg-amber-900/10 p-3 mb-5 text-left">
                            <div className="flex gap-2.5 items-start">
                                <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
                                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                    After confirming, also send{" "}
                                    <span className="font-semibold">{formatCurrencyPrecise(refundAmount, deposit.currency)}</span>{" "}
                                    to {deposit.renterName ?? "the tenant"} at{" "}
                                    <span className="font-semibold font-mono">{deposit.renterPhone}</span> via M-Pesa.
                                </p>
                            </div>
                        </div>
                    )}
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-6">This page updates automatically once confirmed.</p>
                    <button onClick={onClose} className="btn-secondary text-sm w-full">Done</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border/60 dark:border-border-dark/60 shadow-dropdown w-full max-w-lg animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-border/50 dark:border-border-dark/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                                <Smartphone className="h-5 w-5 text-brand" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-fg dark:text-fg-dark">Refund via M-Pesa</h2>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Held: {formatCurrencyPrecise(deposit.amountPaid, deposit.currency)}</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} disabled={initiateMutation.isPending}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted dark:text-fg-muted-dark hover:bg-ink/[0.05] dark:hover:bg-white/[0.05] transition-colors">
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Renter info */}
                    {(deposit.renterName || deposit.renterPhone) && (
                        <div className="rounded-xl border border-border/60 dark:border-border-dark/60 bg-ink/[0.01] dark:bg-white/[0.01] p-3.5 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 shrink-0">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider mb-0.5">Refunding to</p>
                                <p className="text-sm font-semibold text-fg dark:text-fg-dark truncate">{deposit.renterName ?? "—"}</p>
                                {deposit.renterPhone && (
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark font-mono">{deposit.renterPhone}</p>
                                )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark shrink-0" strokeWidth={2} />
                        </div>
                    )}

                    {/* How it works */}
                    <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/30 bg-blue-50/60 dark:bg-blue-900/10 p-3.5 flex gap-2.5">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            An M-Pesa prompt will be sent to your phone. Enter your PIN to authorise. The deposit is automatically recorded as refunded when Safaricom confirms.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="form-label">Your M-Pesa number <span className="text-danger">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-muted dark:text-fg-muted-dark pointer-events-none" strokeWidth={1.5} />
                                <input
                                    type="tel"
                                    value={landlordPhone}
                                    onChange={(e) => { setLandlordPhone(e.target.value); setFieldErrors(p => ({ ...p, landlordPhone: "" })); }}
                                    placeholder="e.g. 0712 345678"
                                    className="form-input w-full pl-9"
                                />
                            </div>
                            {fieldErrors.landlordPhone && <p className="mt-1 text-xs text-danger">{fieldErrors.landlordPhone}</p>}
                            <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark">Must match your Daraja shortcode credentials.</p>
                        </div>

                        <div>
                            <label className="form-label">
                                Deduction ({deposit.currency})
                                <span className="ml-1 font-normal text-fg-muted dark:text-fg-muted-dark">— 0 for full refund</span>
                            </label>
                            <input
                                type="number" step="0.01" min="0"
                                value={deduction}
                                onChange={(e) => { setDeduction(e.target.value); setFieldErrors(p => ({ ...p, deduction: "" })); }}
                                placeholder="0.00"
                                className="form-input w-full"
                            />
                            {fieldErrors.deduction && <p className="mt-1 text-xs text-danger">{fieldErrors.deduction}</p>}
                        </div>

                        {hasDeduction && (
                            <div>
                                <label className="form-label">Reason for deduction <span className="text-danger">*</span></label>
                                <input
                                    value={reason}
                                    onChange={(e) => { setReason(e.target.value); setFieldErrors(p => ({ ...p, reason: "" })); }}
                                    placeholder="e.g. Water heater damage, unpaid water bill"
                                    className="form-input w-full"
                                />
                                {fieldErrors.reason && <p className="mt-1 text-xs text-danger">{fieldErrors.reason}</p>}
                            </div>
                        )}

                        <div className="rounded-xl border border-border/60 dark:border-border-dark/60 bg-ink/[0.02] dark:bg-white/[0.02] px-4 py-3 flex items-center justify-between">
                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark font-medium">Amount to authorise</span>
                            <span className="text-sm font-bold text-fg dark:text-fg-dark font-data">
                                {formatCurrencyPrecise(refundAmount, deposit.currency)}
                            </span>
                        </div>

                        <div>
                            <label className="form-label">Remarks (optional)</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={2}
                                placeholder="Any notes for the record"
                                className="form-input w-full resize-none"
                            />
                        </div>

                        {initiateMutation.error && (
                            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                                <p className="text-xs text-danger">
                                    {getProcessErrorMessage(initiateMutation.error, "Could not send the M-Pesa prompt. Please try again.")}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-1">
                            <button type="button" onClick={onClose} disabled={initiateMutation.isPending} className="btn-secondary text-xs">Cancel</button>
                            <button
                                type="submit"
                                disabled={initiateMutation.isPending || refundAmount <= 0}
                                className="btn-primary text-xs gap-1.5"
                            >
                                {initiateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                                {initiateMutation.isPending ? "Sending prompt…" : "Send M-Pesa Prompt"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ── Deposit Card ──────────────────────────────────────────────────────────────

interface DepositCardProps {
    deposit: DepositResponse;
    onRefund: (deposit: DepositResponse) => void;
}

function DepositCard({ deposit, onRefund }: DepositCardProps) {
    const cancelMutation = useCancelPendingRefundMutation(deposit.leaseId);
    const forfeitMutation = useForfeitDepositMutation(deposit.leaseId);
    const [pendingForfeit, setPendingForfeit] = useState(false);

    const isHeld = deposit.status === "HELD";
    const initials = getInitials(deposit.renterName);
    const meta = STATUS_META[deposit.status] ?? STATUS_META.HELD;
    const Icon = meta.Icon;

    return (
        <div className={`bg-surface dark:bg-surface-dark rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden ${
            deposit.hasPendingRefund
                ? "border-brand/30 dark:border-brand/20"
                : "border-border/60 dark:border-border-dark/60"
        }`}>
            {deposit.hasPendingRefund && (
                <div className="h-0.5 bg-gradient-to-r from-brand via-brand-400 to-brand-200" />
            )}

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/30 text-sm font-bold text-brand-700 dark:text-brand-300 ring-1 ring-brand-200/50 dark:ring-brand-700/30">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-fg dark:text-fg-dark truncate">
                                {deposit.renterName ?? "Unknown renter"}
                            </p>
                            <StatusChip status={deposit.status} hasPending={deposit.hasPendingRefund} />
                        </div>
                        {deposit.renterPhone && (
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark font-mono mt-0.5">{deposit.renterPhone}</p>
                        )}
                    </div>
                    <Link
                        href={`/dashboard/leases/${deposit.leaseId}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-fg-subtle dark:text-fg-subtle-dark hover:text-fg dark:hover:text-fg-dark hover:bg-ink/[0.05] dark:hover:bg-white/[0.05] transition-colors shrink-0"
                        title="View lease"
                    >
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                    </Link>
                </div>

                {/* Amount grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl border border-border/50 dark:border-border-dark/50 bg-ink/[0.01] dark:bg-white/[0.01] px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider mb-1">Required</p>
                        <p className="text-sm font-bold text-fg dark:text-fg-dark font-data tabular-nums">{formatCurrencyPrecise(deposit.amountRequired, deposit.currency)}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 dark:border-border-dark/50 bg-ink/[0.01] dark:bg-white/[0.01] px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider mb-1">Held</p>
                        <p className="text-sm font-bold text-fg dark:text-fg-dark font-data tabular-nums">{formatCurrencyPrecise(deposit.amountPaid, deposit.currency)}</p>
                        {deposit.paidAt && <p className="text-[9px] text-fg-muted dark:text-fg-muted-dark mt-0.5">{fmtDate(deposit.paidAt)}</p>}
                    </div>
                    <div className={`rounded-xl border px-3 py-2.5 ${
                        deposit.status === "REFUNDED" || deposit.status === "PARTIALLY_REFUNDED"
                            ? "border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/40 dark:bg-emerald-900/10"
                            : deposit.status === "FORFEITED"
                                ? "border-zinc-200/60 dark:border-zinc-700/30 bg-zinc-50/40 dark:bg-zinc-900/10"
                                : "border-border/50 dark:border-border-dark/50 bg-ink/[0.01] dark:bg-white/[0.01]"
                    }`}>
                        <p className="text-[10px] font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider mb-1">
                            {deposit.status === "FORFEITED" ? "Forfeited" : "Refunded"}
                        </p>
                        <p className={`text-sm font-bold font-data tabular-nums ${
                            deposit.status === "REFUNDED" || deposit.status === "PARTIALLY_REFUNDED"
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-fg dark:text-fg-dark"
                        }`}>{formatCurrencyPrecise(deposit.amountRefunded, deposit.currency)}</p>
                        {deposit.refundedAt && <p className="text-[9px] text-fg-muted dark:text-fg-muted-dark mt-0.5">{fmtDate(deposit.refundedAt)}</p>}
                    </div>
                </div>

                {/* Pending refund banner */}
                {isHeld && deposit.hasPendingRefund && (
                    <div className="mb-4 rounded-xl border border-brand/30 dark:border-brand/20 bg-brand/5 dark:bg-brand/[0.06] px-3.5 py-3 flex items-center gap-3">
                        <Loader2 className="h-4 w-4 text-brand animate-spin shrink-0" strokeWidth={2} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-fg dark:text-fg-dark">Awaiting M-Pesa confirmation</p>
                            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">Enter your PIN on the prompt. Updates automatically.</p>
                        </div>
                        <button
                            onClick={() => cancelMutation.mutate(deposit.id)}
                            disabled={cancelMutation.isPending}
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border/60 dark:border-border-dark/60 text-[11px] text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors shrink-0"
                        >
                            {cancelMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> : <X className="h-3 w-3" strokeWidth={2} />}
                            Cancel
                        </button>
                    </div>
                )}

                {/* Forfeit confirm */}
                {pendingForfeit && (
                    <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-3 flex flex-wrap items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-danger shrink-0" strokeWidth={2} />
                        <p className="flex-1 text-xs text-danger">Forfeit the full deposit? This cannot be undone.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={async () => { await forfeitMutation.mutateAsync(deposit.id); setPendingForfeit(false); }}
                                disabled={forfeitMutation.isPending}
                                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-danger text-white text-xs font-medium hover:bg-danger-dark disabled:opacity-50 transition-colors"
                            >
                                {forfeitMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                                Confirm
                            </button>
                            <button onClick={() => setPendingForfeit(false)} disabled={forfeitMutation.isPending}
                                className="h-7 px-3 rounded-lg text-xs text-fg-muted hover:text-fg transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Settled details */}
                {(deposit.status === "REFUNDED" || deposit.status === "PARTIALLY_REFUNDED") && deposit.refundReference && (
                    <div className="mb-4 rounded-xl border border-border/50 dark:border-border-dark/50 bg-ink/[0.01] dark:bg-white/[0.01] px-3.5 py-2.5">
                        <p className="text-[10px] font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider mb-1">M-Pesa Reference</p>
                        <p className="text-xs font-mono tracking-wide text-fg dark:text-fg-dark">{deposit.refundReference}</p>
                    </div>
                )}

                {/* Actions */}
                {isHeld && !deposit.hasPendingRefund && (
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => onRefund(deposit)}
                            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-dark shadow-sm shadow-brand/20 transition-all duration-200 hover:-translate-y-px"
                        >
                            <Smartphone className="h-3.5 w-3.5" strokeWidth={2} />
                            Refund via M-Pesa
                        </button>
                        <button
                            onClick={() => setPendingForfeit(true)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border/60 dark:border-border-dark/60 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark hover:border-fg/20 transition-all duration-200"
                        >
                            <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                            Forfeit
                        </button>
                        <Link
                            href={`/dashboard/leases/${deposit.leaseId}`}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border/60 dark:border-border-dark/60 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-all duration-200"
                        >
                            <ReceiptText className="h-3.5 w-3.5" strokeWidth={2} />
                            Record manually
                        </Link>
                    </div>
                )}

                {forfeitMutation.error && (
                    <p className="mt-2 text-xs text-danger">
                        {getProcessErrorMessage(forfeitMutation.error, "Could not forfeit the deposit.")}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RefundDepositPage() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
    const [activeModal, setActiveModal] = useState<DepositResponse | null>(null);

    const { data: deposits, isLoading, isError, error, refetch } = useDepositsQuery(
        statusFilter !== "" ? statusFilter : undefined
    );

    const heldCount = deposits?.filter((d) => d.status === "HELD").length ?? 0;
    const pendingCount = deposits?.filter((d) => d.hasPendingRefund).length ?? 0;

    return (
        <div className="page-container space-y-6 pb-12">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="animate-fade-in-up">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/20 ring-1 ring-white/20">
                            <Send className="h-7 w-7 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-fg dark:text-fg-dark tracking-tight font-display">Refund Deposit</h1>
                            <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                Initiate deposit refunds via M-Pesa STK push. Funds go directly to the tenant.
                            </p>
                        </div>
                    </div>

                    {/* Stat pills */}
                    <div className="flex gap-2 flex-wrap">
                        {heldCount > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/60 dark:border-blue-800/30 bg-blue-50/60 dark:bg-blue-900/10 text-xs font-semibold text-blue-700 dark:text-blue-400">
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                                {heldCount} held
                            </div>
                        )}
                        {pendingCount > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand/30 dark:border-brand/20 bg-brand/5 dark:bg-brand/[0.06] text-xs font-semibold text-brand animate-pulse">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                                {pendingCount} pending
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Info banner ────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-blue-200/60 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/10 p-4 flex gap-3 animate-fade-in-up">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
                <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed space-y-1">
                    <p><strong>How it works:</strong> Click "Refund via M-Pesa" on a held deposit. An STK prompt goes to your phone — enter your PIN to authorise. The deposit is automatically recorded when Safaricom confirms.</p>
                    <p>After confirming, use M-Pesa Send Money to transfer the amount to the tenant's number shown on the card.</p>
                </div>
            </div>

            {/* ── Status filter tabs ──────────────────────────────────────── */}
            <div className="flex gap-1.5 flex-wrap items-center">
                <Filter className="h-3.5 w-3.5 text-fg-muted dark:text-fg-muted-dark shrink-0" strokeWidth={2} />
                {STATUS_FILTER_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                            statusFilter === tab.value
                                ? "bg-brand text-white shadow-sm shadow-brand/20"
                                : "bg-surface dark:bg-surface-dark text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark border border-border dark:border-border-dark"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Loading ─────────────────────────────────────────────────── */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skeleton h-52 w-full rounded-2xl" />
                    ))}
                </div>
            )}

            {/* ── Error ───────────────────────────────────────────────────── */}
            {isError && (
                <div className="max-w-md mx-auto mt-12 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm p-10 text-center animate-fade-in-up">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/20 to-danger/10 shadow-sm ring-1 ring-danger/20">
                        <AlertTriangle className="h-8 w-8 text-danger" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-semibold text-fg dark:text-fg-dark mb-1">Couldn&apos;t load deposits</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6">{(error as Error)?.message || "Something went wrong."}</p>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <RefreshCw className="w-4 h-4" strokeWidth={2} />
                        Try again
                    </button>
                </div>
            )}

            {/* ── Empty ───────────────────────────────────────────────────── */}
            {!isLoading && !isError && deposits && deposits.length === 0 && (
                <div className="max-w-md mx-auto mt-12 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm p-10 text-center animate-fade-in-up">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 shadow-sm ring-1 ring-brand/20">
                        <ShieldCheck className="h-8 w-8 text-brand" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-semibold text-fg dark:text-fg-dark mb-1">No deposits found</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark max-w-xs mx-auto">
                        {statusFilter
                            ? `No ${STATUS_META[statusFilter as DepositStatus]?.label.toLowerCase() ?? statusFilter.toLowerCase()} deposits yet.`
                            : "Deposits appear here once a tenant pays their security deposit."}
                    </p>
                    {statusFilter && (
                        <button
                            onClick={() => setStatusFilter("")}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark transition-colors"
                        >
                            Clear filter
                        </button>
                    )}
                </div>
            )}

            {/* ── Grid ────────────────────────────────────────────────────── */}
            {!isLoading && !isError && deposits && deposits.length > 0 && (
                <>
                    {/* Pending first, then by date */}
                    {pendingCount > 0 && !statusFilter && (
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <p className="text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">
                                    Pending confirmation
                                </p>
                                <div className="h-px flex-1 bg-gradient-to-r from-brand/30 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {deposits.filter(d => d.hasPendingRefund).map((deposit) => (
                                    <DepositCard key={deposit.id} deposit={deposit} onRefund={setActiveModal} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* HELD deposits */}
                    {!statusFilter && deposits.filter(d => d.status === "HELD" && !d.hasPendingRefund).length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <p className="text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">
                                    Held — awaiting refund
                                </p>
                                <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {deposits.filter(d => d.status === "HELD" && !d.hasPendingRefund).map((deposit) => (
                                    <DepositCard key={deposit.id} deposit={deposit} onRefund={setActiveModal} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All other statuses (or filtered view) */}
                    {(statusFilter || deposits.filter(d => d.status !== "HELD").length > 0) && (
                        <div>
                            {!statusFilter && (
                                <div className="flex items-center gap-3 mb-3">
                                    <p className="text-xs font-semibold text-fg-muted dark:text-fg-muted-dark uppercase tracking-wider">Settled</p>
                                    <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(statusFilter
                                    ? deposits
                                    : deposits.filter(d => d.status !== "HELD")
                                ).map((deposit) => (
                                    <DepositCard key={deposit.id} deposit={deposit} onRefund={setActiveModal} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── STK Modal ───────────────────────────────────────────────── */}
            {activeModal && (
                <StkRefundModal
                    deposit={activeModal}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import {
    ShieldCheck,
    AlertTriangle,
    Loader2,
    X,
    CheckCircle2,
    Ban,
    ReceiptText,
    Info,
} from "lucide-react";
import {
    useLeaseDeposit,
    useRefundDepositMutation,
    useForfeitDepositMutation,
} from "../hooks/use-deposit-queries";
import type { DepositStatus, RefundDepositRequest } from "../types/deposit-types";
import { formatCurrencyPrecise, toMoneyNumber } from "@/shared/utils/money";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

// ── Status presentation ────────────────────────────────────────────────────────

const STATUS_META: Record<DepositStatus, { label: string; classes: string; Icon: typeof ShieldCheck }> = {
    UNPAID:             { label: "Unpaid",             classes: "bg-amber-50 text-amber-700 border-amber-200",   Icon: AlertTriangle },
    HELD:               { label: "Held",               classes: "bg-blue-50 text-blue-700 border-blue-200",       Icon: ShieldCheck },
    PARTIALLY_REFUNDED: { label: "Partially Refunded", classes: "bg-orange-50 text-orange-700 border-orange-200", Icon: ReceiptText },
    REFUNDED:           { label: "Refunded",           classes: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    FORFEITED:          { label: "Forfeited",          classes: "bg-zinc-100 text-zinc-600 border-zinc-200",      Icon: Ban },
};

function StatusBadge({ status }: { status: DepositStatus }) {
    const meta = STATUS_META[status] ?? STATUS_META.HELD;
    const { Icon, label, classes } = meta;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${classes}`}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
        </span>
    );
}

// ── Refund Modal ───────────────────────────────────────────────────────────────

interface RefundModalProps {
    depositId: string;
    amountPaid: string;
    currency: string;
    leaseId: string;
    onClose: () => void;
}

function RefundModal({ depositId, amountPaid, currency, leaseId, onClose }: RefundModalProps) {
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
        if (deduction !== "" && (isNaN(Number(deduction)) || Number(deduction) < 0)) {
            errs.deduction = "Must be 0 or a positive number";
        }
        if (isFullForfeit) {
            errs.deduction = "Deduction equals or exceeds the held amount — use Forfeit instead";
        }
        if (hasDeduction && !reason.trim()) {
            errs.reason = "Required when deducting for damages or unpaid bills";
        }
        if (refundAmount > 0 && !reference.trim()) {
            errs.reference = "Enter the M-Pesa receipt code for the payment you sent";
        }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl border border-border/60 shadow-dropdown p-6 max-w-lg w-full mx-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                            <ShieldCheck className="h-4.5 w-4.5 text-blue-600" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-ink">Record Deposit Refund</h2>
                            <p className="text-xs text-ink-muted">Held: {formatCurrencyPrecise(amountPaid, currency)}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={mutation.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-ink/[0.05] transition-colors"
                    >
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>

                {/* Instruction banner */}
                <div className="mb-4 rounded-xl border border-blue-200/60 bg-blue-50/60 p-3 flex gap-2.5">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" strokeWidth={2} />
                    <p className="text-xs text-blue-800 leading-relaxed">
                        Send the refund to the tenant from your own M-Pesa first, then enter the Safaricom receipt code below to record it here.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Deduction amount */}
                    <div>
                        <label className="form-label">
                            Deduction amount ({currency})
                            <span className="ml-1 font-normal text-ink-muted/80">— 0 for a full refund</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={deduction}
                            onChange={(e) => {
                                setDeduction(e.target.value);
                                setFieldErrors((p) => ({ ...p, deduction: undefined as unknown as string }));
                            }}
                            placeholder="0.00"
                            className="form-input w-full"
                        />
                        {fieldErrors.deduction && (
                            <p className="mt-1 text-xs text-danger">{fieldErrors.deduction}</p>
                        )}
                    </div>

                    {/* Deduction reason — only shown when there is a deduction */}
                    {hasDeduction && (
                        <div>
                            <label className="form-label">
                                Reason for deduction <span className="text-danger">*</span>
                            </label>
                            <input
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    setFieldErrors((p) => ({ ...p, reason: undefined as unknown as string }));
                                }}
                                placeholder="e.g. Water heater damage, unpaid water bill"
                                className="form-input w-full"
                            />
                            {fieldErrors.reason && (
                                <p className="mt-1 text-xs text-danger">{fieldErrors.reason}</p>
                            )}
                        </div>
                    )}

                    {/* Refund preview */}
                    <div className="rounded-xl border border-border/60 bg-ink/[0.02] px-4 py-3 flex items-center justify-between">
                        <span className="text-xs text-ink-muted font-medium">Refund amount</span>
                        <span className="text-sm font-bold text-ink font-data">
                            {formatCurrencyPrecise(refundAmount, currency)}
                        </span>
                    </div>

                    {/* M-Pesa reference */}
                    {refundAmount > 0 && (
                        <div>
                            <label className="form-label">
                                M-Pesa transaction code <span className="text-danger">*</span>
                            </label>
                            <input
                                value={reference}
                                onChange={(e) => {
                                    setReference(e.target.value.toUpperCase().trim());
                                    setFieldErrors((p) => ({ ...p, reference: undefined as unknown as string }));
                                }}
                                placeholder="e.g. RA65XXXX1A"
                                className="form-input w-full font-mono tracking-wide"
                            />
                            {fieldErrors.reference && (
                                <p className="mt-1 text-xs text-danger">{fieldErrors.reference}</p>
                            )}
                            <p className="mt-1 text-xs text-ink-muted">
                                The receipt code from the Safaricom confirmation SMS. This proves the payment was sent.
                            </p>
                        </div>
                    )}

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

                    {mutation.error && (
                        <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                            <p className="text-xs text-danger">
                                {getProcessErrorMessage(mutation.error, "Could not record the refund. Please try again.")}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={mutation.isPending}
                            className="btn-secondary text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="btn-primary text-xs gap-1.5"
                        >
                            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                            {mutation.isPending ? "Recording…" : "Record Refund"}
                        </button>
                    </div>
                </form>
            </div>
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

    const [showRefundModal, setShowRefundModal] = useState(false);
    const [pendingForfeit, setPendingForfeit] = useState(false);

    if (isLoading) {
        return (
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm p-5">
                <div className="skeleton h-4 w-32 mb-4" />
                <div className="skeleton h-16 w-full rounded-xl" />
            </div>
        );
    }

    // 404 = no deposit yet (lease might not be activated, or never had one)
    const is404 = (error as { status?: number } | null)?.status === 404;
    if (!deposit || is404) {
        return (
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm p-5 animate-fade-in-up">
                <h3 className="section-header inline-flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
                    Security Deposit
                </h3>
                <p className="text-sm text-ink-muted">No deposit has been recorded for this lease.</p>
            </div>
        );
    }

    if (error && !is404) {
        return (
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm p-5 animate-fade-in-up">
                <h3 className="section-header inline-flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
                    Security Deposit
                </h3>
                <p className="text-sm text-danger">Could not load deposit details. Please refresh.</p>
            </div>
        );
    }

    const { id, status, amountPaid, amountRequired, amountRefunded, currency,
            deductionAmount, deductionReason, refundReference, refundRemarks,
            paidAt, refundedAt } = deposit;

    const isHeld = status === "HELD";
    const isSettled = status === "REFUNDED" || status === "PARTIALLY_REFUNDED" || status === "FORFEITED";
    const hasDeduction = deductionAmount && toMoneyNumber(deductionAmount) > 0;

    const handleForfeit = async () => {
        await forfeitMutation.mutateAsync(id);
        setPendingForfeit(false);
    };

    return (
        <>
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm p-5 animate-fade-in-up space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="section-header inline-flex items-center gap-2 mb-0">
                        <ShieldCheck className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
                        Security Deposit
                    </h3>
                    <StatusBadge status={status} />
                </div>

                {/* Core figures */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/60 bg-ink/[0.01] px-4 py-3">
                        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">Required</p>
                        <p className="text-sm font-bold text-ink font-data">{formatCurrencyPrecise(amountRequired, currency)}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-ink/[0.01] px-4 py-3">
                        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">Collected</p>
                        <p className="text-sm font-bold text-ink font-data">{formatCurrencyPrecise(amountPaid, currency)}</p>
                        {paidAt && (
                            <p className="text-[10px] text-ink-muted mt-0.5">
                                {new Date(paidAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                        )}
                    </div>
                    {isSettled && (
                        <div className="rounded-xl border border-border/60 bg-ink/[0.01] px-4 py-3">
                            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">
                                {status === "FORFEITED" ? "Forfeited" : "Refunded"}
                            </p>
                            <p className="text-sm font-bold text-ink font-data">
                                {status === "FORFEITED" ? formatCurrencyPrecise(amountPaid, currency) : formatCurrencyPrecise(amountRefunded, currency)}
                            </p>
                            {refundedAt && (
                                <p className="text-[10px] text-ink-muted mt-0.5">
                                    {new Date(refundedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Settled details */}
                {isSettled && (hasDeduction || refundReference || refundRemarks) && (
                    <div className="rounded-xl border border-border/60 bg-ink/[0.01] divide-y divide-border/40">
                        {hasDeduction && (
                            <div className="px-4 py-3 flex items-start gap-3">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">Deduction</p>
                                    <p className="text-sm font-bold text-ink font-data">{formatCurrencyPrecise(deductionAmount, currency)}</p>
                                    {deductionReason && (
                                        <p className="text-xs text-ink-muted mt-0.5">{deductionReason}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {refundReference && (
                            <div className="px-4 py-3">
                                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">M-Pesa Reference</p>
                                <p className="text-sm font-mono tracking-wide text-ink">{refundReference}</p>
                            </div>
                        )}
                        {refundRemarks && (
                            <div className="px-4 py-3">
                                <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">Remarks</p>
                                <p className="text-sm text-ink">{refundRemarks}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions — HELD only, owner/manager only */}
                {isHeld && canManage && (
                    <div className="flex flex-wrap gap-3 pt-1">
                        <button
                            onClick={() => setShowRefundModal(true)}
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark shadow-sm shadow-brand/20 transition-all duration-200"
                        >
                            <ReceiptText className="h-3.5 w-3.5" strokeWidth={2} />
                            Record Refund
                        </button>
                        <button
                            onClick={() => setPendingForfeit(true)}
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-surface text-sm font-medium text-ink-muted hover:text-ink hover:border-ink/20 transition-all duration-200"
                        >
                            <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                            Forfeit
                        </button>
                    </div>
                )}

                {/* Inline forfeit confirm */}
                {pendingForfeit && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-danger shrink-0" strokeWidth={2} />
                        <p className="flex-1 text-sm text-danger">
                            Forfeit the full deposit? This cannot be undone — the entire held amount is kept.
                        </p>
                        <button
                            onClick={handleForfeit}
                            disabled={forfeitMutation.isPending}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-danger text-white text-xs font-medium hover:bg-danger-dark disabled:opacity-50 transition-colors"
                        >
                            {forfeitMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                            Confirm Forfeit
                        </button>
                        <button
                            onClick={() => setPendingForfeit(false)}
                            disabled={forfeitMutation.isPending}
                            className="h-8 px-3 rounded-lg text-xs text-ink-muted hover:text-ink transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {forfeitMutation.error && (
                    <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                        <p className="text-xs text-danger">
                            {getProcessErrorMessage(forfeitMutation.error, "Could not forfeit the deposit. Please try again.")}
                        </p>
                    </div>
                )}
            </div>

            {showRefundModal && (
                <RefundModal
                    depositId={id}
                    amountPaid={amountPaid}
                    currency={currency}
                    leaseId={leaseId}
                    onClose={() => setShowRefundModal(false)}
                />
            )}
        </>
    );
}

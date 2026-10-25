"use client";

import { useState } from "react";
import {
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Phone,
    Clock,
    Hash,
    Building2,
    User,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useUnmatchedPaymentsQuery, useResolveUnmatchedPaymentMutation } from "../hooks/use-unmatched-payments";
import { UnmatchedPaymentResponse } from "../types/rent-ledger-response";
import { formatCurrency } from "@/shared/utils/money";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4) return "••••";
    return `•••• •••• ${digits.slice(-4)}`;
}

const CONFIDENCE_META: Record<string, { label: string; cls: string }> = {
    exact:          { label: "Exact match",         cls: "bg-success/10 text-success-dark border-success/20 dark:bg-success-bg-dark dark:text-success dark:border-success/20" },
    fuzzy:          { label: "Fuzzy match",          cls: "bg-brand/10 text-brand-700 border-brand/20 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand/20" },
    phone:          { label: "Phone match",          cls: "bg-info/10 text-info-dark border-info/20 dark:bg-info-bg-dark dark:text-info dark:border-info/20" },
    amount_timing:  { label: "Amount + time match",  cls: "bg-warning/10 text-warning-dark border-warning/20 dark:bg-warning-bg-dark dark:text-warning dark:border-warning/20" },
};

const CONFIDENCE_DEFAULT = { label: "Low confidence", cls: "bg-border-subtle text-fg-muted border-border dark:bg-border-subtle-dark dark:text-fg-muted-dark dark:border-border-dark" };

function UnmatchedPaymentCard({ payment }: { payment: UnmatchedPaymentResponse }) {
    const [expanded, setExpanded] = useState(true);
    const [resolvingUnitId, setResolvingUnitId] = useState<string | null>(null);
    const resolve = useResolveUnmatchedPaymentMutation();

    const confidence = payment.matchConfidence
        ? (CONFIDENCE_META[payment.matchConfidence] ?? CONFIDENCE_DEFAULT)
        : CONFIDENCE_DEFAULT;

    const occurredAt = new Date(payment.occurredAt).toLocaleString("en-KE", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const handleAssign = async (unitId: string) => {
        setResolvingUnitId(unitId);
        try {
            await resolve.mutateAsync({ transactionId: payment.transactionId, unitId });
            toast.success("Payment assigned — ledger entry updated");
        } catch (err) {
            toast.error(getProcessErrorMessage(err, "Couldn't assign the payment. Try again."));
            setResolvingUnitId(null);
        }
    };

    return (
        <div className="rounded-xl border border-warning/30 bg-warning/[0.04] dark:border-warning/20 dark:bg-warning/[0.03] overflow-hidden">
            {/* Card header */}
            <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-warning/[0.04] transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 dark:bg-warning-bg-dark">
                        <AlertTriangle className="h-4 w-4 text-warning-dark dark:text-warning" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-fg dark:text-fg-dark tabular-nums">
                            {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark truncate">
                            {maskPhone(payment.phoneNumber)} · {occurredAt}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {payment.matchConfidence && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${confidence.cls}`}>
                            {confidence.label}
                        </span>
                    )}
                    {expanded
                        ? <ChevronUp className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        : <ChevronDown className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    }
                </div>
            </button>

            {expanded && (
                <div className="border-t border-warning/20 dark:border-warning/15 px-4 pb-4 pt-3 space-y-3">
                    {/* Raw details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-fg-muted dark:text-fg-muted-dark">
                            <Phone className="h-3 w-3 shrink-0" strokeWidth={2} />
                            <span className="font-mono">{maskPhone(payment.phoneNumber)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-fg-muted dark:text-fg-muted-dark">
                            <Hash className="h-3 w-3 shrink-0" strokeWidth={2} />
                            <span className="font-mono truncate" title={payment.accountReference}>
                                {payment.accountReference || "—"}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-fg-muted dark:text-fg-muted-dark">
                            <Clock className="h-3 w-3 shrink-0" strokeWidth={2} />
                            <span>{occurredAt}</span>
                        </div>
                    </div>

                    {/* Suggested units */}
                    {payment.suggestedUnits.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                Suggested units
                            </p>
                            {payment.suggestedUnits.map((unit) => (
                                <div
                                    key={unit.unitId}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 dark:border-border-dark/60 bg-surface dark:bg-surface-dark px-3 py-2.5"
                                >
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-1 text-xs font-semibold text-fg dark:text-fg-dark">
                                                <Building2 className="h-3 w-3 text-brand dark:text-brand-300 shrink-0" strokeWidth={2} />
                                                Unit {unit.unitNumber}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-fg-muted dark:text-fg-muted-dark">
                                                <User className="h-3 w-3 shrink-0" strokeWidth={2} />
                                                {unit.tenantName}
                                            </span>
                                            <span className="text-xs font-mono font-semibold text-fg dark:text-fg-dark">
                                                {formatCurrency(unit.rentAmount)}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark truncate">
                                            {unit.matchReason}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAssign(unit.unitId)}
                                        disabled={resolve.isPending}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
                                    >
                                        {resolvingUnitId === unit.unitId && resolve.isPending ? (
                                            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                                        ) : (
                                            <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                                        )}
                                        Assign to Unit {unit.unitNumber}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark italic">
                            No automatic suggestions — check the account reference manually and assign via the rent ledger.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export function UnmatchedPaymentsPanel() {
    const { data: payments, isLoading, isError, refetch } = useUnmatchedPaymentsQuery();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 dark:border-border-dark/60 bg-surface dark:bg-surface-dark px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" strokeWidth={2} />
                Checking for unmatched payments…
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-danger/20 dark:border-danger/15 bg-danger/[0.04] dark:bg-danger-bg-dark/40 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-danger-dark dark:text-danger">
                    <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    Couldn&apos;t check for unmatched payments.
                </div>
                <button onClick={() => refetch()} className="text-xs font-semibold text-brand dark:text-brand-300 hover:underline shrink-0">
                    Retry
                </button>
            </div>
        );
    }

    if (!payments || payments.length === 0) return null;

    return (
        <div className="rounded-2xl border border-warning/40 dark:border-warning/25 bg-warning/[0.03] dark:bg-warning/[0.02] shadow-sm overflow-hidden animate-fade-in-up">
            {/* Panel header */}
            <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-warning/20 dark:border-warning/15">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 dark:bg-warning-bg-dark">
                    <AlertTriangle className="h-4.5 w-4.5 text-warning-dark dark:text-warning" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-fg dark:text-fg-dark">
                            Unmatched payments — need your attention
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning/15 dark:bg-warning-bg-dark border border-warning/25 text-[10px] font-bold text-warning-dark dark:text-warning">
                            {payments.length} {payments.length === 1 ? "payment" : "payments"}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                        These M-Pesa transfers landed but couldn&apos;t be matched automatically.
                        Assign each one to the unit it belongs to.
                    </p>
                </div>
            </div>

            {/* Cards */}
            <div className="p-4 space-y-3">
                {payments.map((p) => (
                    <UnmatchedPaymentCard key={p.id} payment={p} />
                ))}
            </div>
        </div>
    );
}

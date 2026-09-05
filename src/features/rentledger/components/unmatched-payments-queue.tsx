// components/unmatched-payments-queue.tsx
import { useUnmatchedPaymentsQuery } from "../hooks/use-unmatched-payments";
import { useResolveUnmatchedPaymentMutation } from "../hooks/use-unmatched-payments";
import { UnmatchedPaymentResponse } from "../types/rent-ledger-response";
import { ChevronDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/shared/utils/money";

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const maskPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.slice(-4).padStart(cleaned.length, "•");
};

const confidenceLabel = (conf: string | null) => {
    const labels: Record<string, { label: string; class: string }> = {
        exact: { label: "Exact match", class: "badge-emerald" },
        fuzzy: { label: "Fuzzy match", class: "badge-warning" },
        phone: { label: "Phone match", class: "badge-info" },
        amount_timing: { label: "Amount + timing", class: "badge-brand" },
    };
    return labels[conf ?? ""] ?? { label: "No match", class: "badge-neutral" };
};

interface UnmatchedPaymentRowProps {
    payment: UnmatchedPaymentResponse;
    onResolve: (transactionId: string, unitId: string) => void;
    isResolving: boolean;
    resolvingId: string | null;
}

const UnmatchedPaymentRow = ({ payment, onResolve, isResolving, resolvingId }: UnmatchedPaymentRowProps) => {
    const [expanded, setExpanded] = useState(false);
    const conf = confidenceLabel(payment.matchConfidence);

    return (
        <div className="card-sm border-l-4 border-warning/30">
            <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-mono-nums font-semibold text-fg dark:text-fg-dark">{formatCurrency(payment.amount)}</p>
                        <span className={`${conf.class} !text-[10px] !px-2 !py-0.5`}>{conf.label}</span>
                        <span className="badge badge-neutral !text-[10px] !px-2 !py-0.5">
                            {payment.suggestedUnits.length > 0 ? `${payment.suggestedUnits.length} suggestion${payment.suggestedUnits.length > 1 ? "s" : ""}` : "No suggestions"}
                        </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-fg-muted dark:text-fg-muted-dark">
                        <span className="font-mono">{payment.accountReference || "—"}</span>
                        <span>·</span>
                        <span>Phone: {maskPhone(payment.phoneNumber)}</span>
                        <span>·</span>
                        <span>{formatDateTime(payment.occurredAt)}</span>
                    </div>

                    {expanded && payment.suggestedUnits.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border dark:border-border-dark">
                            <p className="text-xs font-medium text-fg-muted dark:text-fg-muted-dark mb-2">Suggested matches</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {payment.suggestedUnits.map((unit, idx) => (
                                    <button
                                        key={`${payment.id}-${idx}`}
                                        onClick={() => onResolve(payment.transactionId, unit.unitId)}
                                        disabled={isResolving && resolvingId === payment.transactionId}
                                        className="text-left p-3 rounded-xl bg-surface border border-border/60 hover:border-brand-300/50 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all text-sm"
                                    >
                                        <p className="font-medium text-fg dark:text-fg-dark">{unit.unitNumber}</p>
                                        <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">{unit.tenantName}</p>
                                        <p className="font-mono-nums text-[11px] text-brand dark:text-brand-300">{formatCurrency(unit.rentAmount)}/mo</p>
                                        <p className="text-[10px] text-fg-muted dark:text-fg-muted-dark mt-1">{unit.matchReason}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-border/30 transition-colors"
                        aria-label={expanded ? "Collapse" : "Expand"}
                    >
                        <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`} strokeWidth={2} />
                    </button>
                    {isResolving && resolvingId === payment.transactionId && (
                        <Loader2 className="h-5 w-5 animate-spin text-brand" strokeWidth={2} />
                    )}
                </div>
            </div>
        </div>
    );
};

const UnmatchedPaymentsQueue = () => {
    const { data: payments, isLoading, isError, refetch } = useUnmatchedPaymentsQuery();
    const resolveMutation = useResolveUnmatchedPaymentMutation();

    const unmatchedCount = payments?.length ?? 0;

    const handleResolve = (transactionId: string, unitId: string) => {
        resolveMutation.mutate({ transactionId, unitId });
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[0, 1].map((i) => (
                    <div key={i} className="skeleton h-20 w-full" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="card-sm p-4">
                <div className="flex items-center gap-2 text-sm text-danger">
                    <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    Failed to load unmatched payments
                </div>
                <button
                    onClick={() => refetch()}
                    className="mt-2 btn-secondary btn-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="card-elevated">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning-dark dark:text-warning" strokeWidth={2} />
                    <h3 className="section-header !text-sm !mb-0">Unmatched Payments</h3>
                    {unmatchedCount > 0 && (
                        <span className="badge badge-warning !text-[10px]">{unmatchedCount} pending</span>
                    )}
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={resolveMutation.isPending}
                    className="btn-ghost btn-sm"
                    aria-label="Refresh unmatched payments"
                >
                    <Loader2 className={`h-4 w-4 ${resolveMutation.isPending ? "animate-spin" : ""}`} strokeWidth={2} />
                </button>
            </div>

            {unmatchedCount === 0 ? (
                <div className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-success-dark dark:text-success mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">All payments matched</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                        Every M-Pesa payment was automatically reconciled to a tenant and unit.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border dark:divide-border-dark p-4">
                    {payments?.map((payment) => (
                        <UnmatchedPaymentRow
                            key={payment.id}
                            payment={payment}
                            onResolve={handleResolve}
                            isResolving={resolveMutation.isPending}
                            resolvingId={resolveMutation.variables?.transactionId ?? null}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export { UnmatchedPaymentsQueue };
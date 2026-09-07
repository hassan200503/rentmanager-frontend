import { useRentLedgerTransactionsQuery } from "../hooks/use-rent-ledger-transactions-query";
import { RentTransactionType, RentTransactionSource } from "../types/rent-ledger-response";
import { formatCurrencyPrecise } from "@/shared/utils/money";
import {
    CircleDollarSign, CreditCard, ArrowLeftRight, Landmark,
    Smartphone, Banknote, RefreshCw, Timer, AlertTriangle,
} from "lucide-react";

interface RentLedgerTransactionsProps {
    entryId: string;
}

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

const TYPE_META: Record<RentTransactionType, {
    label: string;
    icon: typeof CircleDollarSign;
    amountColor: string;
    amountPrefix: string;
}> = {
    RENT_CHARGE: { label: "Rent charge", icon: CircleDollarSign, amountColor: "text-danger-dark dark:text-danger", amountPrefix: "−" },
    PAYMENT:     { label: "Payment",     icon: CreditCard,        amountColor: "text-success-dark dark:text-success", amountPrefix: "+" },
    WAIVER:      { label: "Waiver",      icon: ArrowLeftRight,    amountColor: "text-success-dark dark:text-success", amountPrefix: "+" },
    REFUND:      { label: "Refund",      icon: ArrowLeftRight,    amountColor: "text-warning-dark dark:text-warning", amountPrefix: "+" },
    CREDIT_APPLIED: { label: "Credit applied", icon: CircleDollarSign, amountColor: "text-success-dark dark:text-success", amountPrefix: "+" },
    DEPOSIT:     { label: "Deposit",     icon: Landmark,          amountColor: "text-success-dark dark:text-success", amountPrefix: "+" },
    ADJUSTMENT:  { label: "Adjustment",  icon: ArrowLeftRight,    amountColor: "text-fg dark:text-fg-dark", amountPrefix: "" },
    // REVERSAL direction cannot be derived from this row alone — it voids
    // whatever it reversed, so it moves the balance either way depending on
    // the voided type. Render neutral and unsigned.
    REVERSAL:    { label: "Reversal",    icon: ArrowLeftRight,    amountColor: "text-fg dark:text-fg-dark", amountPrefix: "" },
};

const SOURCE_META: Record<RentTransactionSource, { label: string; icon: typeof Smartphone }> = {
    MPESA:            { label: "M-Pesa",  icon: Smartphone },
    CASH:             { label: "Cash",    icon: Banknote },
    ADMIN_ADJUSTMENT: { label: "Manual",  icon: RefreshCw },
    SYSTEM:           { label: "System",  icon: Timer },
};

export const RentLedgerTransactions = ({ entryId }: RentLedgerTransactionsProps) => {
    const { data: transactions, isLoading, isError } = useRentLedgerTransactionsQuery(entryId);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-16 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/[0.04] px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-danger shrink-0" strokeWidth={1.75} />
                <p className="text-sm text-danger">Failed to load transactions.</p>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="rounded-xl border border-border/60 bg-ink/[0.02] px-4 py-6 text-center">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">No transactions recorded for this entry yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {transactions.map((tx) => {
                const meta = TYPE_META[tx.type] ?? TYPE_META.ADJUSTMENT;
                const srcMeta = SOURCE_META[tx.source] ?? SOURCE_META.SYSTEM;
                const TypeIcon = meta.icon;
                const SrcIcon = srcMeta.icon;

                return (
                    <div
                        key={tx.id}
                        className="rounded-xl border border-border/50 bg-surface hover:border-border transition-colors duration-150 px-3.5 py-3"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/[0.04]">
                                    <TypeIcon className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.75} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark leading-snug">{meta.label}</p>
                                    <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark mt-0.5">
                                        {formatDateTime(tx.occurredAt)}
                                    </p>
                                </div>
                            </div>
                            <p className={`text-sm font-bold tabular-nums shrink-0 ${meta.amountColor}`}>
                                {meta.amountPrefix}{formatCurrencyPrecise(tx.amount)}
                            </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[38px]">
                            <span className="inline-flex items-center gap-1 text-[10px] text-fg-muted/60">
                                <SrcIcon className="h-3 w-3" strokeWidth={1.5} />
                                {srcMeta.label}
                            </span>
                            {tx.externalReference && (
                                <span className="text-[10px] font-mono text-fg-muted/50">{tx.externalReference}</span>
                            )}
                            {tx.recordedBy && (
                                <span className="text-[10px] text-fg-muted/50 truncate max-w-[140px]">{tx.recordedBy}</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

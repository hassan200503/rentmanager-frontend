import { RentLedgerEntryResponse } from "../types/rent-ledger-response";
import { RentLedgerStatusBadge } from "./rent-ledger-status-badge";
import { ChevronRight } from "lucide-react";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

interface RentLedgerEntryRowProps {
    entry: RentLedgerEntryResponse;
    onSelect?: (entryId: string) => void;
}

export const RentLedgerEntryRow = ({ entry, onSelect }: RentLedgerEntryRowProps) => {
    return (
        <button
            type="button"
            onClick={() => onSelect?.(entry.id)}
            className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-xl bg-surface border border-border/60 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-200/50 hover:bg-gradient-to-r hover:from-brand-50/20 hover:to-transparent cursor-pointer group"
        >
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                    {formatDate(entry.billingPeriodStart)} – {formatDate(entry.billingPeriodEnd)}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                    Due {formatDate(entry.dueDate)}
                </p>
            </div>

            <div className="text-right shrink-0">
                <p className="font-mono-nums text-sm font-semibold text-ink">{formatCurrency(entry.balanceOwed)}</p>
                <p className="text-[11px] text-ink-muted">of {formatCurrency(entry.amountDue)}</p>
            </div>

            <RentLedgerStatusBadge status={entry.status} />

            <div className="w-6 h-6 rounded-lg bg-border/30 flex items-center justify-center group-hover:bg-brand-100/50 transition-colors">
                <ChevronRight className="h-3.5 w-3.5 text-ink-muted/40 group-hover:text-brand-600 transition-colors" strokeWidth={2} />
            </div>
        </button>
    );
};
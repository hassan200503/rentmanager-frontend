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
            className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg transition-colors hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 cursor-pointer group"
        >
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg dark:text-fg-dark">
                    {formatDate(entry.billingPeriodStart)} – {formatDate(entry.billingPeriodEnd)}
                </p>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                    Due {formatDate(entry.dueDate)}
                </p>
            </div>

            <div className="text-right shrink-0">
                <p className="font-mono-nums text-sm font-semibold text-fg dark:text-fg-dark">{formatCurrency(entry.balanceOwed)}</p>
                <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">of {formatCurrency(entry.amountDue)}</p>
            </div>

            <RentLedgerStatusBadge status={entry.status} />

            <ChevronRight className="h-4 w-4 text-fg-muted/30 dark:text-fg-muted-dark/30 group-hover:text-fg-muted dark:group-hover:text-fg-muted-dark transition-colors shrink-0" strokeWidth={2} />
        </button>
    );
};
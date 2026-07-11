// features/rent-ledger/components/rent-ledger-entry-row.tsx
import { RentLedgerEntryResponse } from "../types/rent-ledger-response";
import { RentLedgerStatusBadge } from "./rent-ledger-status-badge";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

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
            className="card-sm w-full text-left flex items-center justify-between gap-4"
        >
            <div>
                <p className="font-medium text-ink">
                    {formatDate(entry.billingPeriodStart)} – {formatDate(entry.billingPeriodEnd)}
                </p>
                <p className="text-sm text-ink-muted">Due {formatDate(entry.dueDate)}</p>
            </div>

            <div className="text-right">
                <p className="font-data font-medium text-ink">{formatCurrency(entry.balanceOwed)}</p>
                <p className="text-xs text-ink-muted">of {formatCurrency(entry.amountDue)}</p>
            </div>

            <RentLedgerStatusBadge status={entry.status} />
        </button>
    );
};
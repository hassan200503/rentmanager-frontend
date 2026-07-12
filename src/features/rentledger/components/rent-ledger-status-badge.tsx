// components/rent-ledger-status-badge.tsx
import { RentLedgerStatus } from "../types/rent-ledger-response";

// RESOLVED (this session): OVERPAID previously shared pill-warning with
// PARTIALLY_PAID, distinguished only by label text. Now uses the new
// pill-info treatment (see globals.css) since OVERPAID is a distinct kind
// of state -- a landlord-side action item (apply credit/refund), not a
// shade of "needs tenant attention" (warning) or "settled" (success).
const statusPillMap: Record<RentLedgerStatus, string> = {
    DUE: "pill pill-neutral",
    PARTIALLY_PAID: "pill pill-warning",
    OVERDUE: "pill pill-danger",
    PAID: "pill pill-success",
    OVERPAID: "pill pill-info",
};

export const RentLedgerStatusBadge = ({
                                          status,
                                      }: {
    status: RentLedgerStatus;
}) => {
    return (
        <span className={statusPillMap[status] ?? "pill pill-neutral"}>
            {status.replaceAll("_", " ")}
        </span>
    );
};
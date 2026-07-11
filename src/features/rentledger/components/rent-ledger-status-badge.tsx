// components/rent-ledger-status-badge.tsx
import { RentLedgerStatus } from "../types/rent-ledger-response";

// ASSUMPTION FLAGGED: RentLedgerStatus has 5 values but the design system
// only defines 4 non-default pill variants (success/warning/danger/neutral) —
// same gap as PropertyStatusBadge. OVERPAID and PARTIALLY_PAID both map to
// pill-warning below and will look visually identical, distinguished only by
// label text. Confirm whether OVERPAID needs its own treatment before shipping.
const statusPillMap: Record<RentLedgerStatus, string> = {
    DUE: "pill pill-neutral",
    PARTIALLY_PAID: "pill pill-warning",
    OVERDUE: "pill pill-danger",
    PAID: "pill pill-success",
    OVERPAID: "pill pill-warning",
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
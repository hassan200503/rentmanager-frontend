import { RentLedgerStatus } from "../types/rent-ledger-response";

const statusPillMap: Record<RentLedgerStatus, string> = {
    DUE: "pill-neutral",
    PARTIALLY_PAID: "pill-warning",
    OVERDUE: "pill-danger",
    PAID: "pill-success",
    OVERPAID: "pill-info",
};

export const RentLedgerStatusBadge = ({ status }: { status: RentLedgerStatus }) => {
    return (
        <span className={statusPillMap[status] ?? "pill-neutral"}>
            {status.replaceAll("_", " ")}
        </span>
    );
};
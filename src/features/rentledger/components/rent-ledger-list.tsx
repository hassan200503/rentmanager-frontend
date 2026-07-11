// features/rent-ledger/components/rent-ledger-list.tsx
import { useRentLedgerByLeaseQuery } from "../hooks/use-rent-ledger-by-lease-query";
import { RentLedgerEntryRow } from "./rent-ledger-entry-row";

interface RentLedgerListProps {
    leaseId: string;
    onSelectEntry?: (entryId: string) => void;
}

export const RentLedgerList = ({ leaseId, onSelectEntry }: RentLedgerListProps) => {
    const { data: entries, isLoading, isError } = useRentLedgerByLeaseQuery(leaseId);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
        );
    }

    if (isError) {
        return <div className="card-sm text-sm text-danger">Failed to load ledger entries for this lease.</div>;
    }

    if (!entries || entries.length === 0) {
        return <div className="card-sm text-sm text-ink-muted">No ledger entries yet for this lease.</div>;
    }

    return (
        <div className="space-y-2">
            {entries.map((entry) => (
                <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={onSelectEntry} />
            ))}
        </div>
    );
};
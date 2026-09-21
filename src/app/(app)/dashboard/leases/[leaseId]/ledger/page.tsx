// app/dashboard/leases/[leaseId]/ledger/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {RentLedgerTransactions} from "@/features/rentledger/components/rent-ledger-transactions";
import {RentLedgerList} from "@/features/rentledger/components/rent-ledger-list";


export default function LeaseLedgerPage() {
    const { leaseId } = useParams<{ leaseId: string }>();
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    return (
        <div className="page-container">
            <h1 className="page-title">Rent Ledger</h1>
            <p className="page-subtitle">Billing periods and payment history for this lease.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section>
                    <h2 className="section-header">Ledger Entries</h2>
                    <RentLedgerList leaseId={leaseId} onSelectEntry={setSelectedEntryId} />
                </section>

                <section>
                    <h2 className="section-header">Transactions</h2>
                    {selectedEntryId ? (
                        <RentLedgerTransactions entryId={selectedEntryId} />
                    ) : (
                        <div className="card-sm text-sm text-ink-muted">
                            Select a ledger entry to view its transactions.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
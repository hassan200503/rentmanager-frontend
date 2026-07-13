// src/features/lease/components/lease-attention-panel.tsx
"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, CalendarClock, ClipboardList, ChevronRight, Sparkles } from "lucide-react";
import { LeaseSummaryResponse } from "@/features/lease/types/lease-response";
import { daysUntil, isExpiringSoon, needsAction } from "@/features/lease/utils/lease-date-utils";

type AttentionReason = "expiring" | "action";

interface AttentionItem {
    lease: LeaseSummaryResponse;
    reason: AttentionReason;
    detail: string;
}

const buildAttentionItems = (leases: LeaseSummaryResponse[]): AttentionItem[] => {
    const items: AttentionItem[] = [];

    for (const lease of leases) {
        if (isExpiringSoon(lease.status, lease.endDate, 30)) {
            const remaining = daysUntil(lease.endDate);
            items.push({
                lease,
                reason: "expiring",
                detail: remaining <= 0
                    ? "Expires today"
                    : remaining === 1
                        ? "Expires tomorrow"
                        : `Expires in ${remaining} days`,
            });
        } else if (needsAction(lease.status) && lease.status !== "PENDING_ACTIVATION") {
            // PENDING_ACTIVATION transitions to ACTIVE automatically once the
            // move date arrives — there's no landlord action to take, so it
            // doesn't belong in a "needs attention" list.
            items.push({
                lease,
                reason: "action",
                detail: statusToActionCopy(lease.status),
            });
        }
    }

    return items
        .sort((a, b) => {
            if (a.reason !== b.reason) return a.reason === "expiring" ? -1 : 1;
            return daysUntil(a.lease.endDate) - daysUntil(b.lease.endDate);
        })
        .slice(0, 6);
};

function statusToActionCopy(status: LeaseSummaryResponse["status"]): string {
    switch (status) {
        case "DRAFT": return "Draft needs review";
        case "PENDING_APPROVAL": return "Awaiting approval";
        case "AWAITING_DEPOSIT": return "Deposit not yet received";
        default: return "Needs attention";
    }
}

export function LeaseAttentionPanel({ leases }: { leases: LeaseSummaryResponse[] }) {
    const router = useRouter();
    const items = buildAttentionItems(leases);

    return (
        <div className="card-sm lg:sticky lg:top-4 h-fit">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-ink-muted">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                Needs attention
            </div>

            {items.length === 0 ? (
                <div className="py-6 text-center">
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-light">
                        <ClipboardList className="h-4 w-4 text-primary-dark" strokeWidth={2} />
                    </div>
                    <p className="text-xs text-ink-muted">Nothing on this page needs action right now.</p>
                </div>
            ) : (
                <ul className="space-y-1">
                    {items.map((item) => (
                        <li key={item.lease.id}>
                            <button
                                onClick={() => router.push(`/dashboard/leases/${item.lease.id}`)}
                                className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-ink/[0.03] transition-colors group"
                            >
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                    item.reason === "expiring" ? "bg-warning/10" : "bg-primary-light"
                                }`}>
                                    {item.reason === "expiring" ? (
                                        <CalendarClock className="h-3.5 w-3.5 text-warning-dark" strokeWidth={2} />
                                    ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-primary-dark" strokeWidth={2} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-ink truncate">{item.lease.leaseNumber}</p>
                                    <p className="text-[11px] text-ink-muted truncate">{item.detail}</p>
                                </div>
                                <ChevronRight
                                    className="h-3.5 w-3.5 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    strokeWidth={2}
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-3 pt-3 border-t border-ink/[0.06] text-[11px] text-ink-muted">
                Based on leases loaded on this page. Renewals inside 30 days and drafts awaiting action surface first.
            </p>
        </div>
    );
}
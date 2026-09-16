"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, CalendarClock, ChevronRight, Sparkles } from "lucide-react";
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
            items.push({
                lease,
                reason: "action",
                detail: statusToActionCopy(lease.status),
            });
        }
    }

    return items.sort((a, b) => {
        if (a.reason !== b.reason) return a.reason === "expiring" ? -1 : 1;
        return daysUntil(a.lease.endDate) - daysUntil(b.lease.endDate);
    });
};

function statusToActionCopy(status: LeaseSummaryResponse["status"]): string {
    switch (status) {
        case "DRAFT": return "Draft needs review";
        case "PENDING_APPROVAL": return "Awaiting approval";
        case "AWAITING_DEPOSIT": return "Deposit not yet received";
        default: return "Needs attention";
    }
}

/**
 * A horizontal strip, not a sidebar — a fixed-width side column previously
 * squeezed the tenants table into scrolling sideways to fit its own columns
 * (Property/Unit, Rent status, etc. added later). This scrolls internally
 * only if there are many items, and takes zero vertical space when there's
 * nothing to flag, rather than permanently reserving a column for an
 * "all caught up" message.
 */
export function LeaseAttentionPanel({ leases }: { leases: LeaseSummaryResponse[] }) {
    const router = useRouter();
    const items = buildAttentionItems(leases);

    if (items.length === 0) return null;

    return (
        <div className="card-sm animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                    Needs attention
                </div>
                <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                    Leases loaded on this page
                </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 -mb-1">
                {items.map((item) => (
                    <button
                        key={item.lease.id}
                        onClick={() => router.push(`/dashboard/leases/${item.lease.id}`)}
                        className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border dark:border-border-dark px-3 py-2 text-left hover:border-brand-300 dark:hover:border-brand-700 hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors group max-w-[240px]"
                    >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            item.reason === "expiring" ? "bg-warning-bg dark:bg-warning-bg-dark" : "bg-brand-50 dark:bg-brand-800"
                        }`}>
                            {item.reason === "expiring" ? (
                                <CalendarClock className="h-3.5 w-3.5 text-warning-dark dark:text-warning" strokeWidth={2} />
                            ) : (
                                <AlertCircle className="h-3.5 w-3.5 text-brand dark:text-brand-300" strokeWidth={2} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-fg dark:text-fg-dark truncate">
                                {item.lease.tenantFullName || item.lease.leaseNumber}
                            </p>
                            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark truncate">{item.detail}</p>
                        </div>
                        <ChevronRight
                            className="h-3.5 w-3.5 text-fg-muted dark:text-fg-muted-dark opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            strokeWidth={2}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

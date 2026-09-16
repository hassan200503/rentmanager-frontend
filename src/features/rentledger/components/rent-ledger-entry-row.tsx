"use client";

import { RentLedgerEntryResponse } from "../types/rent-ledger-response";
import { RentLedgerStatusBadge } from "./rent-ledger-status-badge";
import { ChevronRight, DoorOpen, Calendar } from "lucide-react";
import { formatCurrency, toMoneyNumber } from "@/shared/utils/money";

const fmtShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric" });

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });

function daysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86_400_000));
}

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENTS = [
    "from-brand-400 to-brand-600",
    "from-violet-400 to-violet-600",
    "from-amber-400 to-amber-600",
    "from-emerald-400 to-emerald-600",
    "from-rose-400 to-rose-600",
    "from-sky-400 to-sky-600",
];

function getAvatarGradient(name: string | null): string {
    if (!name) return AVATAR_GRADIENTS[0];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

interface RentLedgerEntryRowProps {
    entry: RentLedgerEntryResponse;
    onSelect?: (entryId: string) => void;
    selected?: boolean;
}

export const RentLedgerEntryRow = ({ entry, onSelect, selected }: RentLedgerEntryRowProps) => {
    const isOverdue = entry.status === "OVERDUE";
    const isOverpaid = entry.status === "OVERPAID";
    const overdueDays = isOverdue ? daysOverdue(entry.dueDate) : 0;
    const amountDueNum = toMoneyNumber(entry.amountDue);
    const amountPaidNum = toMoneyNumber(entry.amountPaid);
    const paidPercent = amountDueNum > 0
        ? Math.min(100, Math.round((amountPaidNum / amountDueNum) * 100))
        : 0;

    return (
        <button
            type="button"
            onClick={() => onSelect?.(entry.id)}
            className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-all duration-150 group ${
                selected
                    ? "bg-brand-50/60 dark:bg-brand/[0.08] border-l-2 border-brand"
                    : "hover:bg-ink/[0.02] dark:hover:bg-white/[0.02] border-l-2 border-transparent"
            }`}
        >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarGradient(entry.tenantFullName)} flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/20 mt-0.5`}>
                <span className="text-xs font-bold text-white leading-none">
                    {getInitials(entry.tenantFullName)}
                </span>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
                {/* Name + status */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink dark:text-white leading-snug truncate max-w-[200px]">
                        {entry.tenantFullName ?? "Unknown tenant"}
                    </span>
                    <RentLedgerStatusBadge status={entry.status} />
                    {isOverdue && overdueDays > 0 && (
                        <span className="text-[10px] font-bold text-danger bg-danger/[0.08] border border-danger/20 px-1.5 py-0.5 rounded-full">
                            {overdueDays}d overdue
                        </span>
                    )}
                </div>

                {/* Unit + property */}
                {(entry.unitNumber || entry.propertyName) && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <DoorOpen className="h-3 w-3 text-ink-muted/40 shrink-0" strokeWidth={1.5} />
                        {entry.unitNumber && (
                            <span className="text-[11px] font-mono font-semibold text-ink-muted/70">
                                Unit {entry.unitNumber}
                            </span>
                        )}
                        {entry.propertyName && (
                            <span className="text-[11px] text-ink-muted/50">· {entry.propertyName}</span>
                        )}
                    </div>
                )}

                {/* Period */}
                <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 text-ink-muted/30 shrink-0" strokeWidth={1.5} />
                    <span className="text-[11px] text-ink-muted/50">
                        {fmtShortDate(entry.billingPeriodStart)}–{fmtShortDate(entry.billingPeriodEnd)}
                        <span className="mx-1 text-ink-muted/20">·</span>
                        due {fmtDate(entry.dueDate)}
                    </span>
                </div>

                {/* Progress bar */}
                {!isOverpaid && amountDueNum > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-ink/[0.06] overflow-hidden">
                            <div
                                className={`h-full rounded-full ${
                                    isOverdue ? "bg-danger" : paidPercent >= 100 ? "bg-success" : "bg-brand"
                                }`}
                                style={{ width: `${paidPercent}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-ink-muted/40 shrink-0 tabular-nums">
                            {paidPercent}%
                        </span>
                    </div>
                )}
            </div>

            {/* Amount + chevron */}
            <div className="flex items-center gap-2 shrink-0 ml-1">
                <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums leading-tight ${
                        isOverdue ? "text-danger" : isOverpaid ? "text-warning-dark dark:text-warning" : "text-ink dark:text-white"
                    }`}>
                        {formatCurrency(isOverpaid ? entry.excessAmount : entry.balanceOwed)}
                    </p>
                    <p className="text-[10px] text-ink-muted/50 mt-0.5 tabular-nums">
                        {isOverpaid ? "excess · " : "of "}{formatCurrency(entry.amountDue)}
                    </p>
                </div>
                <ChevronRight className={`h-4 w-4 transition-colors shrink-0 ${
                    selected ? "text-brand" : "text-ink-muted/20 group-hover:text-ink-muted/40"
                }`} strokeWidth={2} />
            </div>
        </button>
    );
};

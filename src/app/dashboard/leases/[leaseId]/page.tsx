// src/app/dashboard/leases/[leaseId]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronDown,
    AlertTriangle,
    Info,
    Wallet,
    ShieldCheck,
    CalendarDays,
    CalendarClock,
    History,
    FileQuestion,
    Copy,
    Check,
    Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { useLease } from "@/features/lease/hooks/use-lease";
import { useLeaseAction } from "@/features/lease/hooks/use-lease-action";
import { LeaseStatusBadge } from "@/features/lease/components/lease-status-badge";
import { LeaseActionType, TerminationType } from "@/features/lease/types/lease-request";
import { daysUntil, isExpiringSoon } from "@/features/lease/utils/lease-date-utils";
import {RentLedgerList} from "@/features/rentledger/components/rent-ledger-list";
import { formatCurrency } from "@/shared/utils/money";

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

const formatDateTime = (isoDateTime: string) =>
    new Date(isoDateTime).toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const TERMINATION_TYPE_LABELS: Record<TerminationType, string> = {
    TENANT_REQUEST: "Tenant Request",
    LANDLORD_REQUEST: "Landlord Request",
    BREACH_OF_CONTRACT: "Breach of Contract",
    NON_PAYMENT: "Non-Payment",
    MUTUAL_AGREEMENT: "Mutual Agreement",
};

const DESTRUCTIVE_ACTIONS: LeaseActionType[] = ["TERMINATE", "REJECT", "CANCEL", "EXPIRE"];

const ACTIONS_BY_STATUS: Partial<Record<string, { action: LeaseActionType; label: string; needsReason?: boolean; needsTermination?: boolean }[]>> = {
    DRAFT: [
        { action: "APPROVE", label: "Approve" },
        { action: "REJECT", label: "Reject", needsReason: true },
    ],
    PENDING_APPROVAL: [
        { action: "AWAITING_DEPOSIT", label: "Mark Awaiting Deposit" },
        { action: "REJECT", label: "Reject", needsReason: true },
    ],
    AWAITING_DEPOSIT: [
        { action: "ACTIVATE", label: "Activate" },
        { action: "CANCEL", label: "Cancel", needsReason: true },
    ],
    PENDING_ACTIVATION: [
        { action: "CANCEL", label: "Cancel", needsReason: true },
    ],
    ACTIVE: [
        { action: "TERMINATE", label: "Terminate", needsReason: true, needsTermination: true },
        { action: "RENEW", label: "Renew" },
        { action: "EXPIRE", label: "Expire" },
    ],
    RENEWED: [
        { action: "TERMINATE", label: "Terminate", needsReason: true, needsTermination: true },
        { action: "RENEW", label: "Renew" },
        { action: "EXPIRE", label: "Expire" },
    ],
    EXPIRED: [
        { action: "RENEW", label: "Renew" },
    ],
};

export default function LeaseDetailPage() {
    const { leaseId } = useParams<{ leaseId: string }>();
    const router = useRouter();
    const { user, isOwner, isManager } = useCurrentUser();

    const { data: lease, isLoading } = useLease(leaseId);
    const { performAction, isLoading: isActing } = useLeaseAction();

    const [reason, setReason] = useState("");
    const [terminationType, setTerminationType] = useState<TerminationType>("TENANT_REQUEST");
    const [showHistory, setShowHistory] = useState(false);
    const [submittingAction, setSubmittingAction] = useState<LeaseActionType | null>(null);
    const [copied, setCopied] = useState(false);
    const [pendingDestructive, setPendingDestructive] = useState<{ action: LeaseActionType; needsReason?: boolean; needsTermination?: boolean; label: string } | null>(null);

    if (isLoading) {
        return (
            <div className="page-container space-y-6">
                <div className="skeleton h-4 w-20 mb-4" />
                <div className="skeleton h-24 w-full rounded-2xl mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton h-28 rounded-xl" />
                    ))}
                </div>
                <div className="skeleton h-48 rounded-2xl" />
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="page-container">
                <div className="bg-surface rounded-2xl border border-border/60 shadow-sm text-center max-w-md mx-auto mt-12 p-6">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.05]">
                        <FileQuestion className="h-6 w-6 text-ink-muted" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-ink mb-1">Lease not found</p>
                    <p className="text-xs text-ink-muted mb-5">
                        It may have been removed, or the link is out of date.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard/leases")}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark shadow-sm shadow-brand/20 transition-all duration-200"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                        Back to tenants
                    </button>
                </div>
            </div>
        );
    }

    const expiringSoon = isExpiringSoon(lease.status, lease.endDate, 30);
    const daysLeft = daysUntil(lease.endDate);

    const canManageLease = isOwner || isManager;
    const statusActions = ACTIONS_BY_STATUS[lease.status] ?? [];
    const visibleStatusActions = statusActions.filter(
        (a) => a.action !== "EXPIRE" || daysLeft <= 0
    );
    const availableActions = canManageLease ? visibleStatusActions : [];
    const showStaffReadOnlyNotice = !canManageLease && visibleStatusActions.length > 0;

    const orderedActions = [...availableActions].sort(
        (a, b) => Number(DESTRUCTIVE_ACTIONS.includes(a.action)) - Number(DESTRUCTIVE_ACTIONS.includes(b.action))
    );

    const timelineEntries: { label: string; value: string }[] = [
        lease.signedAt && { label: "Signed", value: formatDateTime(lease.signedAt) },
        lease.activatedAt && { label: "Activated", value: formatDateTime(lease.activatedAt) },
        lease.renewedAt && { label: "Renewed", value: formatDateTime(lease.renewedAt) },
        lease.expiredAt && { label: "Expired", value: formatDateTime(lease.expiredAt) },
        lease.terminatedAt && { label: "Terminated", value: formatDateTime(lease.terminatedAt) },
        lease.cancelledAt && { label: "Cancelled", value: formatDateTime(lease.cancelledAt) },
    ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

    const statusNotice =
        lease.status === "CANCELLED" && lease.cancelledAt
            ? {
                tone: "closed" as const,
                title: "Lease Cancelled",
                date: formatDateTime(lease.cancelledAt),
                detail: lease.terminationReason,
            }
            : lease.status === "TERMINATED" && lease.terminatedAt
                ? {
                    tone: "closed" as const,
                    title: "Lease Terminated",
                    date: formatDateTime(lease.terminatedAt),
                    detail: lease.terminationType
                        ? `${TERMINATION_TYPE_LABELS[lease.terminationType]}${lease.terminationReason ? `: ${lease.terminationReason}` : ""}`
                        : lease.terminationReason,
                }
                : lease.status === "EXPIRED" && lease.expiredAt
                    ? {
                        tone: "info" as const,
                        title: "Lease Expired",
                        date: formatDateTime(lease.expiredAt),
                        detail: undefined,
                    }
                    : lease.status === "RENEWED" && lease.renewedAt
                        ? {
                            tone: "info" as const,
                            title: "Lease Renewed",
                            date: formatDateTime(lease.renewedAt),
                            detail: undefined,
                        }
                        : lease.status === "SUSPENDED"
                            ? {
                                tone: "closed" as const,
                                title: "Lease Suspended",
                                date: null,
                                detail: "Rent charges are paused while this lease is suspended.",
                            }
                            : lease.status === "DRAFT"
                                ? {
                                    tone: "info" as const,
                                    title: "Draft",
                                    date: null,
                                    detail: "This lease is a draft. Use the actions above to approve it and move it through the workflow.",
                                }
                                : lease.status === "PENDING_APPROVAL"
                                    ? {
                                        tone: "info" as const,
                                        title: "Pending approval",
                                        date: null,
                                        detail: "Waiting for review. Use the actions above to mark as Awaiting Deposit or reject.",
                                    }
                                    : lease.status === "AWAITING_DEPOSIT"
                                        ? {
                                            tone: "info" as const,
                                            title: "Awaiting deposit",
                                            date: null,
                                            detail: "Activate this lease once the security deposit has been received.",
                                        }
                                        : lease.status === "PENDING_ACTIVATION"
                                            ? {
                                                tone: "info" as const,
                                                title: "Pending activation",
                                                date: null,
                                                detail: "Activation will start the billing cycle and send the renter their welcome notice.",
                                            }
                                            : null;

    const initials = (lease.tenantFullName || "")
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
        .padEnd(2, "\u00A0");

    const executeAction = async (actionType: LeaseActionType, needsReason?: boolean, needsTermination?: boolean) => {
        if (!user?.userId) return;
        setSubmittingAction(actionType);
        try {
            await performAction(leaseId, {
                performedBy: user.userId,
                action: actionType,
                reason: needsReason ? reason : undefined,
                terminationType: needsTermination ? terminationType : undefined,
                actor: user.userId,
            });
            setReason("");
        } catch {
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleAction = (actionType: LeaseActionType, needsReason?: boolean, needsTermination?: boolean, label?: string) => {
        if (!user?.userId) return;
        if (needsReason && !reason.trim()) return;
        if (DESTRUCTIVE_ACTIONS.includes(actionType)) {
            setPendingDestructive({ action: actionType, needsReason, needsTermination, label: label ?? "This action" });
            return;
        }
        void executeAction(actionType, needsReason, needsTermination);
    };

    const handleCopyLeaseNumber = async () => {
        try {
            await navigator.clipboard.writeText(lease.leaseNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
        }
    };

    const statCards = [
        {
            icon: Wallet,
            label: "Rent",
            value: formatCurrency(lease.rentAmount),
            gradient: "from-brand-50/80 to-brand-100/40",
            iconColor: "text-brand-600",
        },
        {
            icon: ShieldCheck,
            label: "Deposit",
            value: formatCurrency(lease.securityDeposit),
            gradient: "from-blue-50/80 to-blue-100/40",
            iconColor: "text-blue-600",
        },
        {
            icon: CalendarDays,
            label: "Start",
            value: formatDate(lease.startDate),
            gradient: "from-amber-50/80 to-amber-100/40",
            iconColor: "text-amber-600",
        },
        {
            icon: expiringSoon ? CalendarClock : CalendarDays,
            label: "End",
            value: formatDate(lease.endDate),
            gradient: expiringSoon ? "from-rose-50/80 to-rose-100/40" : "from-amber-50/80 to-amber-100/40",
            iconColor: expiringSoon ? "text-rose-600" : "text-amber-600",
            caption: expiringSoon
                ? `${daysLeft <= 0 ? "Expires today" : daysLeft === 1 ? "Expires tomorrow" : `${daysLeft} days left`}`
                : undefined,
        },
    ];

    return (
        <div className="page-container space-y-5 pb-12">
            {/* ── Back ── */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                Back
            </button>

            {/* ── Premium Header Card ── */}
            <div className="bg-surface rounded-2xl border border-border/60 shadow-sm p-5 animate-fade-in-up">
                <div className="flex items-start gap-4">
                    <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/20 ring-1 ring-white/20">
                        <span className="text-lg font-bold text-white">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold text-ink tracking-tight font-display">
                                {lease.tenantFullName || "Unnamed Tenant"}
                            </h1>
                            <button
                                onClick={handleCopyLeaseNumber}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-ink/[0.05] transition-colors"
                                aria-label="Copy lease number"
                                title="Copy lease number"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-brand" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <span className="text-sm text-ink-muted">Lease {lease.leaseNumber}</span>
                            <span className="text-ink-muted/20">·</span>
                            <span className="text-sm text-ink-muted">{formatEnumLabel(lease.leaseType)}</span>
                            {lease.tenantPhone && (
                                <>
                                    <span className="text-ink-muted/20">·</span>
                                    <span className="text-sm text-ink-muted">{lease.tenantPhone}</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3">
                            <LeaseStatusBadge status={lease.status} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Status Notice ── */}
            {statusNotice && (
                <div className={`animate-fade-in-up rounded-2xl border ${statusNotice.tone === "closed" ? "border-danger/30 bg-danger/[0.03]" : "border-ink/10 bg-ink/[0.02]"} p-4 flex gap-3`}>
                    <div className="shrink-0 pt-0.5">
                        {statusNotice.tone === "closed" ? (
                            <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={1.5} />
                        ) : (
                            <Info className="h-5 w-5 text-ink-muted" strokeWidth={1.5} />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-ink">{statusNotice.title}</p>
                        {statusNotice.date && (
                            <p className="text-xs text-ink-muted mt-0.5">{statusNotice.date}</p>
                        )}
                        {statusNotice.detail && (
                            <p className="text-sm text-ink mt-1.5">{statusNotice.detail}</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Premium Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card, index) => (
                    <div
                        key={card.label}
                        className="bg-surface rounded-xl border border-border/60 shadow-xs p-4 hover:shadow-md hover:-translate-y-0.5 hover:border-brand-200/50 transition-all duration-300 animate-fade-in-up"
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm ring-1 ring-white/50`}>
                                <card.icon className={`w-4 h-4 ${card.iconColor}`} strokeWidth={1.5} />
                            </div>
                        </div>
                        <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-0.5">{card.label}</p>
                        <p className="font-data text-lg font-bold text-ink">{card.value}</p>
                        {card.caption && (
                            <p className="text-[11px] font-medium text-rose-600 mt-0.5">{card.caption}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Lease Timeline ── */}
            {timelineEntries.length > 0 && (
                <div className="bg-surface rounded-2xl border border-border/60 shadow-sm p-5 animate-fade-in-up">
                    <button
                        onClick={() => setShowHistory((prev) => !prev)}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <h3 className="section-header mb-0 inline-flex items-center gap-2">
                            <History className="h-4 w-4 text-ink-muted" strokeWidth={1.5} />
                            Lease History
                        </h3>
                        <span className="text-xs text-ink-muted inline-flex items-center gap-1">
                            {showHistory ? "Hide" : "View history"}
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform duration-150 ${showHistory ? "rotate-180" : ""}`}
                                strokeWidth={2}
                            />
                        </span>
                    </button>

                    {showHistory && (
                        <div className="mt-4 relative">
                            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-brand-300 via-brand-200 to-brand-100 rounded-full" />
                            <div className="space-y-0">
                                {timelineEntries.map((entry) => (
                                    <div key={entry.label} className="relative flex gap-4 pb-6 last:pb-0">
                                        <div className="relative z-10 mt-1.5">
                                            <div className="w-[24px] h-[24px] rounded-full bg-surface border-[3px] border-brand-300 shadow-sm flex items-center justify-center">
                                                <div className="w-[6px] h-[6px] rounded-full bg-brand-500" />
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-0.5">
                                            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{entry.label}</p>
                                            <p className="text-sm text-ink mt-0.5">{entry.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Actions Section ── */}
            {availableActions.length > 0 && (
                <div className="bg-surface rounded-2xl border border-border/60 shadow-sm p-5 animate-fade-in-up space-y-4">
                    <h3 className="section-header inline-flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-brand" />
                        Actions
                    </h3>

                    {availableActions.some((a) => a.needsReason) && (
                        <div>
                            <label htmlFor="lease-action-reason" className="form-label">
                                Reason <span className="text-ink-muted font-normal">(required for Reject/Terminate/Cancel)</span>
                            </label>
                            <textarea
                                id="lease-action-reason"
                                className="form-input"
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter the reason for this action..."
                            />
                        </div>
                    )}

                    {availableActions.some((a) => a.needsTermination) && (
                        <div>
                            <label htmlFor="lease-termination-type" className="form-label">Termination Type</label>
                            <select
                                id="lease-termination-type"
                                className="form-input max-w-xs"
                                value={terminationType}
                                onChange={(e) => setTerminationType(e.target.value as TerminationType)}
                            >
                                <option value="TENANT_REQUEST">Tenant Request</option>
                                <option value="LANDLORD_REQUEST">Landlord Request</option>
                                <option value="BREACH_OF_CONTRACT">Breach of Contract</option>
                                <option value="NON_PAYMENT">Non-Payment</option>
                                <option value="MUTUAL_AGREEMENT">Mutual Agreement</option>
                            </select>
                        </div>
                    )}

                    <div className="flex gap-3 flex-wrap pt-1">
                        {orderedActions.map((a) => {
                            const isSubmittingThis = submittingAction === a.action;
                            const isDisabled = isActing || (a.needsReason && !reason.trim());
                            const isDestructive = DESTRUCTIVE_ACTIONS.includes(a.action);
                            return (
                                <button
                                    key={a.action}
                                    onClick={() => handleAction(a.action, a.needsReason, a.needsTermination, a.label)}
                                    disabled={isDisabled}
                                    className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isDestructive
                                            ? "bg-danger text-white hover:bg-danger-dark shadow-sm shadow-danger/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            : "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    }`}
                                >
                                    {isSubmittingThis && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                                    {a.label}
                                </button>
                            );
                        })}
                    </div>

                    {pendingDestructive && (
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                            <AlertTriangle className="h-4 w-4 text-danger shrink-0" strokeWidth={2} />
                            <p className="flex-1 text-sm text-danger-dark dark:text-danger">
                                {pendingDestructive.label} cannot be undone. Continue?
                            </p>
                            <button
                                onClick={() => {
                                    const { action, needsReason, needsTermination } = pendingDestructive;
                                    setPendingDestructive(null);
                                    void executeAction(action, needsReason, needsTermination);
                                }}
                                disabled={isActing}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-danger text-white text-xs font-medium hover:bg-danger-dark disabled:opacity-50 transition-colors"
                            >
                                {isActing && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                                Confirm
                            </button>
                            <button
                                onClick={() => setPendingDestructive(null)}
                                className="h-8 px-3 rounded-lg text-xs text-ink-muted hover:text-ink transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Staff Read-Only Notice ── */}
            {showStaffReadOnlyNotice && (
                <div className="bg-surface rounded-xl border border-border/60 shadow-xs p-4 animate-fade-in-up flex gap-3 items-start">
                    <Info className="h-5 w-5 text-ink-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm text-ink-muted">
                        This lease has actions available to owners and managers. You have view-only access.
                    </p>
                </div>
            )}

            {/* ── Rent Ledger Section ── */}
            <section className="animate-fade-in-up space-y-3">
                <div className="flex items-center gap-3">
                    <h2 className="section-header mb-0">Rent Ledger</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-border/80 to-transparent" />
                </div>
                <RentLedgerList leaseId={leaseId} onSelectEntry={() => router.push(`/dashboard/leases/${leaseId}/ledger`)} />
            </section>
        </div>
    );
}

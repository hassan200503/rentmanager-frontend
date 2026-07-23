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

// Matches the 0-decimal formatting used on the leases list page — was
// showing 2 decimals here, inconsistent with the rest of the app.
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

// NEW this session: lifecycle timestamps are LocalDateTime (date + time,
// no timezone offset) unlike startDate/endDate which are date-only --
// separate formatter so these show time-of-day too.
const formatDateTime = (isoDateTime: string) =>
    new Date(isoDateTime).toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

// Turns SNAKE_CASE / CONSTANT_CASE backend enum values into readable text
// (e.g. "RESIDENTIAL_FIXED_TERM" -> "Residential Fixed Term") without
// needing a label map for every enum the DTO might ever send.
const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

// Human-readable labels for TerminationType, matching the <select> options
// already used in the Actions section below -- single source of truth
// would be better long-term, but keeping this local to avoid touching
// unrelated code in this pass.
const TERMINATION_TYPE_LABELS: Record<TerminationType, string> = {
    TENANT_REQUEST: "Tenant Request",
    LANDLORD_REQUEST: "Landlord Request",
    BREACH_OF_CONTRACT: "Breach of Contract",
    NON_PAYMENT: "Non-Payment",
    MUTUAL_AGREEMENT: "Mutual Agreement",
};

// Actions that end or reject a lease outright, as opposed to advancing it
// forward (approve, activate, renew). Used to order buttons so the
// irreversible ones aren't the first thing a hand lands on, and to decide
// which actions get a confirmation step before firing.
// UPDATED this session: EXPIRE added. It's a manual override of what's
// normally a scheduler-driven transition (LeaseActionScheduler), so it
// gets the same "cannot be undone" confirm step as TERMINATE/REJECT/CANCEL
// rather than firing on a single click like the other forward-progress
// actions (APPROVE, ACTIVATE, RENEW).
const DESTRUCTIVE_ACTIONS: LeaseActionType[] = ["TERMINATE", "REJECT", "CANCEL", "EXPIRE"];

// ASSUMPTION FLAGGED: available actions per current status, inferred from
// Lease.java's own guard clauses (approve() requires DRAFT, activate()
// requires AWAITING_DEPOSIT, etc.) — not from a confirmed frontend spec.
// UPDATED this session: EXPIRE/CANCEL wired in per backend changes;
// RENEWED now has a full action set (was correctly empty prior to this
// session per Addendum 3 §1.9 — that finding no longer holds by design).
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
    // NEW (this pass): timeline card now defaults to collapsed. The
    // single-line status notice below answers "what's the current state
    // and why" at a glance; the full history is one click away for
    // whoever actually needs to reconstruct it (support, disputes, etc.)
    const [showHistory, setShowHistory] = useState(false);
    // Tracks which specific action is in flight, so only that button shows
    // a spinner instead of every button just going inert together.
    const [submittingAction, setSubmittingAction] = useState<LeaseActionType | null>(null);
    const [copied, setCopied] = useState(false);

    if (isLoading) {
        return (
            <div className="page-container space-y-6">
                <div>
                    <div className="skeleton h-4 w-28 mb-4" />
                    <div className="skeleton h-8 w-64 mb-2" />
                    <div className="skeleton h-4 w-48" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="card-sm skeleton h-20" />
                    ))}
                </div>
                <div className="card skeleton h-40" />
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="page-container">
                <div className="card text-center max-w-md mx-auto mt-12">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                        <FileQuestion className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-ink mb-1">Lease not found</p>
                    <p className="text-xs text-ink-muted mb-4">
                        It may have been removed, or the link is out of date.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard/leases")}
                        className="btn-outline inline-flex items-center gap-1.5 w-fit mx-auto"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                    Back to tenants
                    </button>
                </div>
            </div>
        );
    }

    // Lets an active/renewed lease ending soon surface a warning on the End
    // date stat card, mirroring the "needs attention" logic used on the
    // leases list page rather than inventing a separate threshold here.
    // MOVED above availableActions this session: EXPIRE visibility now
    // depends on daysLeft (see below), so it needs to be computed first.
    const expiringSoon = isExpiringSoon(lease.status, lease.endDate, 30);
    const daysLeft = daysUntil(lease.endDate);

    // RBAC-aware UI: executeAction on the backend is OWNER+MANAGER only
    // (confirmed via LeaseControllerRbacTest, Addendum 3 Section 1.6).
    // STAFF can view the lease (getById is OWNER+MANAGER+STAFF) but has
    // no action buttons rendered — chosen over "disabled + tooltip" per
    // the DECISION NEEDED flagged when this was implemented.
    const canManageLease = isOwner || isManager;
    const statusActions = ACTIONS_BY_STATUS[lease.status] ?? [];
    // UPDATED this session: EXPIRE is a scheduler-owned, date-driven
    // transition (LeaseActionScheduler walks ACTIVE -> EXPIRED once
    // endDate passes) — it's filtered out of the manual action list here
    // until the lease is actually due, so it can't be used to end an
    // active tenancy early. Once due, it's still available as a manual
    // override in case the scheduler hasn't run yet, gated behind the
    // same confirm step as the other DESTRUCTIVE_ACTIONS.
    const visibleStatusActions = statusActions.filter(
        (a) => a.action !== "EXPIRE" || daysLeft <= 0
    );
    const availableActions = canManageLease ? visibleStatusActions : [];
    // STAFF viewing a lease that DOES have actions pending for owners/
    // managers — surface a short note so it's clear the empty Actions
    // card isn't a bug, it's a permissions boundary.
    const showStaffReadOnlyNotice = !canManageLease && visibleStatusActions.length > 0;

    // Non-destructive actions (approve, activate, renew...) render first;
    // ending/rejecting the lease renders last so it isn't the first thing
    // a hand lands on in the button row.
    const orderedActions = [...availableActions].sort(
        (a, b) => Number(DESTRUCTIVE_ACTIONS.includes(a.action)) - Number(DESTRUCTIVE_ACTIONS.includes(b.action))
    );

    // NEW this session: lifecycle timeline entries -- only rendered if the
    // corresponding timestamp is actually set. Order reflects a lease's
    // natural lifecycle (signed -> activated -> renewed -> closed), not
    // necessarily chronological order for any single lease (e.g. a lease
    // can be renewed multiple times in reality, though this DTO only ever
    // carries the most recent renewedAt).
    const timelineEntries: { label: string; value: string }[] = [
        lease.signedAt && { label: "Signed", value: formatDateTime(lease.signedAt) },
        lease.activatedAt && { label: "Activated", value: formatDateTime(lease.activatedAt) },
        lease.renewedAt && { label: "Renewed", value: formatDateTime(lease.renewedAt) },
        lease.expiredAt && { label: "Expired", value: formatDateTime(lease.expiredAt) },
        lease.terminatedAt && { label: "Terminated", value: formatDateTime(lease.terminatedAt) },
        lease.cancelledAt && { label: "Cancelled", value: formatDateTime(lease.cancelledAt) },
    ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

    // UPDATED this pass: status notice now covers all four statuses where
    // "what happened and when" isn't obvious from the badge alone --
    // not just CANCELLED/TERMINATED. EXPIRED and RENEWED get a lighter,
    // non-alarming treatment (no red border) since they're not adverse
    // outcomes the way a cancellation or termination is -- just informational.
    // EXPIRED/RENEWED still have no human-provided reason, per the original
    // reasoning (EXPIRED is a passive, date-driven transition; RENEWED is
    // a routine continuation), so only date is shown for those two.
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
                        : null;




    const handleAction = async (actionType: LeaseActionType, needsReason?: boolean, needsTermination?: boolean, label?: string) => {
        if (!user?.userId) return;
        // Guard clause backing up the disabled state on the button itself —
        // keeps this safe to call even if that ever gets out of sync.
        if (needsReason && !reason.trim()) return;

        if (DESTRUCTIVE_ACTIONS.includes(actionType)) {
            const confirmed = window.confirm(
                `${label ?? "This action"} cannot be undone. Are you sure you want to continue?`
            );
            if (!confirmed) return;
        }

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
            // error surfaced via toast in useLeaseActionMutation
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleCopyLeaseNumber = async () => {
        try {
            await navigator.clipboard.writeText(lease.leaseNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard API unavailable (e.g. insecure context) -- not worth surfacing an error for
        }
    };





    return (
        <div className="page-container space-y-6">
            <div className="animate-fade-in-up">
                <button
                    onClick={() => router.push("/dashboard/leases")}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-2"
                >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    Back to leases
                </button>
                <div className="flex items-center gap-1.5">
                    <h1 className="page-title mb-1">{lease.tenantFullName || lease.leaseNumber}</h1>
                    <button
                        onClick={handleCopyLeaseNumber}
                        className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-ink/[0.05] transition-colors"
                        aria-label="Copy lease number"
                        title="Copy lease number"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-primary-dark" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={2} />}
                    </button>
                </div>
                <p className="text-sm text-ink-muted mb-2">
                    Lease {lease.leaseNumber} · {formatEnumLabel(lease.leaseType)}
                    {lease.tenantPhone ? ` · ${lease.tenantPhone}` : ""}
                </p>
                <div className="flex gap-2 items-center">
                    <LeaseStatusBadge status={lease.status} />
                </div>
            </div>

            {statusNotice && (
                <div
                    className={
                        statusNotice.tone === "closed"
                            ? "card-sm animate-fade-in-up border-l-4 border-danger bg-danger/[0.03] flex gap-3"
                            : "card-sm animate-fade-in-up border-l-4 border-ink/15 bg-ink/[0.02] flex gap-3"
                    }
                >
                    <div className="shrink-0 pt-0.5">
                        {statusNotice.tone === "closed" ? (
                            <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={2} />
                        ) : (
                            <Info className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-ink">{statusNotice.title}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{statusNotice.date}</p>
                        {statusNotice.detail && (
                            <p className="text-sm text-ink mt-1.5">{statusNotice.detail}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-sm animate-fade-in-up">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Wallet className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Rent</p>
                    </div>
                    <p className="font-data text-xl font-semibold text-ink">{formatCurrency(lease.rentAmount)}</p>
                </div>
                <div className="card-sm animate-fade-in-up">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Deposit</p>
                    </div>
                    <p className="font-data text-xl font-semibold text-ink">{formatCurrency(lease.securityDeposit)}</p>
                </div>
                <div className="card-sm animate-fade-in-up">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">Start</p>
                    </div>
                    <p className="font-data text-sm text-ink">{formatDate(lease.startDate)}</p>
                </div>
                <div className="card-sm animate-fade-in-up">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        {expiringSoon ? (
                            <CalendarClock className="h-3.5 w-3.5 text-warning-dark" strokeWidth={2} />
                        ) : (
                            <CalendarDays className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                        )}
                        <p className={`text-xs font-medium uppercase tracking-wide ${expiringSoon ? "text-warning-dark" : "text-ink-muted"}`}>End</p>
                    </div>
                    <p className="font-data text-sm text-ink">{formatDate(lease.endDate)}</p>
                    {expiringSoon && (
                        <p className="text-[11px] font-medium text-warning-dark mt-1">
                            {daysLeft <= 0 ? "Expires today" : daysLeft === 1 ? "Expires tomorrow" : `${daysLeft} days left`}
                        </p>
                    )}
                </div>
            </div>

            {timelineEntries.length > 0 && (
                <div className="card animate-fade-in-up">
                    <button
                        onClick={() => setShowHistory((prev) => !prev)}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <h3 className="section-header mb-0 inline-flex items-center gap-1.5">
                            <History className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                            Lease History
                        </h3>
                        <span className="text-xs text-ink-muted inline-flex items-center gap-1">
                            {showHistory ? "Hide" : "View lease history"}
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform duration-150 ${showHistory ? "rotate-180" : ""}`}
                                strokeWidth={2}
                            />
                        </span>
                    </button>

                    {showHistory && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                            {timelineEntries.map((entry) => (
                                <div key={entry.label}>
                                    <p className="text-xs font-medium text-ink-muted mb-1 uppercase tracking-wide">{entry.label}</p>
                                    <p className="text-sm text-ink">{entry.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {availableActions.length > 0 && (
                <div className="card animate-fade-in-up space-y-4">
                    <h3 className="section-header">Actions</h3>

                    {availableActions.some((a) => a.needsReason) && (
                        <div>
                            <label htmlFor="lease-action-reason" className="form-label">
                                Reason (required for Reject/Terminate/Cancel)
                            </label>
                            <textarea
                                id="lease-action-reason"
                                className="form-input"
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
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

                    <div className="flex gap-3 flex-wrap">
                        {orderedActions.map((a) => {
                            const isSubmittingThis = submittingAction === a.action;
                            const isDisabled = isActing || (a.needsReason && !reason.trim());
                            return (
                                <button
                                    key={a.action}
                                    onClick={() => handleAction(a.action, a.needsReason, a.needsTermination, a.label)}
                                    disabled={isDisabled}
                                    className={`inline-flex items-center gap-1.5 ${
                                        a.action === "TERMINATE" || a.action === "REJECT" ? "btn-danger" : "btn-primary"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isSubmittingThis && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
                                    {a.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {showStaffReadOnlyNotice && (
                <div className="card-sm animate-fade-in-up flex gap-3 items-start">
                    <Info className="h-4 w-4 text-ink-muted shrink-0 mt-0.5" strokeWidth={2} />
                    <p className="text-xs text-ink-muted">
                        This lease has actions available to owners and managers. You have view-only access.
                    </p>
                </div>
            )}

            <section className="space-y-4 animate-fade-in-up">
                <h2 className="section-header">Rent Ledger</h2>
                <RentLedgerList leaseId={leaseId} onSelectEntry={(entryId) => router.push(`/dashboard/leases/${leaseId}/ledger`)} />
            </section>
        </div>
    );
}
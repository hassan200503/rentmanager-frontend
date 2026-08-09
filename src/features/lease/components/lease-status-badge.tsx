import {
    FileEdit,
    Clock,
    Wallet,
    CheckCircle2,
    RefreshCw,
    AlertTriangle,
    PauseCircle,
    Ban,
    XCircle,
} from "lucide-react";
import type { ElementType } from "react";
import { LeaseStatus } from "../types/lease-response";

// RESOLVED (this session): grouping confirmed with one change from the
// original proposal -- SUSPENDED moved from warning to danger.
// Reasoning: EXPIRED is a passive, no-fault lifecycle event (the term just
// ran out); SUSPENDED is an active hold on an otherwise-live lease, almost
// always triggered by something needing the landlord's attention
// (non-payment, breach, dispute). Grouping it with EXPIRED under-signaled
// it -- it should read as "needs urgent attention" the same way
// CANCELLED/TERMINATED do, even though a suspended lease can still resume
// (unlike a terminated one).
//
// Final grouping: DRAFT/PENDING_APPROVAL/AWAITING_DEPOSIT/PENDING_ACTIVATION
// -> neutral (in-progress, nothing wrong); ACTIVE/RENEWED -> success;
// EXPIRED -> warning (routine, no-fault); CANCELLED/TERMINATED/SUSPENDED
// -> danger (closed out or needs urgent attention).
const statusPillMap: Record<LeaseStatus, string> = {
    DRAFT: "pill pill-neutral",
    PENDING_APPROVAL: "pill pill-neutral",
    AWAITING_DEPOSIT: "pill pill-neutral",
    PENDING_ACTIVATION: "pill pill-neutral",
    ACTIVE: "pill pill-success",
    RENEWED: "pill pill-success",
    EXPIRED: "pill pill-warning",
    SUSPENDED: "pill pill-danger",
    CANCELLED: "pill pill-danger",
    TERMINATED: "pill pill-danger",
};

// UI-ONLY ADDITION (this session): tone grouping above is untouched -- same
// 4 tones, same status-to-tone mapping. This just adds a per-status icon and
// Title Case label so statuses sharing a tone (e.g. the 4 neutral "in
// progress" ones, or SUSPENDED/CANCELLED/TERMINATED all under danger) stay
// distinguishable at a glance instead of reading as identical pills with
// different all-caps text.
const statusIconMap: Record<LeaseStatus, ElementType> = {
    DRAFT: FileEdit,
    PENDING_APPROVAL: Clock,
    AWAITING_DEPOSIT: Wallet,
    PENDING_ACTIVATION: Clock,
    ACTIVE: CheckCircle2,
    RENEWED: RefreshCw,
    EXPIRED: AlertTriangle,
    SUSPENDED: PauseCircle,
    CANCELLED: Ban,       // never became active -- closed before it started
    TERMINATED: XCircle,  // was active -- closed early
};

const statusLabelMap: Record<LeaseStatus, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    AWAITING_DEPOSIT: "Awaiting Deposit",
    PENDING_ACTIVATION: "Pending Activation",
    ACTIVE: "Active",
    RENEWED: "Renewed",
    EXPIRED: "Expired",
    SUSPENDED: "Suspended",
    CANCELLED: "Cancelled",
    TERMINATED: "Terminated",
};

export const LeaseStatusBadge = ({ status }: { status: LeaseStatus }) => {
    const Icon = (statusIconMap[status] ?? Clock) as React.ComponentType<{ className?: string; strokeWidth?: number }>;
    const label = statusLabelMap[status] ?? status.replaceAll("_", " ");

    return (
        <span className={`${statusPillMap[status] ?? "pill pill-neutral"} inline-flex items-center gap-1`}>
            <Icon className="h-3 w-3" strokeWidth={2} />
            {label}
        </span>
    );
};
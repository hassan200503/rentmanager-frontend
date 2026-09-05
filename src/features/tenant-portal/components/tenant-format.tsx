// components/tenant-format.tsx
//
// Shared formatting helpers + StatusBadge for the (non-premium) tenant
// portal screens: tenant-payments, tenant-lease, tenant-topbar,
// tenant-announcements, tenant-maintenance. Extracted from the old
// tenant-dashboard.tsx, which doubled as both this shared utility module AND
// a page component (`TenantDashboard`) that was superseded by
// `premium-tenant-dashboard.tsx` and never actually routed to — that dead
// component (and its private helpers used only by it) was deleted rather
// than carried over here.
export const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const titleCaseStatus = (status: string) =>
    status
        ?.toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "Unknown";

const statusTone = (status: string) => {
    const normalized = status?.toUpperCase?.() ?? "";
    if (["ACTIVE", "PAID", "COMPLETED", "OVERPAID", "APPROVED"].includes(normalized)) return "success";
    if (["OVERDUE", "TERMINATED", "FAILED", "REJECTED"].includes(normalized)) return "danger";
    if (["PENDING", "DUE", "PARTIALLY_PAID", "PARTIAL"].includes(normalized)) return "warning";
    return "neutral";
};

export const StatusBadge = ({ status }: { status: string }) => (
    <span className={`tenant-status-chip tenant-status-chip-${statusTone(status)} inline-flex`}>
        {titleCaseStatus(status)}
    </span>
);

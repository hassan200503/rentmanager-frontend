"use client";

import { useUsersQuery } from "../queries/use-users-query";
import { UserRole } from "../types/user";

const roleLabel: Record<UserRole, string> = {
    [UserRole.OWNER]: "Owner",
    [UserRole.MANAGER]: "Manager",
    [UserRole.STAFF]: "Staff",
};

// FIXED: was using ad-hoc inline Tailwind colors (purple/blue/gray) instead of the
// established pill component classes. NOT mapped to pill-success/warning/danger,
// though — those are semantic severity colors (Draft/Active/Archived fit that;
// Owner/Manager/Staff don't — a Manager isn't a "warning" state). Using
// pill-neutral for all three as a safe default pending a decision on whether role
// tiers need their own distinct visual treatment.
const roleBadgeClass: Record<UserRole, string> = {
    [UserRole.OWNER]: "pill pill-neutral",
    [UserRole.MANAGER]: "pill pill-neutral",
    [UserRole.STAFF]: "pill pill-neutral",
};

export function TeamMemberTable() {
    const { data, isLoading, error } = useUsersQuery({ page: 0, size: 50 });

    if (isLoading) {
        return <div className="p-4 text-sm text-ink-muted">Loading team members...</div>;
    }

    if (error) {
        return <div className="p-4 text-sm text-danger">Failed to load team members.</div>;
    }

    return (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full bg-surface">
                <thead className="bg-canvas">
                <tr>
                    <th className="p-3 text-left text-sm font-medium text-ink-muted">Name</th>
                    <th className="p-3 text-left text-sm font-medium text-ink-muted">Email</th>
                    <th className="p-3 text-left text-sm font-medium text-ink-muted">Role</th>
                    <th className="p-3 text-left text-sm font-medium text-ink-muted">Status</th>
                </tr>
                </thead>
                <tbody>
                {data?.content?.map((u) => (
                    <tr key={u.userId} className="border-b border-gray-200 hover:bg-canvas transition">
                        <td className="p-3 text-sm text-ink">
                            {u.firstName} {u.lastName}
                        </td>
                        <td className="p-3 text-sm text-ink">{u.email}</td>
                        <td className="p-3">
                            {u.role ? (
                                <span className={roleBadgeClass[u.role]}>
                                    {roleLabel[u.role]}
                                </span>
                            ) : (
                                // Defensive only — should be unreachable: GET /users is
                                // scoped to TenantContext.getTenantId() server-side
                                // (UserQueryServiceImpl.getByTenant -> findByTenantId),
                                // and a null-tenantId (pending onboarding) user can never
                                // satisfy that query. Kept as a visible fallback rather
                                // than a silent `!` assertion in case that invariant
                                // ever changes.
                                <span className="text-xs text-ink-muted">—</span>
                            )}
                        </td>
                        <td className="p-3 text-sm">
                            {/*
                              FIXED: was ad-hoc text-green-600 / text-gray-400. Switched to
                              the established .status-dot / .status-dot-live convention
                              (already used decoratively in Topbar) since this is a "live"
                              indicator, not a severity state — closer semantic fit than a
                              pill. Flagging as an assumption: haven't seen the .status-dot
                              CSS itself to confirm exact rendered size/shape.
                            */}
                            <span className="inline-flex items-center gap-2 text-ink-muted">
                                <span className={`status-dot ${u.active ? "status-dot-live" : ""}`} />
                                {u.active ? "Active" : "Inactive"}
                            </span>
                        </td>
                    </tr>
                ))}

                {data?.empty && (
                    <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-ink-muted">
                            No team members yet.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
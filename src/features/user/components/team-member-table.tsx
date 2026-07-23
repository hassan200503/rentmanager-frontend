"use client";

import { useUsersQuery } from "../queries/use-users-query";
import { UserRole } from "../types/user";

const roleLabel: Record<UserRole, string> = {
    [UserRole.OWNER]: "Owner",
    [UserRole.MANAGER]: "Manager",
    [UserRole.STAFF]: "Staff",
};

const roleBadgeClass: Record<UserRole, string> = {
    [UserRole.OWNER]: "pill-neutral",
    [UserRole.MANAGER]: "pill-neutral",
    [UserRole.STAFF]: "pill-neutral",
};

export function TeamMemberTable() {
    const { data, isLoading, error } = useUsersQuery({ page: 0, size: 50 });

    if (isLoading) {
        return <div className="p-4 text-sm text-fg-muted dark:text-fg-muted-dark">Loading team members...</div>;
    }

    if (error) {
        return <div className="p-4 text-sm text-danger">Failed to load team members.</div>;
    }

    const members = data?.content ?? [];

    if (members.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">No team members yet. Invite someone to get started.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                <tr className="text-left text-fg-muted dark:text-fg-muted-dark border-b border-border dark:border-border-dark">
                    <th className="p-3 font-medium text-xs uppercase tracking-wide">Name</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wide">Email</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wide">Role</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wide">Status</th>
                </tr>
                </thead>
                <tbody>
                {members.map((u) => (
                    <tr key={u.userId} className="border-b border-border-subtle dark:border-border-subtle-dark last:border-0 hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors">
                        <td className="p-3 text-sm font-medium text-fg dark:text-fg-dark">
                            {u.firstName} {u.lastName}
                        </td>
                        <td className="p-3 text-sm text-fg-muted dark:text-fg-muted-dark">{u.email}</td>
                        <td className="p-3">
                            {u.role ? (
                                <span className={roleBadgeClass[u.role]}>
                                    {roleLabel[u.role]}
                                </span>
                            ) : (
                                <span className="text-xs text-fg-muted dark:text-fg-muted-dark">—</span>
                            )}
                        </td>
                        <td className="p-3 text-sm">
                            <span className="inline-flex items-center gap-2 text-fg-muted dark:text-fg-muted-dark">
                                <span className={`status-dot ${u.active ? "status-dot-success" : ""}`} />
                                {u.active ? "Active" : "Inactive"}
                            </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
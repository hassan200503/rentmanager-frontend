"use client";

import { useState } from "react";
import { Loader2, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useUsersQuery } from "../queries/use-users-query";
import { userApi } from "../api/user-api";
import { UserRole, type UserResponse } from "../types/user";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

const roleLabel: Record<UserRole, string> = {
    [UserRole.OWNER]: "Owner",
    [UserRole.MANAGER]: "Manager",
    [UserRole.STAFF]: "Staff",
};

const roleBadgeClass: Record<UserRole, string> = {
    [UserRole.OWNER]:
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-brand/10 text-brand-dark dark:bg-brand/20 dark:text-brand-200",
    [UserRole.MANAGER]:
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    [UserRole.STAFF]:
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
};

const roleAvatarGradient: Record<UserRole, string> = {
    [UserRole.OWNER]: "from-brand to-brand-dark",
    [UserRole.MANAGER]: "from-amber-500 to-amber-600",
    [UserRole.STAFF]: "from-slate-400 to-slate-500",
};

function memberInitials(member: UserResponse): string {
    const first = member.firstName?.trim() ?? "";
    const last = member.lastName?.trim() ?? "";
    if (first || last) {
        return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || "?";
    }
    const email = member.email ?? "";
    if (!email || email === "unknown@clerk.user") return "?";
    return email.slice(0, 2).toUpperCase();
}

function memberDisplayName(member: UserResponse): string {
    const first = member.firstName?.trim() ?? "";
    const last = member.lastName?.trim() ?? "";
    if (first || last) return [first, last].filter(Boolean).join(" ");
    const email = member.email ?? "";
    if (!email || email === "unknown@clerk.user") return "—";
    return email.split("@")[0];
}

function memberDisplayEmail(email: string): string {
    if (!email || email === "unknown@clerk.user") return "—";
    return email;
}

function MemberAvatar({ member }: { member: UserResponse }) {
    const role = member.role ?? UserRole.STAFF;
    return (
        <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${roleAvatarGradient[role]} text-[13px] font-bold text-white shadow-sm`}
        >
            {memberInitials(member)}
        </div>
    );
}

export function TeamMemberTable() {
    const { data, isLoading, error } = useUsersQuery({ page: 0, size: 50 });
    const { user: currentUser, isOwner } = useCurrentUser();
    const [removing, setRemoving] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const handleRemove = async (member: UserResponse) => {
        if (removing) return;
        setRemoving(member.userId);
        try {
            await userApi.remove(member.userId);
            await queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(`${memberDisplayName(member)} removed from the team.`);
        } catch {
            toast.error("Failed to remove team member. Try again.");
        } finally {
            setRemoving(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-1 py-2">
                        <div className="skeleton h-9 w-9 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="skeleton h-4 w-32" />
                            <div className="skeleton h-3 w-48" />
                        </div>
                        <div className="skeleton h-5 w-16 rounded-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 rounded-lg bg-danger/5 border border-danger/20 px-4 py-3 mt-2">
                <UserX className="h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                <p className="text-sm text-danger">Failed to load team members.</p>
            </div>
        );
    }

    const members = data?.content ?? [];

    if (members.length === 0) {
        return (
            <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                    <UserX className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    No team members yet. Invite someone to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-2 divide-y divide-border dark:divide-border-dark">
            {members.map((u) => {
                const isMe = u.userId === currentUser?.userId;
                const canRemove = isOwner && !isMe && u.role !== UserRole.OWNER;
                const isRemoving = removing === u.userId;

                return (
                    <div
                        key={u.userId}
                        className="flex items-center gap-3 py-3.5 first:pt-2 last:pb-2"
                    >
                        <MemberAvatar member={u} />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-fg dark:text-fg-dark truncate">
                                    {memberDisplayName(u)}
                                </span>
                                {isMe && (
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-border-subtle dark:bg-border-subtle-dark text-fg-muted dark:text-fg-muted-dark">
                                        You
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark truncate mt-0.5">
                                {memberDisplayEmail(u.email)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            {u.role ? (
                                <span className={roleBadgeClass[u.role]}>
                                    {roleLabel[u.role]}
                                </span>
                            ) : (
                                <span className="text-xs text-fg-muted dark:text-fg-muted-dark">—</span>
                            )}

                            <span
                                className={`status-dot ${u.active ? "status-dot-success" : ""}`}
                                title={u.active ? "Active" : "Inactive"}
                            />

                            {canRemove && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(u)}
                                    disabled={isRemoving}
                                    className="inline-flex items-center gap-1 rounded-lg border border-danger/20 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger/5 hover:border-danger/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isRemoving ? (
                                        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                                    ) : (
                                        <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                                    )}
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

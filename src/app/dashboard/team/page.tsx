"use client";

import { Users, UserPlus, ShieldCheck } from "lucide-react";
import { InviteUserForm } from "@/features/user/components/invite-user-form";
import { TeamMemberTable } from "@/features/user/components/team-member-table";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

export default function TeamPage() {
    const { isStaff, isLoading } = useCurrentUser();

    return (
        <div className="page-container space-y-6">
            <div className="flex items-start gap-3 animate-fade-in-up">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                    <Users className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="page-title mb-1">Team</h1>
                    <p className="page-subtitle mb-0">
                        Invite managers and staff to help run your properties.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="card max-w-lg animate-fade-in-up space-y-3">
                    <div className="skeleton h-5 w-40" />
                    <div className="skeleton h-10 w-full rounded-lg" />
                    <div className="skeleton h-10 w-full rounded-lg" />
                    <div className="skeleton h-10 w-32 rounded-lg" />
                </div>
            ) : isStaff ? (
                <div className="card max-w-lg animate-fade-in-up text-center py-8">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                        <ShieldCheck className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Restricted</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                        You don&#39;t have permission to invite or manage team members. Ask an account owner for access.
                    </p>
                </div>
            ) : (
                <div className="card max-w-lg animate-fade-in-up">
                    <h2 className="section-header inline-flex items-center gap-1.5">
                        <UserPlus className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        Invite a team member
                    </h2>
                    <InviteUserForm />
                </div>
            )}

            <div className="card animate-fade-in-up">
                <h2 className="section-header inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    Team members
                </h2>
                <TeamMemberTable />
            </div>
        </div>
    );
}
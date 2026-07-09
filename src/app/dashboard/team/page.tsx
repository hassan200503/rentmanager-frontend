"use client";

import { InviteUserForm } from "@/features/user/components/invite-user-form";
import { TeamMemberTable } from "@/features/user/components/team-member-table";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

export default function TeamPage() {
    const { isStaff, isLoading } = useCurrentUser();

    return (
        <div className="page-container space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title mb-1">Team</h1>
                <p className="page-subtitle mb-0">
                    Invite managers and staff to help run your properties.
                </p>
            </div>

            {/*
              FIXED: original condition was `!isLoading && isStaff ? no-permission : form`,
              which meant that while isLoading was true, !isLoading was false, so the
              ELSE branch (the invite form) rendered regardless of the user's actual role
              — a permission-gated form could flash briefly for a Staff user before the
              check caught up. Added an explicit loading branch so nothing renders until
              the role is actually known.

              NOTE: the isStaff -> no-permission / else -> form direction itself was left
              as-is. Cross-referencing InviteUserForm's own internals (it distinguishes
              Owner vs Manager behavior and assumes a Manager can reach this form) supports
              Staff-blocked / Owner-or-Manager-allowed being the intended direction — but
              flagging that this is still a business/access-control call, not something to
              silently declare settled without confirmation.
            */}
            {isLoading ? (
                <div className="card max-w-lg animate-fade-in-up">
                    <p className="text-sm text-ink-muted">Loading...</p>
                </div>
            ) : isStaff ? (
                <div className="card max-w-lg animate-fade-in-up">
                    <p className="text-sm text-ink-muted">
                        You don&#39;t have permission to invite or manage team members.
                    </p>
                </div>
            ) : (
                <div className="card max-w-lg animate-fade-in-up">
                    <h2 className="section-header">Invite a team member</h2>
                    <InviteUserForm />
                </div>
            )}

            <div className="card animate-fade-in-up">
                <h2 className="section-header">Team members</h2>
                <TeamMemberTable />
            </div>
        </div>
    );
}
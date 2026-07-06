"use client";

import { InviteUserForm } from "@/features/user/components/invite-user-form";
import { TeamMemberTable } from "@/features/user/components/team-member-table";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

export default function TeamPage() {
    const { isStaff, isLoading } = useCurrentUser();

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
                <p className="text-sm text-gray-500">
                    Invite managers and staff to help run your properties.
                </p>
            </div>

            {!isLoading && isStaff ? (
                <div className="card bg-white p-6 rounded shadow max-w-lg">
                    <p className="text-sm text-gray-600">
                        You don&#39;t have permission to invite or manage team members.
                    </p>
                </div>
            ) : (
                <div className="card bg-white p-6 rounded shadow max-w-lg">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">
                        Invite a team member
                    </h2>
                    <InviteUserForm />
                </div>
            )}

            <div className="card bg-white p-6 rounded shadow">
                <h2 className="text-lg font-medium text-gray-800 mb-4">
                    Team members
                </h2>
                <TeamMemberTable />
            </div>
        </div>
    );
}
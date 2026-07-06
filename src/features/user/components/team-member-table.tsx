"use client";

import { useUsersQuery } from "../queries/use-users-query";
import { UserRole } from "../types/user";

const roleLabel: Record<UserRole, string> = {
    [UserRole.OWNER]: "Owner",
    [UserRole.MANAGER]: "Manager",
    [UserRole.STAFF]: "Staff",
};

const roleBadgeClass: Record<UserRole, string> = {
    [UserRole.OWNER]: "bg-purple-100 text-purple-800 border border-purple-200",
    [UserRole.MANAGER]: "bg-blue-100 text-blue-800 border border-blue-200",
    [UserRole.STAFF]: "bg-gray-100 text-gray-700 border border-gray-200",
};

export function TeamMemberTable() {
    const { data, isLoading, error } = useUsersQuery({ page: 0, size: 50 });

    if (isLoading) {
        return <div className="p-4 text-sm text-gray-600">Loading team members...</div>;
    }

    if (error) {
        return <div className="p-4 text-sm text-danger">Failed to load team members.</div>;
    }

    return (
        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700">Role</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
                </thead>
                <tbody>
                {data?.content?.map((u) => (
                    <tr key={u.userId} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="p-3 text-sm text-gray-800">
                            {u.firstName} {u.lastName}
                        </td>
                        <td className="p-3 text-sm text-gray-800">{u.email}</td>
                        <td className="p-3">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${roleBadgeClass[u.role]}`}>
                                {roleLabel[u.role]}
                            </span>
                        </td>
                        <td className="p-3 text-sm">
                            <span className={u.active ? "text-green-600" : "text-gray-400"}>
                                {u.active ? "Active" : "Inactive"}
                            </span>
                        </td>
                    </tr>
                ))}

                {data?.empty && (
                    <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                            No team members yet.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
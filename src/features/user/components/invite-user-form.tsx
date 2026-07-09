"use client";

import { useState } from "react";
import { useInviteUser } from "../hooks/use-invite-user";
import { useCurrentUser } from "../hooks/use-current-user";
import { InviteUserRequest, UserRole } from "../types/user";

const initialForm: InviteUserRequest = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: UserRole.STAFF,
};

export function InviteUserForm() {
    const { inviteUser, isLoading } = useInviteUser();
    const { isOwner, isLoading: isLoadingUser } = useCurrentUser();
    const [form, setForm] = useState<InviteUserRequest>(initialForm);

    const handleChange = (field: keyof InviteUserRequest, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inviteUser(form);
            setForm(initialForm);
        } catch {
            // Error toast already handled in the mutation.
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
                <label className="form-label">First name</label>
                <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="form-input"
                />
            </div>

            <div>
                <label className="form-label">Last name</label>
                <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="form-input"
                />
            </div>

            <div>
                <label className="form-label">Email</label>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="form-input"
                />
            </div>

            <div>
                <label className="form-label">Phone</label>
                <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="form-input"
                    placeholder="e.g. 07XXXXXXXX"
                />
                <p className="mt-1 text-xs text-ink-muted">
                    Temporary login credentials will be sent to this number via SMS.
                </p>
            </div>

            <div>
                <label className="form-label">Role</label>
                <select
                    value={form.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="form-input"
                    disabled={isLoadingUser}
                >
                    <option value={UserRole.STAFF}>Staff</option>
                    {isOwner && <option value={UserRole.MANAGER}>Manager</option>}
                </select>
                <p className="mt-1 text-xs text-ink-muted">
                    {isOwner
                        ? "Managers can invite staff. Staff cannot invite anyone."
                        : "As a manager, you can invite staff-level users only."}
                </p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="btn-primary disabled:opacity-50"
            >
                {isLoading ? "Sending invite..." : "Send invite"}
            </button>
        </form>
    );
}
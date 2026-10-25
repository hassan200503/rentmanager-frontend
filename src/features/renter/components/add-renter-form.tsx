"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { useAddRenterMutation } from "../hooks/use-renters";
import { isValidMpesaPhone } from "@/lib/mpesa/phone";
import type { Renter } from "../types/renter";

/**
 * Records a tenant the landlord already has.
 *
 * Phone is the only required contact: many renters have no email, and
 * demanding one would push landlords into inventing addresses. Email is worth
 * asking for when it exists, because it is what lets the renter sign in later
 * and see their own rent — so the field says so instead of just "optional".
 */
export function AddRenterForm({ onAdded }: { onAdded?: (renter: Renter) => void }) {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const mutation = useAddRenterMutation();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError(null);
        if (!isValidMpesaPhone(phone)) {
            setPhoneError("Enter a valid M-Pesa number: 0712345678, 0112345678, or +254712345678");
            return;
        }
        const renter = await mutation.mutateAsync({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
            nationalId: nationalId.trim() || undefined,
        });
        setFullName("");
        setPhone("");
        setEmail("");
        setNationalId("");
        onAdded?.(renter);
    };

    const canSubmit = fullName.trim().length > 0 && phone.trim().length > 0 && !mutation.isPending;

    return (
        <form onSubmit={submit} className="card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1.5">
                    <span className="form-label">
                        Full name <span className="text-danger">*</span>
                    </span>
                    <input
                        className="form-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Amina Wanjiru"
                        maxLength={255}
                        required
                    />
                </label>

                <label className="space-y-1.5">
                    <span className="form-label">
                        Phone <span className="text-danger">*</span>
                    </span>
                    <input
                        className="form-input font-mono-nums"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0712345678"
                        inputMode="tel"
                        required
                    />
                    {phoneError ? (
                        <span className="text-xs text-danger">{phoneError}</span>
                    ) : (
                        <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                            The number rent reminders and M-Pesa prompts go to.
                        </span>
                    )}
                </label>

                <label className="space-y-1.5">
                    <span className="form-label">Email</span>
                    <input
                        className="form-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="optional"
                        maxLength={255}
                    />
                    <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        With an email, this tenant can sign in and see their own rent and receipts.
                    </span>
                </label>

                <label className="space-y-1.5">
                    <span className="form-label">ID number</span>
                    <input
                        className="form-input font-mono-nums"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        placeholder="optional"
                        maxLength={50}
                    />
                </label>
            </div>

            <button type="submit" disabled={!canSubmit} className="btn-primary disabled:opacity-50">
                {mutation.isPending ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Add renter
                    </span>
                )}
            </button>
        </form>
    );
}

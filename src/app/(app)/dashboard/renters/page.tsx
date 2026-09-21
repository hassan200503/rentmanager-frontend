"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Plus, Search, Users } from "lucide-react";
import { AddRenterForm } from "@/features/renter/components/add-renter-form";
import { useRentersQuery } from "@/features/renter/hooks/use-renters";
import { useHasRole } from "@/features/user/hooks/use-has-role";
import { WRITE_ROLES } from "@/features/user/lib/roles";

/**
 * The landlord's renters.
 *
 * This page is why it exists: until now a landlord could add properties and
 * units, then had nowhere to enter the tenants already living in them — the
 * lease form asked for a renter id that nothing in the product ever produced.
 */
export default function RentersPage() {
    const [query, setQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const canWrite = useHasRole(WRITE_ROLES);
    const rentersQuery = useRentersQuery();

    const renters = rentersQuery.data?.content ?? [];
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return renters;
        return renters.filter(
            (r) =>
                r.fullName.toLowerCase().includes(q) ||
                r.phone.includes(q) ||
                (r.email ?? "").toLowerCase().includes(q)
        );
    }, [renters, query]);

    return (
        <div className="page-container">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="page-title mb-1">Renters</h1>
                    <p className="page-subtitle mb-0">
                        Everyone renting from you. Add the tenants you already have, then put them on a lease.
                    </p>
                </div>
                {canWrite && (
                    <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
                        <span className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> {showForm ? "Close" : "Add renter"}
                        </span>
                    </button>
                )}
            </div>

            {showForm && canWrite && (
                <div className="mb-6">
                    <AddRenterForm onAdded={() => setShowForm(false)} />
                </div>
            )}

            <div className="relative mb-4 max-w-sm">
                <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle dark:text-fg-subtle-dark"
                    strokeWidth={2}
                />
                <input
                    className="form-input !pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, phone or email"
                    aria-label="Search renters"
                />
            </div>

            {rentersQuery.isLoading ? (
                <div className="card flex items-center justify-center gap-2 py-10 text-sm text-fg-muted dark:text-fg-muted-dark">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading renters…
                </div>
            ) : rentersQuery.error ? (
                <div className="card py-10 text-center" role="alert">
                    <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-danger" strokeWidth={2} />
                    <p className="mb-1 text-sm font-medium text-fg dark:text-fg-dark">Couldn&apos;t load your renters</p>
                    <p className="mb-4 text-xs text-fg-muted dark:text-fg-muted-dark">Please try again in a moment.</p>
                    <button type="button" onClick={() => void rentersQuery.refetch()} className="btn-outline mx-auto">
                        Retry
                    </button>
                </div>
            ) : renters.length === 0 ? (
                <div className="card py-12 text-center">
                    <Users className="mx-auto mb-3 h-6 w-6 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.75} />
                    <p className="mb-1 text-sm font-medium text-fg dark:text-fg-dark">No renters yet</p>
                    <p className="mx-auto max-w-sm text-xs text-fg-muted dark:text-fg-muted-dark">
                        Add the tenants already living in your units. You only need a name and a phone number; a lease
                        and rent records come next.
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card py-10 text-center text-sm text-fg-muted dark:text-fg-muted-dark">
                    No renter matches “{query}”.
                </div>
            ) : (
                <div className="card overflow-x-auto !p-0">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border dark:border-border-dark">
                            <tr className="text-left text-xs text-fg-muted dark:text-fg-muted-dark">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Phone</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Portal access</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((renter) => (
                                <tr key={renter.id} className="border-b border-border-subtle dark:border-border-subtle-dark last:border-0">
                                    <td className="px-4 py-3 font-medium text-fg dark:text-fg-dark">{renter.fullName}</td>
                                    <td className="px-4 py-3 font-mono-nums">{renter.phone}</td>
                                    <td className="px-4 py-3 text-fg-muted dark:text-fg-muted-dark">
                                        {renter.email ?? "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {renter.hasAccount ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-success">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Signed up
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark"
                                                title={
                                                    renter.email
                                                        ? "They get access automatically the first time they sign in with this email."
                                                        : "Add their email so they can sign in and see their rent."
                                                }
                                            >
                                                <Clock className="h-3.5 w-3.5" />
                                                {renter.email ? "Invited by email" : "No account"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

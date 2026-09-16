"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Check,
    ChevronRight,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Phone,
    RefreshCw,
    ShieldCheck,
    TriangleAlert,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { useLandlordProfileQuery, useUpdateTenantProfileMutation } from "@/features/settings/hooks/use-tenant-settings-query";

// ──────────────────────────────────────────────────────────────────
// Avatar
// ──────────────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
    return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-xl font-bold tracking-tight text-white shadow-md ring-4 ring-brand/10">
            {initials}
        </div>
    );
}

function initials(first: string, last: string, email: string): string {
    if (first || last) {
        return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || "?";
    }
    return (email || "?").slice(0, 2).toUpperCase();
}

// ──────────────────────────────────────────────────────────────────
// Name editor
// ──────────────────────────────────────────────────────────────────

function NameSection({ clerkFirstName, clerkLastName }: { clerkFirstName: string; clerkLastName: string }) {
    const { user: clerkUser, isLoaded } = useUser();
    const profileMutation = useUpdateTenantProfileMutation();
    const [editing, setEditing] = useState(false);
    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [saving, setSaving] = useState(false);

    const startEditing = () => {
        setFirst(clerkFirstName);
        setLast(clerkLastName);
        setEditing(true);
    };

    const dirty = first !== clerkFirstName || last !== clerkLastName;

    const save = async () => {
        if (!clerkUser || !isLoaded) return;
        setSaving(true);
        try {
            const fullName = [first.trim(), last.trim()].filter(Boolean).join(" ");
            await Promise.all([
                clerkUser.update({ firstName: first.trim(), lastName: last.trim() }),
                fullName ? profileMutation.mutateAsync({ name: fullName }) : Promise.resolve(),
            ]);
            toast.success("Name updated.");
            setEditing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update name.");
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border dark:border-border-dark">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-0.5">Name</p>
                    <p className="text-sm font-medium text-fg dark:text-fg-dark">
                        {[clerkFirstName, clerkLastName].filter(Boolean).join(" ") || <span className="text-fg-muted dark:text-fg-muted-dark italic">Not set</span>}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark border border-border dark:border-border-dark hover:border-brand/40 dark:hover:border-brand/40 transition-all"
                >
                    <Pencil className="h-3 w-3" strokeWidth={2} />
                    Edit
                </button>
            </div>
        );
    }

    return (
        <div className="py-3 border-b border-border dark:border-border-dark space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Name</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="form-label">First name</label>
                    <input
                        value={first}
                        onChange={(e) => setFirst(e.target.value)}
                        placeholder="First name"
                        className="form-input"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="form-label">Last name</label>
                    <input
                        value={last}
                        onChange={(e) => setLast(e.target.value)}
                        placeholder="Last name"
                        className="form-input"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving || !dirty}
                    className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    Save name
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary inline-flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// OTP email-change flow
// ──────────────────────────────────────────────────────────────────

type EmailStep = "idle" | "new-email" | "verify" | "done";

interface EmailFlowState {
    step: EmailStep;
    newEmail: string;
    code: string;
    error: string | null;
    busy: boolean;
}

const EMAIL_FLOW_INIT: EmailFlowState = {
    step: "idle",
    newEmail: "",
    code: "",
    error: null,
    busy: false,
};

function EmailSection({ currentEmail }: { currentEmail: string }) {
    const { user: clerkUser, isLoaded } = useUser();
    const profileMutation = useUpdateTenantProfileMutation();
    const [flow, setFlow] = useState<EmailFlowState>(EMAIL_FLOW_INIT);
    const pendingEmailRef = useRef<{ id: string } | null>(null);

    const isPlaceholder = !currentEmail || currentEmail === "unknown@clerk.user";
    const displayEmail = isPlaceholder ? "—" : currentEmail;

    const patch = (partial: Partial<EmailFlowState>) =>
        setFlow((prev) => ({ ...prev, ...partial }));

    const reset = () => {
        pendingEmailRef.current = null;
        setFlow(EMAIL_FLOW_INIT);
    };

    const sendOtp = async () => {
        if (!clerkUser || !isLoaded) return;
        patch({ busy: true, error: null });
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const emailAddr = await (clerkUser as any).createEmailAddress({ email: flow.newEmail.trim() });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (emailAddr as any).prepareVerification({ strategy: "email_code" });
            pendingEmailRef.current = emailAddr;
            patch({ step: "verify", busy: false });
        } catch (err) {
            patch({ busy: false, error: err instanceof Error ? err.message : "Failed to send code." });
        }
    };

    const verifyOtp = async () => {
        if (!clerkUser || !isLoaded || !pendingEmailRef.current) return;
        patch({ busy: true, error: null });
        try {
            const emailAddr = pendingEmailRef.current as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            await emailAddr.attemptVerification({ code: flow.code.trim() });
            await (clerkUser as any).update({ primaryEmailAddressId: emailAddr.id }); // eslint-disable-line @typescript-eslint/no-explicit-any
            // Also sync the verified email to the backend landlord profile so
            // renters see it on the tenant portal (landlordEmail field).
            await profileMutation.mutateAsync({ email: flow.newEmail.trim() });
            toast.success("Email updated. Renters will now see your new address.");
            patch({ step: "done", busy: false });
            pendingEmailRef.current = null;
        } catch (err) {
            patch({ busy: false, error: err instanceof Error ? err.message : "Invalid code — check your email and try again." });
        }
    };

    return (
        <div className="py-3 border-b border-border dark:border-border-dark space-y-3">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-0.5">Email</p>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">{displayEmail}</p>
                        {!isPlaceholder && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                                <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
                                Verified
                            </span>
                        )}
                        {isPlaceholder && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                                <TriangleAlert className="h-2.5 w-2.5" strokeWidth={2.5} />
                                Not set
                            </span>
                        )}
                    </div>
                </div>
                {flow.step === "idle" && (
                    <button
                        type="button"
                        onClick={() => patch({ step: "new-email" })}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark border border-border dark:border-border-dark hover:border-brand/40 dark:hover:border-brand/40 transition-all"
                    >
                        <Pencil className="h-3 w-3" strokeWidth={2} />
                        Change
                    </button>
                )}
            </div>

            {flow.step === "new-email" && (
                <div className="rounded-xl border border-brand/20 dark:border-brand/30 bg-brand-50/40 dark:bg-brand-900/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">1</span>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Enter new email address</p>
                    </div>
                    <input
                        type="email"
                        autoFocus
                        value={flow.newEmail}
                        onChange={(e) => patch({ newEmail: e.target.value, error: null })}
                        onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                        placeholder="new@example.com"
                        className="form-input"
                    />
                    {flow.error && <p className="text-xs text-danger">{flow.error}</p>}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={sendOtp}
                            disabled={flow.busy || !flow.newEmail.includes("@")}
                            className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {flow.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />}
                            Send verification code
                        </button>
                        <button type="button" onClick={reset} className="btn-secondary text-xs">Cancel</button>
                    </div>
                </div>
            )}

            {flow.step === "verify" && (
                <div className="rounded-xl border border-brand/20 dark:border-brand/30 bg-brand-50/40 dark:bg-brand-900/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">2</span>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Enter the 6-digit code</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark px-3 py-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            Code sent to <span className="font-semibold text-fg dark:text-fg-dark">{flow.newEmail}</span>
                        </p>
                    </div>
                    <input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        maxLength={6}
                        value={flow.code}
                        onChange={(e) => patch({ code: e.target.value.replace(/\D/g, ""), error: null })}
                        onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                        placeholder="123456"
                        className="form-input font-mono tracking-widest text-lg text-center max-w-[12rem]"
                    />
                    {flow.error && <p className="text-xs text-danger">{flow.error}</p>}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={verifyOtp}
                            disabled={flow.busy || flow.code.length < 6}
                            className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {flow.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                            Verify & save
                        </button>
                        <button type="button" onClick={() => patch({ step: "new-email", code: "", error: null })} className="btn-secondary text-xs">Back</button>
                        <button type="button" onClick={reset} className="text-xs text-fg-muted dark:text-fg-muted-dark underline underline-offset-2">Cancel</button>
                    </div>
                </div>
            )}

            {flow.step === "done" && (
                <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Email updated</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Your new address is now your primary login and visible to renters.</p>
                    </div>
                    <button type="button" onClick={reset} className="ml-auto text-xs text-fg-muted dark:text-fg-muted-dark underline underline-offset-2">Dismiss</button>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// Contact phone section
// ──────────────────────────────────────────────────────────────────

function PhoneSection({ currentPhone }: { currentPhone: string | null }) {
    const profileMutation = useUpdateTenantProfileMutation();
    const [editing, setEditing] = useState(false);
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    const startEditing = () => {
        setPhone(currentPhone ?? "");
        setEditing(true);
    };

    const dirty = phone !== (currentPhone ?? "");

    const save = async () => {
        setSaving(true);
        try {
            await profileMutation.mutateAsync({ phoneNumber: phone.trim() || null });
            toast.success("Contact phone updated. Renters will see the new number.");
            setEditing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update phone.");
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border dark:border-border-dark">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-0.5">
                        Contact Phone
                    </p>
                    <div className="flex items-center gap-2">
                        {currentPhone ? (
                            <p className="text-sm font-medium text-fg dark:text-fg-dark">{currentPhone}</p>
                        ) : (
                            <p className="text-sm text-fg-muted dark:text-fg-muted-dark italic">Not set</p>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/8 dark:bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand dark:text-brand-300">
                            <Phone className="h-2.5 w-2.5" strokeWidth={2.5} />
                            Shown to renters
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark border border-border dark:border-border-dark hover:border-brand/40 dark:hover:border-brand/40 transition-all"
                >
                    <Pencil className="h-3 w-3" strokeWidth={2} />
                    {currentPhone ? "Edit" : "Add"}
                </button>
            </div>
        );
    }

    return (
        <div className="py-3 border-b border-border dark:border-border-dark space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Contact Phone</p>
            <input
                type="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="e.g. 0712 345 678"
                className="form-input"
            />
            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">
                Shown to your renters on the tenant portal as your contact number. Leave blank to hide.
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving || !dirty}
                    className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    Save phone
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary inline-flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// Address section
// ──────────────────────────────────────────────────────────────────

function AddressSection({ currentAddress }: { currentAddress: string | null }) {
    const profileMutation = useUpdateTenantProfileMutation();
    const [editing, setEditing] = useState(false);
    const [address, setAddress] = useState("");
    const [saving, setSaving] = useState(false);

    const startEditing = () => {
        setAddress(currentAddress ?? "");
        setEditing(true);
    };

    const dirty = address !== (currentAddress ?? "");

    const save = async () => {
        setSaving(true);
        try {
            await profileMutation.mutateAsync({ address: address.trim() || null });
            toast.success("Address updated. Renters will see the new address.");
            setEditing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update address.");
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border dark:border-border-dark">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark mb-0.5">
                        Business Address
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {currentAddress ? (
                            <p className="text-sm font-medium text-fg dark:text-fg-dark break-words">{currentAddress}</p>
                        ) : (
                            <p className="text-sm text-fg-muted dark:text-fg-muted-dark italic">Not set</p>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/8 dark:bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand dark:text-brand-300 shrink-0">
                            <MapPin className="h-2.5 w-2.5" strokeWidth={2.5} />
                            Shown to renters
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={startEditing}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark border border-border dark:border-border-dark hover:border-brand/40 dark:hover:border-brand/40 transition-all"
                >
                    <Pencil className="h-3 w-3" strokeWidth={2} />
                    {currentAddress ? "Edit" : "Add"}
                </button>
            </div>
        );
    }

    return (
        <div className="py-3 border-b border-border dark:border-border-dark space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Business Address</p>
            <textarea
                autoFocus
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Westlands, Nairobi, Kenya"
                className="form-input resize-none"
            />
            <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">
                Shown to your renters on the tenant portal as your business address. Leave blank to hide.
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving || !dirty}
                    className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    Save address
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary inline-flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// Stale-profile sync banner
// Shown when Clerk has a newer name or email than the backend record.
// One-click push; disappears immediately on success.
// ──────────────────────────────────────────────────────────────────

function SyncBanner({
    clerkName,
    clerkEmail,
    backendName,
    backendEmail,
}: {
    clerkName: string;
    clerkEmail: string;
    backendName: string;
    backendEmail: string;
}) {
    const profileMutation = useUpdateTenantProfileMutation();
    const [syncing, setSyncing] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const nameMismatch = clerkName && clerkName !== backendName;
    const emailMismatch = clerkEmail && clerkEmail !== "unknown@clerk.user" && clerkEmail !== backendEmail;

    if (dismissed || (!nameMismatch && !emailMismatch)) return null;

    const sync = async () => {
        setSyncing(true);
        try {
            const payload: { name?: string; email?: string } = {};
            if (nameMismatch) payload.name = clerkName;
            if (emailMismatch) payload.email = clerkEmail;
            await profileMutation.mutateAsync(payload);
            toast.success("Renter-facing profile updated.");
            setDismissed(true);
        } catch {
            toast.error("Could not sync profile — try again.");
        } finally {
            setSyncing(false);
        }
    };

    const lines: string[] = [];
    if (nameMismatch) lines.push(`name is "${backendName}" on renter portal`);
    if (emailMismatch) lines.push(`email is "${backendEmail}" on renter portal`);

    return (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 dark:bg-warning/8 px-4 py-3">
            <TriangleAlert className="h-4 w-4 shrink-0 text-warning mt-0.5" strokeWidth={2} />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-fg dark:text-fg-dark">Renter portal is out of sync</p>
                <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark mt-0.5">
                    Your renters currently see your {lines.join(" and ")}. Sync to push your current details.
                </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    onClick={sync}
                    disabled={syncing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-white hover:bg-warning/90 disabled:opacity-60 transition-all"
                >
                    {syncing ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> : <RefreshCw className="h-3 w-3" strokeWidth={2} />}
                    Sync now
                </button>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="text-[11px] text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark underline underline-offset-2"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// Main card
// ──────────────────────────────────────────────────────────────────

export function AccountCard() {
    const { user: clerkUser, isLoaded } = useUser();
    const { user: backendUser, isLoading } = useCurrentUser();
    const { data: landlordProfile, isLoading: isProfileLoading } = useLandlordProfileQuery();
    const profileMutation = useUpdateTenantProfileMutation();
    // Track whether we've already attempted the background auto-sync this session
    const autoSyncFiredRef = useRef(false);

    const firstName  = clerkUser?.firstName  ?? backendUser?.firstName  ?? "";
    const lastName   = clerkUser?.lastName   ?? backendUser?.lastName   ?? "";
    const email      = clerkUser?.primaryEmailAddress?.emailAddress ?? backendUser?.email ?? "";
    const clerkFullName = [firstName, lastName].filter(Boolean).join(" ");

    // Auto-sync once per session: push the current Clerk name and email to the
    // backend silently if both sides are loaded and they differ. This fixes the
    // "user saved name in Clerk before the PATCH endpoint existed" case without
    // requiring the user to click anything.
    useEffect(() => {
        if (autoSyncFiredRef.current) return;
        if (!isLoaded || isLoading || isProfileLoading) return;
        if (!landlordProfile) return;

        const nameMismatch = clerkFullName && clerkFullName !== landlordProfile.name;
        const emailMismatch =
            email &&
            email !== "unknown@clerk.user" &&
            email !== landlordProfile.email;

        if (!nameMismatch && !emailMismatch) return;

        autoSyncFiredRef.current = true;
        const payload: { name?: string; email?: string } = {};
        if (nameMismatch) payload.name = clerkFullName;
        if (emailMismatch) payload.email = email;
        profileMutation.mutate(payload);
    }, [isLoaded, isLoading, isProfileLoading, landlordProfile, clerkFullName, email, profileMutation]);

    if (isLoading || isProfileLoading || !isLoaded) {
        return (
            <div className="card animate-fade-in-up space-y-4">
                <div className="flex items-center gap-4">
                    <div className="skeleton h-16 w-16 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                        <div className="skeleton h-5 w-36" />
                        <div className="skeleton h-4 w-52" />
                    </div>
                </div>
                <div className="skeleton h-32" />
            </div>
        );
    }

    const avatarInitials = initials(firstName, lastName, email);
    const displayName = clerkFullName || "";

    return (
        <div className="card animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-border dark:border-border-dark">
                <Avatar initials={avatarInitials} />
                <div className="min-w-0">
                    <p className="text-base font-semibold text-fg dark:text-fg-dark truncate">
                        {displayName || <span className="text-fg-muted dark:text-fg-muted-dark italic">No name set</span>}
                    </p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark truncate">
                        {email === "unknown@clerk.user" ? "Email not yet synced" : email}
                    </p>
                </div>
            </div>

            {/* Fields */}
            <div className="mt-1">
                <NameSection clerkFirstName={firstName} clerkLastName={lastName} />
                <EmailSection currentEmail={email} />
                <PhoneSection currentPhone={landlordProfile?.phoneNumber ?? null} />
                <AddressSection currentAddress={landlordProfile?.address ?? null} />
            </div>

            {/* Out-of-sync banner (fallback for cases auto-sync can't handle) */}
            {landlordProfile && (
                <SyncBanner
                    clerkName={clerkFullName}
                    clerkEmail={email}
                    backendName={landlordProfile.name ?? ""}
                    backendEmail={landlordProfile.email ?? ""}
                />
            )}
        </div>
    );
}

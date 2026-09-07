"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Check,
    ChevronRight,
    Loader2,
    Mail,
    Pencil,
    ShieldCheck,
    TriangleAlert,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

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
    const [editing, setEditing] = useState(false);
    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [saving, setSaving] = useState(false);

    // Initialise editable copies from Clerk values at the moment the user
    // opens the form — not via useEffect, which would trigger cascading renders.
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
            await clerkUser.update({ firstName: first.trim(), lastName: last.trim() });
            toast.success("Name updated.");
            setEditing(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update name.");
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setEditing(false);
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
                <button type="button" onClick={cancel} className="btn-secondary inline-flex items-center gap-1.5">
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
    const [flow, setFlow] = useState<EmailFlowState>(EMAIL_FLOW_INIT);
    // Holds the Clerk EmailAddress object across async steps
    const pendingEmailRef = useRef<{ id: string } | null>(null);

    const isPlaceholder = !currentEmail || currentEmail === "unknown@clerk.user";
    const displayEmail = isPlaceholder ? "—" : currentEmail;

    const patch = (partial: Partial<EmailFlowState>) =>
        setFlow((prev) => ({ ...prev, ...partial }));

    const reset = () => {
        pendingEmailRef.current = null;
        setFlow(EMAIL_FLOW_INIT);
    };

    // Step 1 → 2: add new email and send OTP
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

    // Step 2 → done: verify OTP, set as primary
    const verifyOtp = async () => {
        if (!clerkUser || !isLoaded || !pendingEmailRef.current) return;
        patch({ busy: true, error: null });
        try {
            const emailAddr = pendingEmailRef.current as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            await emailAddr.attemptVerification({ code: flow.code.trim() });
            await (clerkUser as any).update({ primaryEmailAddressId: emailAddr.id }); // eslint-disable-line @typescript-eslint/no-explicit-any
            toast.success("Email updated. You may need to sign in again.");
            patch({ step: "done", busy: false });
            pendingEmailRef.current = null;
        } catch (err) {
            patch({ busy: false, error: err instanceof Error ? err.message : "Invalid code — check your email and try again." });
        }
    };

    return (
        <div className="py-3 space-y-3">
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

            {/* Step: new-email */}
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

            {/* Step: verify OTP */}
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

            {/* Step: done */}
            {flow.step === "done" && (
                <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Email updated</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Your new address is now your primary login.</p>
                    </div>
                    <button type="button" onClick={reset} className="ml-auto text-xs text-fg-muted dark:text-fg-muted-dark underline underline-offset-2">Dismiss</button>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────
// Main card
// ──────────────────────────────────────────────────────────────────

export function AccountCard() {
    const { user: clerkUser, isLoaded } = useUser();
    const { user: backendUser, isLoading } = useCurrentUser();

    const firstName  = clerkUser?.firstName  ?? backendUser?.firstName  ?? "";
    const lastName   = clerkUser?.lastName   ?? backendUser?.lastName   ?? "";
    const email      = clerkUser?.primaryEmailAddress?.emailAddress ?? backendUser?.email ?? "";

    if (isLoading || !isLoaded) {
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
    const displayName = [firstName, lastName].filter(Boolean).join(" ");

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
            </div>
        </div>
    );
}

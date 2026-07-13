"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Smartphone,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Save,
    Loader2,
    Pencil,
    ChevronRight,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";
import { ConfigureDarajaCredentialsRequest } from "@/features/daraja/types/daraja-types";
import { useConfigureDarajaMutation } from "@/features/daraja/queries/use-configure-daraja-mutation";

// FIXED: stray leading space in the import path was breaking module resolution
// ("/ use-daraja-status-query" instead of "/use-daraja-status-query"). Bug, not
// a style change.
import { useDarajaStatusQuery } from "@/features/daraja/queries/ use-daraja-status-query";

type FormState = ConfigureDarajaCredentialsRequest;

const EMPTY_FORM: FormState = {
    consumerKey: "",
    consumerSecret: "",
    businessShortCode: "",
    passkey: "",
};

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.consumerKey.trim()) errors.consumerKey = "Consumer key is required";
    if (!form.consumerSecret.trim()) errors.consumerSecret = "Consumer secret is required";
    if (!form.businessShortCode.trim()) {
        errors.businessShortCode = "Shortcode is required";
    } else if (!/^\d{4,7}$/.test(form.businessShortCode.trim())) {
        errors.businessShortCode = "Shortcode should be a 4-7 digit paybill/till number";
    }
    if (!form.passkey.trim()) errors.passkey = "Passkey is required";
    return errors;
}

// Persistent header rendered across every state of this page (loading,
// permission-denied, error, onboarding, configured, editing) -- previously
// none of those states had any navigation chrome at all, so there was no
// way back to the dashboard except the browser back button.
function PageHeader() {
    return (
        <div className="mb-6 animate-fade-in-up">
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to dashboard
            </Link>
            <div className="flex items-start gap-3">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                    <Smartphone className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="page-title mb-1">M-Pesa configuration</h1>
                    <p className="page-subtitle mb-0">Manage your Daraja credentials for accepting rent payments.</p>
                </div>
            </div>
        </div>
    );
}

// No shared LoadingSkeleton / PermissionDeniedState components exist in this
// codebase (confirmed - grepped the repo, nothing matches). Other
// OWNER-gated UI (invite-user-form.tsx) doesn't gate whole pages either, it
// just conditionally hides pieces. So these are minimal inline states local
// to this file rather than invented shared components. Swap for real shared
// components later if/when this pattern gets used in more than one place.
// (Visual treatment below brought in line with the dashboard page's own
// InlinePermissionDenied so the copy/layout at least *reads* the same,
// without actually extracting a shared component.)
function InlineLoading() {
    return (
        <div className="page-container max-w-xl">
            <PageHeader />
            <div className="card flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Loading…
            </div>
        </div>
    );
}

function InlinePermissionDenied() {
    return (
        <div className="page-container max-w-xl">
            <PageHeader />
            <div className="card text-center py-10">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                    <ShieldCheck className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-ink mb-1">Restricted page</p>
                <p className="text-sm text-ink-muted">
                    You don&#39;t have permission to view this page. Ask an account owner for access.
                </p>
            </div>
        </div>
    );
}

export default function DarajaConfigPage() {
    // Confirmed: UserResponse.tenantId is a plain string (src/features/user/types/user.ts)
    const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();

    if (isUserLoading) return <InlineLoading />;
    if (!isOwner) return <InlinePermissionDenied />;
    if (!user?.tenantId) return <InlineLoading />;

    return <DarajaConfigPageContent tenantId={user.tenantId} />;
}

// Split so hooks below only run once we know we have a tenantId and the
// user is confirmed OWNER — keeps the rules-of-hooks ordering clean above.
function DarajaConfigPageContent({ tenantId }: { tenantId: string }) {
    const statusQuery = useDarajaStatusQuery(tenantId);
    const mutation = useConfigureDarajaMutation(tenantId);

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [showSecrets, setShowSecrets] = useState(false);

    if (statusQuery.isLoading) {
        return <InlineLoading />;
    }

    if (statusQuery.isError) {
        return (
            <div className="page-container max-w-xl">
                <PageHeader />
                <div className="card border-danger/20 bg-danger/[0.03] text-center py-10">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load your M-Pesa configuration status</p>
                    <p className="text-xs text-ink-muted mb-4">Please refresh the page. If this keeps happening, contact support.</p>
                    <button onClick={() => window.location.reload()} className="btn-outline mx-auto">
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    const isConfigured = statusQuery.data?.configured ?? false;

    function handleFieldChange(field: keyof FormState, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    function handleCancel() {
        setForm(EMPTY_FORM);
        setFieldErrors({});
        setMode("view");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errors = validate(form);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        try {
            await mutation.mutateAsync(form);
            toast.success("M-Pesa configuration updated successfully");
            setForm(EMPTY_FORM);
            setFieldErrors({});
            setMode("view");
        } catch (err) {
            toast.error(getProcessErrorMessage(err, "Couldn't update M-Pesa configuration"));
        }
    }

    // ---------------------------------------------------------------
    // NOT YET CONFIGURED — onboarding state
    // ---------------------------------------------------------------
    if (!isConfigured && mode === "view") {
        return (
            <div className="page-container max-w-xl">
                <PageHeader />
                <div className="card text-center py-10 animate-fade-in-up">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink/[0.05]">
                        <Smartphone className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                    </div>
                    <h2 className="text-lg font-semibold text-ink">Set up M-Pesa</h2>
                    <p className="mt-2 text-sm text-ink-muted max-w-sm mx-auto">
                        Connect your Daraja (M-Pesa) credentials to start accepting reservation
                        payments directly to your paybill or till number.
                    </p>
                    <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className="btn-primary mt-6 inline-flex items-center gap-1.5"
                    >
                        Set up M-Pesa
                        <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------
    // CONFIGURED — view mode
    // ---------------------------------------------------------------
    // Note: there is no "last updated by / at" data available — the backend
    // status endpoint returns only `{ configured: boolean }`. That field from
    // the original spec can't be surfaced until/unless the backend response
    // is extended to include it.
    if (isConfigured && mode === "view") {
        return (
            <div className="page-container max-w-xl">
                <PageHeader />
                <div className="card animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-ink">M-Pesa (Daraja)</h2>
                            <p className="mt-1 text-sm text-ink-muted">
                                Your M-Pesa credentials are configured.
                            </p>
                        </div>
                        <span className="pill pill-success inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                            Configured
                        </span>
                    </div>

                    <div className="mt-6 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-ink/[0.08] pb-2">
                            <span className="text-ink-muted">Consumer key</span>
                            <span className="font-mono text-ink">••••••••</span>
                        </div>
                        <div className="flex justify-between border-b border-ink/[0.08] pb-2">
                            <span className="text-ink-muted">Consumer secret</span>
                            <span className="font-mono text-ink">••••••••</span>
                        </div>
                        <div className="flex justify-between border-b border-ink/[0.08] pb-2">
                            <span className="text-ink-muted">Shortcode</span>
                            <span className="font-mono text-ink">••••••••</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <span className="text-ink-muted">Passkey</span>
                            <span className="font-mono text-ink">••••••••</span>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-ink-muted">
                        For security, stored credentials are never displayed — the backend
                        doesn&#39;t return them once saved. To change them, update below.
                    </p>

                    <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className="btn-secondary mt-6 inline-flex items-center gap-1.5"
                    >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Update credentials
                    </button>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------
    // EDITING — form (used for both first-time setup and updates)
    // ---------------------------------------------------------------
    return (
        <div className="page-container max-w-xl">
            <PageHeader />
            <div className="card animate-fade-in-up">
                <h2 className="text-lg font-semibold text-ink">
                    {isConfigured ? "Update M-Pesa credentials" : "Set up M-Pesa"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                    These are used to authenticate STK Push requests to your own Till or
                    Paybill. They&#39;re encrypted at rest and never shown again once saved.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <FormField
                        label="Consumer Key"
                        value={form.consumerKey}
                        onChange={(v) => handleFieldChange("consumerKey", v)}
                        error={fieldErrors.consumerKey}
                        secret={false}
                    />
                    <FormField
                        label="Consumer Secret"
                        value={form.consumerSecret}
                        onChange={(v) => handleFieldChange("consumerSecret", v)}
                        error={fieldErrors.consumerSecret}
                        secret
                        showSecrets={showSecrets}
                        onToggleShowSecrets={() => setShowSecrets((s) => !s)}
                    />
                    <FormField
                        label="Business Shortcode (Paybill/Till)"
                        value={form.businessShortCode}
                        onChange={(v) => handleFieldChange("businessShortCode", v)}
                        error={fieldErrors.businessShortCode}
                        secret={false}
                    />
                    <FormField
                        label="Passkey"
                        value={form.passkey}
                        onChange={(v) => handleFieldChange("passkey", v)}
                        error={fieldErrors.passkey}
                        secret
                        showSecrets={showSecrets}
                        onToggleShowSecrets={() => setShowSecrets((s) => !s)}
                    />

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                            ) : (
                                <Save className="h-4 w-4" strokeWidth={2} />
                            )}
                            {mutation.isPending ? "Saving…" : "Save"}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={mutation.isPending}
                            className="btn-secondary disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormField({
                       label,
                       value,
                       onChange,
                       error,
                       secret,
                       showSecrets,
                       onToggleShowSecrets,
                   }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    secret: boolean;
    showSecrets?: boolean;
    onToggleShowSecrets?: () => void;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
            <div className="relative">
                <input
                    type={secret && !showSecrets ? "password" : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete="off"
                    className={`form-input w-full text-sm ${secret ? "pr-10" : ""} ${error ? "border-danger" : ""}`}
                />
                {secret && (
                    <button
                        type="button"
                        onClick={onToggleShowSecrets}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                        aria-label={showSecrets ? "Hide value" : "Show value"}
                    >
                        {showSecrets ? (
                            <EyeOff className="h-4 w-4" strokeWidth={2} />
                        ) : (
                            <Eye className="h-4 w-4" strokeWidth={2} />
                        )}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
    );
}
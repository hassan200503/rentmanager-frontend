// features/daraja/components/daraja-config-card.tsx
"use client";

import { useState } from "react";
import {
    Smartphone,
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Save,
    Loader2,
    Pencil,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";
import { ConfigureDarajaCredentialsRequest } from "@/features/daraja/types/daraja-types";
import { useConfigureDarajaMutation } from "@/features/daraja/queries/use-configure-daraja-mutation";
import { useDarajaStatusQuery } from "@/features/daraja/queries/use-daraja-status-query";

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

function CardHeader() {
    return (
        <div>
            <h2 className="section-header inline-flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-brand" strokeWidth={2} />
                M-Pesa
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                Manage your Daraja credentials for accepting rent payments.
            </p>
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
            <label className="form-label">{label}</label>
            <div className="relative">
                <input
                    type={secret && !showSecrets ? "password" : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete="off"
                    className={`form-input w-full text-sm ${secret ? "pr-10" : ""} ${error ? "!border-danger" : ""}`}
                />
                {secret && (
                    <button
                        type="button"
                        onClick={onToggleShowSecrets}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
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

export function DarajaConfigCard({ tenantId }: { tenantId: string }) {
    const statusQuery = useDarajaStatusQuery(tenantId);
    const mutation = useConfigureDarajaMutation(tenantId);

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [showSecrets, setShowSecrets] = useState(false);

    if (statusQuery.isLoading) {
        return (
            <div className="card animate-fade-in-up">
                <CardHeader />
                <div className="skeleton h-24 mt-4" />
            </div>
        );
    }

    if (statusQuery.isError) {
        return (
            <div className="card animate-fade-in-up">
                <CardHeader />
                <div className="mt-4 flex flex-col items-center rounded-lg border border-danger/20 bg-danger-bg/40 dark:bg-danger-bg-dark/40 px-4 py-6 text-center">
                    <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={2} />
                    <p className="mt-2 text-sm font-medium text-fg dark:text-fg-dark">
                        Couldn&#39;t load your M-Pesa configuration status
                    </p>
                    <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark">
                        Please try again. If this keeps happening, contact support.
                    </p>
                    <button onClick={() => statusQuery.refetch()} className="btn-outline mt-4">
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

    if (!isConfigured && mode === "view") {
        return (
            <div className="card animate-fade-in-up">
                <CardHeader />
                <div className="mt-4 flex flex-col items-center rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                        <Smartphone className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-semibold text-fg dark:text-fg-dark">Set up M-Pesa</h3>
                    <p className="mt-2 max-w-sm text-sm text-fg-muted dark:text-fg-muted-dark">
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

    if (isConfigured && mode === "view") {
        return (
            <div className="card animate-fade-in-up">
                <div className="flex items-center justify-between">
                    <div>
                        <CardHeader />
                    </div>
                    <span className="pill-success inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                        Configured
                    </span>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border dark:border-border-dark pb-2">
                        <span className="text-fg-muted dark:text-fg-muted-dark">Consumer key</span>
                        <span className="font-mono text-fg dark:text-fg-dark">••••••••</span>
                    </div>
                    <div className="flex justify-between border-b border-border dark:border-border-dark pb-2">
                        <span className="text-fg-muted dark:text-fg-muted-dark">Consumer secret</span>
                        <span className="font-mono text-fg dark:text-fg-dark">••••••••</span>
                    </div>
                    <div className="flex justify-between border-b border-border dark:border-border-dark pb-2">
                        <span className="text-fg-muted dark:text-fg-muted-dark">Shortcode</span>
                        <span className="font-mono text-fg dark:text-fg-dark">••••••••</span>
                    </div>
                    <div className="flex justify-between pb-2">
                        <span className="text-fg-muted dark:text-fg-muted-dark">Passkey</span>
                        <span className="font-mono text-fg dark:text-fg-dark">••••••••</span>
                    </div>
                </div>
                <p className="mt-3 text-xs text-fg-muted dark:text-fg-muted-dark">
                    For security, stored credentials are never displayed — the backend
                    doesn&#39;t return them once saved. To change them, update below.
                </p>

                <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="btn-secondary mt-6"
                >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    Update credentials
                </button>
            </div>
        );
    }

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-brand" strokeWidth={2} />
                {isConfigured ? "Update M-Pesa credentials" : "Set up M-Pesa"}
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
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
                        className="btn-primary"
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
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

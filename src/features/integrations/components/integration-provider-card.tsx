"use client";

import { useMemo, useState } from "react";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type {
    IntegrationEnvironmentView,
    IntegrationFieldView,
    IntegrationProviderView,
    IntegrationTestResult,
    IntegrationTestTargetView,
} from "../types/integration-types";
import {
    useActivateIntegrationMutation,
    useSaveIntegrationCredentialsMutation,
    useTestIntegrationMutation,
} from "../hooks/use-integration-mutations";
import { IntegrationStatusBadge, EnvironmentChip, LiveChip } from "./integration-status-badge";
import { IntegrationAuditPanel } from "./integration-audit";
import { categoryMeta, formatDateTime, formatRelative, shortActor } from "./integration-utils";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

function MaskedValue({ configured }: { configured: boolean }) {
    if (!configured) return null;
    return (
        <span className="inline-flex items-center rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success-dark dark:text-success">
            ● Configured
        </span>
    );
}

function CredentialField({
    field,
    value,
    disabled,
    onChange,
}: {
    field: IntegrationFieldView;
    value: string;
    disabled: boolean;
    onChange: (key: string, value: string) => void;
}) {
    const [revealed, setRevealed] = useState(false);

    if (field.secret) {
        return (
            <label className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                    {field.label}
                    <MaskedValue configured={field.configured} />
                </span>
                <span className="relative block">
                    <input
                        type={revealed ? "text" : "password"}
                        value={value}
                        disabled={disabled}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        placeholder={
                            field.configured
                                ? "Leave blank to keep the current value"
                                : field.placeholder
                        }
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 pr-9 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:bg-surface-dark dark:text-fg-dark"
                    />
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setRevealed((v) => !v)}
                        aria-label={revealed ? "Hide value" : "Reveal value"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-fg-subtle transition-colors hover:text-fg dark:text-fg-subtle-dark dark:hover:text-fg-dark"
                    >
                        {revealed ? (
                            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                        ) : (
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                        )}
                    </button>
                </span>
            </label>
        );
    }

    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                {field.label}
            </span>
            <input
                type="text"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:bg-surface-dark dark:text-fg-dark"
            />
        </label>
    );
}

function TestConnectionFlow({
    providerKey,
    environment,
    supportsTestConnection,
    configured,
    isOwner,
    testTarget,
}: {
    providerKey: string;
    environment: IntegrationEnvironmentView;
    supportsTestConnection: boolean;
    configured: boolean;
    isOwner: boolean;
    testTarget?: IntegrationTestTargetView | null;
}) {
    const testMutation = useTestIntegrationMutation(providerKey);
    const [recipient, setRecipient] = useState("");
    const [result, setResult] = useState<IntegrationTestResult | null>(null);

    // Everything about the test destination is declared by the backend catalog
    // (ProviderTestTarget) — the console renders whatever the provider needs
    // instead of hard-coding it. Null means a credential-only check.
    const targetRequired = testTarget?.required === true;
    const needsRecipient = Boolean(testTarget);
    const recipientMissing = needsRecipient && targetRequired && !recipient.trim();
    const blocked = !configured && !needsRecipient;

    const run = () => {
        setResult(null);
        testMutation.mutate(
            { environment: environment.environment, target: needsRecipient ? recipient : undefined },
            {
                onSuccess: (res) => {
                    setResult(res);
                    toast[res.ok ? "success" : "error"](
                        res.ok ? "Test connection succeeded" : "Test connection failed",
                        { description: res.message }
                    );
                },
                onError: (err) => {
                    toast.error(getProcessErrorMessage(err, "Could not run the test connection"));
                },
            }
        );
    };

    if (!supportsTestConnection) return null;

        const isEmail = testTarget?.kind === "EMAIL";

    return (
        <div className="mt-3 space-y-2.5">
            {testTarget && (
                <input
                    type={isEmail ? "email" : "tel"}
                    inputMode={isEmail ? "email" : "tel"}
                    value={recipient}
                    disabled={!isOwner}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={testTarget.label}
                    aria-label={testTarget.label}
                    title={
                        targetRequired
                            ? undefined
                            : "Optional — the sender can verify credentials without a live message."
                    }
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:bg-surface-dark dark:text-fg-dark"
                />
            )}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={!isOwner || testMutation.isPending || recipientMissing}
                    onClick={run}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-border-subtle disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:text-fg-dark dark:hover:bg-border-subtle-dark"
                >
                    {testMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                    ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success-dark dark:text-success" strokeWidth={2} />
                    )}
                    {testMutation.isPending ? "Testing…" : "Test connection"}
                </button>
                {blocked && (
                    <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        Save credentials first
                    </span>
                )}
            </div>
            {result && (
                <div
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
                        result.ok
                            ? "border-success/25 bg-success/5 text-success-dark dark:text-success"
                            : "border-danger/25 bg-danger/5 text-danger-dark dark:text-danger"
                    }`}
                    role="status"
                >
                    {result.ok ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    ) : (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    )}
                    <span>{result.error || result.message}</span>
                </div>
            )}
        </div>
    );
}

function EnvironmentSection({
    providerKey,
    providerName,
    environment,
    isOwner,
    testTarget,
}: {
    providerKey: string;
    providerName: string;
    environment: IntegrationEnvironmentView;
    isOwner: boolean;
    testTarget?: IntegrationTestTargetView | null;
}) {
    const saveMutation = useSaveIntegrationCredentialsMutation(providerKey);
    const activateMutation = useActivateIntegrationMutation(providerKey);

    const initial = useMemo(
        () =>
            Object.fromEntries(
                environment.fields.map((f) => [f.key, f.secret ? "" : f.value])
            ) as Record<string, string>,
        [environment.fields]
    );
    const [values, setValues] = useState<Record<string, string>>(initial);

    const dirty = useMemo(
        () =>
            environment.fields.some((f) =>
                f.secret ? values[f.key] !== "" : values[f.key] !== f.value
            ),
        [environment.fields, values]
    );

    const save = () => {
        saveMutation.mutate(
            { environment: environment.environment, credentials: values },
            {
                onSuccess: () => {
                    toast.success(`${providerName} · ${environment.environment} saved`, {
                        description: "Credentials updated — blank fields kept their current values.",
                    });
                },
                onError: (err) => {
                    toast.error(
                        getProcessErrorMessage(err, "Could not save the integration credentials")
                    );
                },
            }
        );
    };

    const activate = () => {
        activateMutation.mutate(environment.environment, {
            onSuccess: (res) => {
                const active = res.environment.active;
                toast.success(
                    active
                        ? `${providerName} · ${environment.environment} is now live`
                        : `${providerName} · ${environment.environment} deactivated`
                );
            },
            onError: (err) => {
                toast.error(getProcessErrorMessage(err, "Could not activate this environment"));
            },
        });
    };

    const produceGate =
        environment.environment === "PRODUCTION" &&
        !environment.active &&
        environment.status !== "VERIFIED";

    return (
        <div
            className={`rounded-xl border p-4 transition-colors ${
                environment.active
                    ? "border-success/40 bg-success/[0.03] shadow-sm dark:border-success/30"
                    : "border-border bg-white dark:border-border-dark dark:bg-surface-dark"
            }`}
        >
            {/* Environment header */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <EnvironmentChip environment={environment.environment} />
                    <IntegrationStatusBadge status={environment.status} />
                    {environment.active && <LiveChip />}
                </div>
                {environment.updatedAt && (
                    <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        Updated {formatRelative(environment.updatedAt)}
                    </span>
                )}
            </div>

            {/* Verification / error metadata */}
            {environment.status === "VERIFIED" && environment.lastVerifiedAt && (
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-success-dark dark:text-success">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.25} />
                    Verified {formatDateTime(environment.lastVerifiedAt)} by{" "}
                    {shortActor(environment.lastVerifiedBy)}
                </p>
            )}
            {environment.status === "ERROR" && environment.lastError && (
                <p className="mb-2 flex items-start gap-1.5 rounded-lg border border-danger/20 bg-danger/5 px-2.5 py-2 text-[11px] text-danger-dark dark:text-danger">
                    <XCircle className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.25} />
                    <span className="line-clamp-3">{environment.lastError}</span>
                </p>
            )}

            {/* Credential fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {environment.fields.map((field) => (
                    <CredentialField
                        key={field.key}
                        field={field}
                        value={values[field.key] ?? ""}
                        disabled={!isOwner}
                        onChange={(key, value) =>
                            setValues((prev) => ({ ...prev, [key]: value }))
                        }
                    />
                ))}
            </div>

            {!isOwner && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                    <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Read-only for platform admins — only platform owners can modify credentials,
                    run test connections or switch environments.
                </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    disabled={!isOwner || !dirty || saveMutation.isPending}
                    onClick={save}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                    ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    )}
                    {saveMutation.isPending ? "Saving…" : "Save credentials"}
                </button>

                <TestConnectionFlow
                    providerKey={providerKey}
                    environment={environment}
                    supportsTestConnection
                    configured={environment.configured || dirty}
                    isOwner={isOwner}
                    testTarget={testTarget}
                />

                {!environment.active ? (
                    <button
                        type="button"
                        disabled={!isOwner || activateMutation.isPending || !environment.configured}
                        onClick={activate}
                        title={
                            !environment.configured
                                ? "Save credentials before activating"
                                : undefined
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/5 px-3.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-300"
                    >
                        {activateMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                        ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        )}
                        {activateMutation.isPending ? "Activating…" : "Activate"}
                    </button>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/5 px-3 py-1.5 text-xs font-semibold text-success-dark dark:text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Active
                    </span>
                )}
            </div>

            {produceGate && (
                <p className="mt-2.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                    Activation in Production requires a successful test connection since the last
                    credential change.
                </p>
            )}
        </div>
    );
}

export function IntegrationProviderCard({
    provider,
    isOwner,
}: {
    provider: IntegrationProviderView;
    isOwner: boolean;
}) {
    const { icon: Icon, label: categoryLabel, tone } = categoryMeta(provider.category);
    const live = provider.environments.find((env) => env.active);

    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
            {/* Provider header */}
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 dark:border-border-dark">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tone} shadow-md`}
                    >
                        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-fg dark:text-fg-dark">
                                {provider.displayName}
                            </h2>
                            <span className="rounded-md bg-border-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted dark:bg-border-subtle-dark dark:text-fg-muted-dark">
                                {categoryLabel}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-fg-muted dark:text-fg-muted-dark">
                            {live
                                ? `Live in ${live.environment} — used by production traffic`
                                : "Not live — no environment is active"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {provider.docsUrl && (
                        <a
                            href={provider.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-fg-muted transition-colors hover:bg-border-subtle hover:text-fg dark:border-border-dark dark:text-fg-muted-dark dark:hover:bg-border-subtle-dark dark:hover:text-fg-dark"
                        >
                            <ExternalLink className="h-3 w-3" strokeWidth={2} />
                            Docs
                        </a>
                    )}
                </div>
            </header>

            {/* Environments */}
            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                {provider.environments.map((env) => (
                    <EnvironmentSection
                        key={env.environment}
                        providerKey={provider.providerKey}
                        providerName={provider.displayName}
                        environment={env}
                        testTarget={provider.testTarget}
                        isOwner={isOwner}
                    />
                ))}
            </div>

            <IntegrationAuditPanel providerKey={provider.providerKey} />
        </section>
    );
}
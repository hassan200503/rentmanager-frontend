"use client";

import { useState } from "react";
import { History, ChevronDown, Loader2 } from "lucide-react";
import { useIntegrationAuditQuery } from "../hooks/use-integration-queries";
import type { IntegrationAuditEntry } from "../types/integration-types";
import { EnvironmentChip } from "./integration-status-badge";
import { formatDateTime, shortActor } from "./integration-utils";

const ACTION_META: Record<string, { label: string; chip: string }> = {
    saved: { label: "Saved", chip: "bg-info/10 text-info-dark border-info/20 dark:text-info" },
    activated: { label: "Activated", chip: "bg-success/10 text-success-dark border-success/20 dark:text-success" },
    deactivated: { label: "Deactivated", chip: "bg-warning/10 text-warning-dark border-warning/20 dark:text-warning" },
    tested: { label: "Tested", chip: "bg-brand/10 text-brand-700 border-brand/20 dark:text-brand-300" },
};

function actionMeta(action: string) {
    return (
        ACTION_META[action] ?? {
            label: action.charAt(0).toUpperCase() + action.slice(1),
            chip: "bg-border-subtle text-fg-muted border-border dark:bg-border-subtle-dark dark:border-border-dark",
        }
    );
}

function metadataSummary(entry: IntegrationAuditEntry): string | null {
    if (!entry.metadata) return null;
    const parts = Object.entries(entry.metadata)
        .filter(([key]) => key !== "provider")
        .map(([key, value]) =>
            `${key}=${typeof value === "string" ? JSON.stringify(value.length > 60 ? value.slice(0, 57) + "…" : value) : JSON.stringify(value)}`
        );
    return parts.length ? parts.join(" · ") : null;
}

export function IntegrationAuditPanel({ providerKey }: { providerKey: string }) {
    const [open, setOpen] = useState(false);
    const { data, isLoading, isError } = useIntegrationAuditQuery(providerKey, open);

    return (
        <div className="border-t border-border dark:border-border-dark">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50"
            >
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-fg dark:text-fg-dark">
                    <History className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
                    Audit trail
                    {data && data.length > 0 && (
                        <span className="rounded-full bg-border-subtle px-1.5 py-0.5 text-[10px] font-bold text-fg-muted dark:bg-border-subtle-dark dark:text-fg-muted-dark">
                            {data.length}
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-fg-muted transition-transform duration-200 dark:text-fg-muted-dark ${
                        open ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                />
            </button>

            {open && (
                <div className="border-t border-border bg-border-subtle/30 px-5 pb-4 pt-3 dark:border-border-dark dark:bg-border-subtle-dark/20">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-xs text-fg-muted dark:text-fg-muted-dark">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                            Loading audit trail…
                        </div>
                    ) : isError ? (
                        <p className="py-4 text-center text-xs text-danger-dark dark:text-danger">
                            Could not load the audit trail.
                        </p>
                    ) : !data || data.length === 0 ? (
                        <p className="py-4 text-center text-xs text-fg-muted dark:text-fg-muted-dark">
                            No actions recorded yet — saves, test connections and activations appear
                            here.
                        </p>
                    ) : (
                        <ul className="max-h-80 space-y-1 overflow-y-auto custom-scrollbar">
                            {data.map((entry) => {
                                const meta = actionMeta(entry.action);
                                const summary = metadataSummary(entry);
                                return (
                                    <li
                                        key={`${entry.createdAt}-${entry.action}-${entry.actorUserId}`}
                                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1.5 text-[11px] hover:bg-white dark:hover:bg-surface-dark"
                                    >
                                        <span
                                            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-semibold ${meta.chip}`}
                                        >
                                            {meta.label}
                                        </span>
                                        <EnvironmentChip environment={entry.environment} />
                                        <span className="font-medium text-fg dark:text-fg-dark">
                                            {shortActor(entry.actorUserId)}
                                        </span>
                                        {entry.ipAddress && (
                                            <span className="text-fg-subtle dark:text-fg-subtle-dark">
                                                {entry.ipAddress}
                                            </span>
                                        )}
                                        {summary && (
                                            <span className="min-w-0 flex-1 truncate font-mono text-fg-subtle dark:text-fg-subtle-dark" title={summary}>
                                                {summary}
                                            </span>
                                        )}
                                        <time
                                            className="ml-auto shrink-0 text-fg-subtle dark:text-fg-subtle-dark"
                                            dateTime={entry.createdAt}
                                        >
                                            {formatDateTime(entry.createdAt)}
                                        </time>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
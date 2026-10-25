"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { IntegrationStatus } from "../types/integration-types";

const STATUS_META: Record<
    IntegrationStatus,
    { label: string; chip: string; dot: string; icon?: typeof CheckCircle2 }
> = {
    NOT_CONFIGURED: {
        label: "Not configured",
        chip: "bg-border-subtle text-fg-muted border-border dark:bg-border-subtle-dark dark:border-border-dark",
        dot: "bg-fg-subtle",
    },
    CONFIGURED: {
        label: "Configured",
        chip: "bg-info/10 text-info-dark border-info/20 dark:text-info",
        dot: "bg-info",
    },
    VERIFIED: {
        label: "Verified",
        chip: "bg-success/10 text-success-dark border-success/20 dark:text-success",
        dot: "bg-success",
        icon: CheckCircle2,
    },
    ERROR: {
        label: "Error",
        chip: "bg-danger/10 text-danger-dark border-danger/20 dark:text-danger",
        dot: "bg-danger",
        icon: XCircle,
    },
};

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
    const meta = STATUS_META[status] ?? STATUS_META.NOT_CONFIGURED;
    const Icon = meta.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.chip}`}
        >
            {Icon ? (
                <Icon className="h-3 w-3" strokeWidth={2.25} />
            ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            )}
            {meta.label}
        </span>
    );
}

export function EnvironmentChip({ environment }: { environment: string }) {
    const isProd = environment === "PRODUCTION";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                isProd
                    ? "bg-brand/10 text-brand-700 dark:text-brand-300"
                    : "bg-border-subtle text-fg-muted dark:bg-border-subtle-dark dark:text-fg-muted-dark"
            }`}
        >
            {environment}
        </span>
    );
}

export function LiveChip() {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success-dark dark:text-success">
            <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
        </span>
    );
}

"use client";

import { useState } from "react";
import { Loader2, Rocket, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRollToProductionMutation } from "../hooks/use-integration-mutations";
import type { IntegrationProviderView } from "../types/integration-types";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

/**
 * Guarded "Roll to Production" control. The backend only ever activates a
 * provider whose PRODUCTION config is VERIFIED (a real Test Connection passed
 * since the last credential change) — this is the single-switch surface for
 * that server-enforced gate, plus an unarmed two-step confirm before it fires.
 */
export function RollToProductionButton({
    providers,
    isOwner,
}: {
    providers: IntegrationProviderView[];
    isOwner: boolean;
}) {
    const mutation = useRollToProductionMutation();
    const [armed, setArmed] = useState(false);

    const ready = providers.filter((p) =>
        p.environments.some(
            (e) => e.environment === "PRODUCTION" && e.status === "VERIFIED" && !e.active
        ));
    const readyCount = ready.length;
    const pending = mutation.isPending;

    const run = () => {
        setArmed(false);
        mutation.mutate(undefined, {
            onSuccess: (res) => {
                if (res.activated.length > 0) {
                    toast.success(
                        `Rolled ${res.activated.length} provider(s) to ${res.targetEnvironment}`,
                        { description: res.activated.join(", ") }
                    );
                } else {
                    toast.error("Nothing rolled to Production", {
                        description:
                            res.skipped.length > 0
                                ? res.skipped
                                      .slice(0, 4)
                                      .map((s) => `${s.displayName} — ${s.reason}`)
                                      .join(" · ")
                                : "no configured provider is pending Production.",
                    });
                }
            },
            onError: (err) => {
                toast.error(getProcessErrorMessage(err, "Production rollout failed"));
            },
        });
    };

    return (
        <button
            type="button"
            disabled={!isOwner || pending}
            onClick={() => (armed ? run() : setArmed(true))}
            onBlur={() => setArmed(false)}
            title={
                !isOwner
                    ? "Only platform owners can roll providers to Production"
                    : readyCount === 0
                      ? "No provider is VERIFIED on Production yet — pass a live Test Connection first"
                      : undefined
            }
            className={`inline-flex items-center gap-1.5 rounded-full border border-brand/30 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                armed ? "bg-brand/10 text-brand-700" : "bg-brand/5 text-brand-700"
            } hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-300`}
        >
            {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
            ) : armed ? (
                <ShieldAlert
                    className="h-3.5 w-3.5 text-danger-dark dark:text-danger"
                    strokeWidth={2}
                />
            ) : (
                <Rocket className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {pending
                ? "Rolling…"
                : armed
                  ? "Confirm roll to Production?"
                  : `Roll to Production${readyCount > 0 ? ` · ${readyCount} ready` : ""}`}
        </button>
    );
}
"use client";

import { useState } from "react";
import { useSuspendTenantMutation } from "../queries/use-suspend-tenant-mutation";
import { useActivateTenantMutation } from "../queries/use-activate-tenant-mutation";

// ASSUMPTION flagged: no shared Dialog/Modal component confirmed to exist
// in this codebase (same situation as LoadingSkeleton/PermissionDeniedState
// earlier — didn't invent an import for one). This is a minimal inline
// overlay. Swap for a real shared Dialog if/when one exists.

const SUSPENDED_STATUS = "SUSPENDED";

// status is a raw backend enum string, confirmed not fully known — treated
// defensively per the note already in tenant-types.ts.
function isSuspended(status: string): boolean {
    return status.trim().toUpperCase() === SUSPENDED_STATUS;
}

export function TenantSuspendActivateControl({
                                                 tenantId,
                                                 status,
                                             }: {
    tenantId: string;
    status: string;
}) {
    const [showReasonPrompt, setShowReasonPrompt] = useState(false);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState<string | undefined>();

    const suspendMutation = useSuspendTenantMutation(tenantId);
    const activateMutation = useActivateTenantMutation(tenantId);

    const suspended = isSuspended(status);

    function openReasonPrompt() {
        setReason("");
        setReasonError(undefined);
        setShowReasonPrompt(true);
    }

    async function handleConfirmSuspend() {
        if (!reason.trim()) {
            setReasonError("A reason is required to suspend this tenant");
            return;
        }
        try {
            await suspendMutation.mutateAsync({ reason: reason.trim() });
            setShowReasonPrompt(false);
        } catch {
            // Error toast is handled in the mutation's onError; keep the
            // dialog open so the user can retry without retyping the reason.
        }
    }

    if (suspended) {
        return (
            <button
                type="button"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
                {activateMutation.isPending ? "Activating..." : "Activate tenant"}
            </button>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={openReasonPrompt}
                className="inline-flex items-center rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive"
            >
                Suspend tenant
            </button>

            {showReasonPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
                        <h3 className="text-sm font-semibold">Suspend this tenant?</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            They&#39;ll lose access until reactivated. Please give a reason for the record.
                        </p>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (reasonError) setReasonError(undefined);
                            }}
                            rows={3}
                            className={`mt-3 w-full rounded-md border px-3 py-2 text-sm ${
                                reasonError ? "border-destructive" : "border-input"
                            }`}
                            placeholder="e.g. Non-payment of subscription fees"
                        />
                        {reasonError && <p className="mt-1 text-xs text-destructive">{reasonError}</p>}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowReasonPrompt(false)}
                                disabled={suspendMutation.isPending}
                                className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSuspend}
                                disabled={suspendMutation.isPending}
                                className="inline-flex items-center rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
                            >
                                {suspendMutation.isPending ? "Suspending..." : "Confirm suspend"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
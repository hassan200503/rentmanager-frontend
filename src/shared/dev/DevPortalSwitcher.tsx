"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { appConfig } from "@/lib/config/app-config";
import {
    isDevRenterMode,
    setDevRenterMode,
    clearDevRenterMode,
} from "@/shared/dev/dev-mode";
import { ArrowLeftRight, Building2, User, Plus, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function DevPortalSwitcher() {
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
    const [isRenter, setIsRenter] = useState(() => {
        try { return isDevRenterMode(); } catch { return false; }
    });
    const [setupState, setSetupState] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [setupResult, setSetupResult] = useState<string>("");
    const [leaseNumber, setLeaseNumber] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    if (!mounted || !appConfig.flags.isDevelopment) return null;

    const toggle = () => {
        if (isRenter) {
            clearDevRenterMode();
            setIsRenter(false);
        } else {
            setDevRenterMode();
            setIsRenter(true);
        }
        window.location.reload();
    };

    const runSetup = async () => {
        setSetupState("loading");
        try {
            type ClerkWindow = Window & {
                Clerk?: {
                    session?: {
                        getToken?: (opts?: { template?: string }) => Promise<string | null>;
                    };
                };
            };
            const clerk = window as ClerkWindow;
            const token = await clerk.Clerk?.session?.getToken?.();
            if (!token) {
                setSetupState("error");
                setSetupResult("No Clerk token — are you signed in?");
                return;
            }
            const params = new URLSearchParams();
            const ln = leaseNumber.trim();
            if (ln) params.set("leaseNumber", ln);
            const url = `/api/v1/tenant-portal/dev/setup${params.toString() ? `?${params}` : ""}`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const body = await res.json();
            if (body.success) {
                setSetupState("success");
                const name = body.data?.name || "";
                setSetupResult(
                    ln
                        ? `Linked to ${name || "real renter"}! Switch to renter mode and visit /portal.`
                        : "Renter profile created! Switch to renter mode and visit /portal."
                );
            } else {
                setSetupState("error");
                setSetupResult(body.message || "Setup failed");
            }
        } catch (err) {
            setSetupState("error");
            setSetupResult(String(err));
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {setupState !== "idle" && (
                <div className={`
                    flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-lg max-w-xs
                    ${setupState === "loading" ? "bg-blue-100 text-blue-700" : ""}
                    ${setupState === "success" ? "bg-emerald-100 text-emerald-700" : ""}
                    ${setupState === "error" ? "bg-red-100 text-red-700" : ""}
                `}>
                    {setupState === "loading" && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                    {setupState === "success" && <CheckCircle2 className="h-3 w-3" strokeWidth={2} />}
                    {setupState === "error" && <AlertTriangle className="h-3 w-3" strokeWidth={2} />}
                    {setupResult}
                    <button onClick={() => setSetupState("idle")} className="ml-1 hover:opacity-70">×</button>
                </div>
            )}

            {!isRenter && (
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={leaseNumber}
                        onChange={(e) => setLeaseNumber(e.target.value)}
                        placeholder="Lease (optional)"
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs shadow-sm
                            focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400
                            w-36"
                        onKeyDown={(e) => { if (e.key === "Enter") runSetup(); }}
                    />
                    <button
                        onClick={runSetup}
                        disabled={setupState === "loading"}
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg
                            bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all
                            disabled:opacity-50"
                        title="Link a real renter by lease number, or create fake dev data if lease field is empty"
                    >
                        {setupState === "loading" ? (
                            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                        ) : (
                            <Plus className="h-3 w-3" strokeWidth={2} />
                        )}
                        Setup Renter
                    </button>
                </div>
            )}

            <button
                onClick={toggle}
                className={`
                    flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg
                    transition-all duration-200 hover:scale-105 active:scale-95
                    ${isRenter
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-brand text-white hover:bg-brand/90"}
                `}
                title={isRenter ? "Switch to Landlord view" : "Switch to Renter view"}
            >
                <ArrowLeftRight className="h-3 w-3" strokeWidth={2} />
                {isRenter ? (
                    <><Building2 className="h-3 w-3" strokeWidth={2} /> Landlord</>
                ) : (
                    <><User className="h-3 w-3" strokeWidth={2} /> Renter</>
                )}
            </button>
        </div>
    );
}
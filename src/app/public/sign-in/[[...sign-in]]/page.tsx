"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";
import {
    parseSignInIntent,
    resolveSignInRedirect,
    type SignInIntent,
} from "@/lib/auth/signin-links";
import {
    Building2,
    Home,
    Check,
    Loader2,
    Send,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

/**
 * /public/sign-in — persona-aware sign-in.
 *
 * The page carries an optional `?intent=landlord|renter` (see
 * lib/auth/signin-links.ts) that pre-selects a persona card. Selecting a
 * persona sets Clerk's `forceRedirectUrl` to that persona's home tree
 * (/dashboard or /portal) — a UX hint ONLY.
 *
 * SECURITY: intent is never an authorization signal. The proxy
 * (lib/rbac/route-policy.ts) re-evaluates verified claims after auth and
 * corrects any mismatch (a renter choosing "landlord" is sent back to
 * /portal on arrival). When no intent is declared, `forceRedirectUrl` is
 * NOT set, so Clerk's return-to-origin flow is preserved (e.g. a renter
 * mid-reservation who is routed through sign-in keeps their return URL).
 */

type PersonaSelection = SignInIntent | "neutral";

const PERSONA_OPTIONS: Array<{
    intent: SignInIntent;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
    {
        intent: "landlord",
        label: "Sign in as a landlord",
        description: "Manage your properties, tenants, leases and payments.",
        icon: Building2,
    },
    {
        intent: "renter",
        label: "Sign in as a tenant or renter",
        description: "Reserve a home, sign your lease and pay rent online.",
        icon: Home,
    },
];

function PersonaCard({
    option,
    selected,
    onSelect,
}: {
    option: (typeof PERSONA_OPTIONS)[number];
    selected: boolean;
    onSelect: () => void;
}) {
    const Icon = option.icon;
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={onSelect}
            className={`
                group flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50
                ${
                    selected
                        ? "border-brand/60 bg-brand-50 dark:bg-brand-900/20 shadow-md shadow-brand/10"
                        : "border-border dark:border-border-dark bg-white dark:bg-surface-dark hover:border-brand/40 hover:shadow-sm"
                }
            `}
        >
            <span
                className={`
                    mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors
                    ${
                        selected
                            ? "bg-brand text-white"
                            : "bg-border-subtle dark:bg-border-subtle-dark text-fg-subtle dark:text-fg-subtle-dark group-hover:bg-brand/10 group-hover:text-brand"
                    }
                `}
            >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
                <span
                    className={`
                        block text-sm font-semibold
                        ${selected ? "text-brand-700 dark:text-brand-300" : "text-fg dark:text-fg-dark"}
                    `}
                >
                    {option.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                    {option.description}
                </span>
            </span>
            <span
                className={`
                    mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all
                    ${
                        selected
                            ? "border-brand bg-brand text-white"
                            : "border-border dark:border-border-dark bg-white dark:bg-surface-dark"
                    }
                `}
                aria-hidden="true"
            >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
        </button>
    );
}

function SignInForm() {
    const searchParams = useSearchParams();
    const urlIntent = parseSignInIntent(searchParams.get("intent"));
    const [selection, setSelection] = useState<PersonaSelection>(urlIntent ?? "neutral");

    // Only force a redirect when a persona was explicitly chosen (via URL
    // intent or an in-page card click). "neutral" leaves Clerk's own
    // return-to-origin behaviour untouched — see module doc above.
    const forceRedirectUrl = resolveSignInRedirect(
        selection === "neutral" ? undefined : selection
    );

    return (
        <div className="space-y-5">
            {/* Persona chooser */}
            <div role="radiogroup" aria-label="How do you want to sign in?" className="space-y-3">
                {PERSONA_OPTIONS.map((option) => (
                    <PersonaCard
                        key={option.intent}
                        option={option}
                        selected={selection === option.intent}
                        onSelect={() => setSelection(option.intent)}
                    />
                ))}
            </div>

            <div className="card-elevated !p-6">
                <SignIn
                    routing="path"
                    path="/public/sign-in"
                    forceRedirectUrl={forceRedirectUrl}
                />
            </div>

            {/* Persona switch (keeps the flow flexible without reloading) */}
            {selection !== "neutral" && (
                <p className="text-center text-xs text-fg-muted dark:text-fg-muted-dark">
                    {selection === "landlord" ? "Renting a home instead? " : "Listing a property instead? "}
                    <button
                        type="button"
                        onClick={() => setSelection(selection === "landlord" ? "renter" : "landlord")}
                        className="font-semibold text-brand dark:text-brand-400 hover:underline underline-offset-2"
                    >
                        {selection === "landlord" ? "Sign in as a tenant or renter" : "Sign in as a landlord"}
                    </button>
                </p>
            )}

            {/* Resend link toggle — renter-specific (reservation magic links). */}
            {selection !== "landlord" && (
                <div className="card-elevated !p-4">
                    <ResendSignInLink />
                </div>
            )}
        </div>
    );
}

function ResendSignInLink() {
    const [showResend, setShowResend] = useState(false);
    const [reservationId, setReservationId] = useState("");
    const [phone, setPhone] = useState("");
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);

    const handleResend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reservationId.trim() || !phone.trim()) return;
        setResending(true);
        setResendError(null);
        setResent(false);
        try {
            await apiClient.post<{ sent: boolean }>(
                publicEndpoints.resendSignInLink(reservationId.trim()),
                { phone: phone.trim() }
            );
            setResent(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to resend link";
            setResendError(message);
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setShowResend(!showResend)}
                className="flex w-full items-center justify-between text-sm text-ink-muted hover:text-ink transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Lost your sign-in link?
                </span>
                {showResend ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showResend && (
                <form onSubmit={handleResend} className="mt-3 space-y-3">
                    <p className="text-xs text-ink-muted">
                        Enter your reservation ID and phone number to receive a new sign-in link.
                    </p>
                    <input
                        type="text"
                        placeholder="Reservation ID"
                        value={reservationId}
                        onChange={(e) => setReservationId(e.target.value)}
                        className="input-primary w-full text-sm"
                        required
                    />
                    <input
                        type="tel"
                        placeholder="Phone number (e.g. +254700000000)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input-primary w-full text-sm"
                        required
                    />
                    <button
                        type="submit"
                        disabled={resending || !reservationId.trim() || !phone.trim()}
                        className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
                    >
                        {resending ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending…
                            </span>
                        ) : (
                            "Resend sign-in link"
                        )}
                    </button>
                    {resent && (
                        <p className="text-xs font-medium text-success flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            Link sent! Check your phone.
                        </p>
                    )}
                    {resendError && (
                        <p className="text-xs text-danger flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {resendError}
                        </p>
                    )}
                </form>
            )}
        </>
    );
}

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark relative overflow-hidden py-12">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-30 dark:opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-100 dark:bg-brand-900/20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-200 dark:bg-brand-800/10 blur-3xl" />
            </div>

            <div className="w-full max-w-md px-4 relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand dark:text-brand-400">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="font-[var(--font-display-face)] text-2xl font-normal tracking-tight text-fg dark:text-fg-dark">
                        Welcome back
                    </h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-1">
                        Sign in to your RentManager account
                    </p>
                </div>

                <Suspense fallback={<div className="card-elevated !p-6 min-h-40" aria-busy="true" />}>
                    <SignInForm />
                </Suspense>

                <p className="text-center text-xs text-fg-subtle dark:text-fg-subtle-dark mt-6">
                    RentManager — Property Management Platform
                </p>
            </div>
        </div>
    );
}

"use client";

import { Suspense, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";
import { BadgeMark } from "@/shared/components/brand/BrandBadge";
import {
    Check,
    Loader2,
    Send,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

/**
 * /public/sign-in — one sign-in for everyone.
 *
 * There used to be "Sign in as a landlord / as a renter" cards with a switch
 * between them. Choosing a role on a sign-in screen is the wrong place for
 * that decision: it invites people to pick the "other" role, it confuses
 * people who are both, and it made a role look like something you choose
 * rather than something the account is. Access was always enforced server
 * side, but the screen suggested otherwise.
 *
 * Now everyone signs in the same way and lands on /continue, which asks the
 * API what the account is actually authorised for (GET /users/me/access) and
 * routes there. `fallbackRedirectUrl` (not `force`) keeps Clerk's
 * return-to-origin flow: a renter sent to sign in mid-reservation still goes
 * back to their reservation.
 */

function SignInForm() {
    return (
        <div className="space-y-5">
            <div className="card-elevated !p-6">
                <SignIn routing="path" path="/public/sign-in" fallbackRedirectUrl="/continue" />
            </div>

            {/* Renters who reserved without an account sign in by a link sent by SMS. */}
            <div className="card-elevated !p-4">
                <ResendSignInLink />
            </div>
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
                    <div className="inline-flex items-center justify-center mb-4">
                        <BadgeMark size={48} />
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

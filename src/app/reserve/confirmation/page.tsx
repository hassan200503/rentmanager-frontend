// app/reserve/confirmation/page.tsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy, AlertTriangle } from "lucide-react";

export default function ReservationConfirmedPage() {
    // useSearchParams requires a Suspense boundary in the App Router,
    // otherwise the production build fails on static generation.
    return (
        <Suspense fallback={<main className="min-h-screen bg-canvas" />}>
            <ReservationConfirmedContent />
        </Suspense>
    );
}

function ReservationConfirmedContent() {
    const searchParams = useSearchParams();
    const reservationId = searchParams.get("reservationId");
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!reservationId) return;
        try {
            await navigator.clipboard.writeText(reservationId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard access can fail (permissions, insecure context). The
            // reference is still visible on screen to copy by hand, so this
            // fails silently rather than surfacing an alarming error for a
            // non-critical convenience feature.
        }
    };

    // No reservationId means we have nothing to confirm — showing a bare
    // "payment successful" state regardless would be actively misleading to
    // anyone who reaches this URL without having actually paid.
    if (!reservationId) {
        return (
            <main className="min-h-screen bg-canvas py-12 px-4 flex items-center">
                <div className="mx-auto max-w-md w-full">
                    <div className="card p-8 text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.05]">
                            <AlertTriangle className="w-7 h-7 text-ink-muted" strokeWidth={1.75} />
                        </div>
                        <h1 className="font-display text-xl font-bold text-ink">
                            We couldn&apos;t find that reservation
                        </h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            This link is missing its reservation reference. If you just paid a
                            deposit, check the SMS we sent you — it has everything you need.
                        </p>
                        <Link
                            href="/listings"
                            className="btn-primary inline-block mt-6 px-6 py-3 text-sm"
                        >
                            Browse listings
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-canvas py-12 px-4 flex items-center">
            <div className="mx-auto max-w-md w-full">
                <div className="card p-8 text-center" role="status">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
                        <Check className="w-8 h-8 text-primary" strokeWidth={2.5} />
                    </div>

                    <h1 className="font-display text-xl font-bold text-ink">Deposit received</h1>
                    <p className="mt-2 text-sm text-ink-muted">
                        Your M-Pesa payment was successful and your unit is now reserved.
                    </p>

                    <div className="mt-6 rounded-xl border border-primary/15 bg-primary-light p-4 text-left">
                        <p className="text-sm font-medium text-primary-dark">Check your phone</p>
                        <p className="mt-1 text-sm text-primary-dark/90">
                            We&apos;ve sent you an SMS with your login details. Use them to sign in
                            and start tracking your rent, payments, and lease — right from your
                            phone.
                        </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 rounded-lg bg-ink/[0.04] px-4 py-2.5">
                        <div className="text-left overflow-hidden">
                            <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                                Reservation reference
                            </p>
                            <p className="font-data text-sm text-ink truncate">{reservationId}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-4 text-xs text-ink-muted">
                        Didn&apos;t get an SMS? It can take a minute to arrive. If it still
                        doesn&apos;t show up, contact your landlord for help.
                    </p>

                    <Link
                        href="/listings"
                        className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                        Browse more listings
                    </Link>
                </div>
            </div>
        </main>
    );
}
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg dark:bg-bg-dark px-6 py-16">
            {/* Ambient danger glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger/10 blur-3xl"
            />
            <div className="relative flex w-full max-w-md flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-bg dark:bg-danger-bg-dark ring-1 ring-inset ring-danger/15">
                    <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={2} />
                </div>
                <h1 className="mt-6 text-lg font-semibold text-fg dark:text-fg-dark">
                    Something went wrong
                </h1>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                    An unexpected error occurred while loading this page. Please try again.
                </p>
                {error?.digest && (
                    <p className="mt-4 rounded-lg bg-border-subtle dark:bg-border-subtle-dark px-2.5 py-1 font-mono text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        Ref: {error.digest}
                    </p>
                )}
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                    <button onClick={() => reset()} className="btn-primary">
                        <RotateCw className="h-4 w-4" strokeWidth={2} />
                        Try again
                    </button>
                    <Link href="/dashboard" className="btn-secondary">
                        <Home className="h-4 w-4" strokeWidth={2} />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
// app/global-error.tsx
// Catches errors originating in the root layout (providers, fonts, etc.).
// Unlike error.tsx it replaces the root layout entirely, so it must define
// its own <html>/<body> and global styles. Per Next 16 docs it must NOT
// export metadata — a plain <title> suffices.
"use client";

import "./globals.css";

import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function GlobalError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    return (
        <html lang="en">
        <body className="antialiased">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg dark:bg-bg-dark px-6 py-16">
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
                    A critical error occurred while the app was loading. Please try again.
                </p>
                {error?.digest && (
                    <p className="mt-4 rounded-lg bg-border-subtle dark:bg-border-subtle-dark px-2.5 py-1 font-mono text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                        Ref: {error.digest}
                    </p>
                )}
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                    <button onClick={() => unstable_retry()} className="btn-primary">
                        <RotateCw className="h-4 w-4" strokeWidth={2} />
                        Try again
                    </button>
                    <a href="/dashboard" className="btn-secondary">
                        <Home className="h-4 w-4" strokeWidth={2} />
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
        </body>
        </html>
    );
}

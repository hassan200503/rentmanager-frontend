"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg dark:bg-bg-dark p-6">
            <div className="card max-w-md w-full text-center py-12">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg dark:bg-danger-bg-dark">
                    <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={2} />
                </div>
                <h1 className="text-lg font-semibold text-fg dark:text-fg-dark mb-2">Something went wrong</h1>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6">
                    An unexpected error occurred. Please try again.
                </p>
                <button
                    onClick={() => reset()}
                    className="btn-primary"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
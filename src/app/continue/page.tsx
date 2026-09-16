"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, AlertTriangle } from "lucide-react";
import { userApi } from "@/features/user/api/user-api";
import { resolveSessionDestination } from "@/lib/auth/session-destination";

/**
 * Post-sign-in router. Everyone signs in the same way; this page asks the API
 * what the account is actually authorised for and goes there. Nobody chooses
 * a role on a sign-in screen, so there is nothing to pick wrongly or abuse.
 *
 * The API may be waking up (free hosting), so a failure offers a retry
 * rather than a dead end.
 */
export default function ContinuePage() {
    const router = useRouter();
    const { isLoaded, isSignedIn, user } = useUser();
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) {
            router.replace("/public/sign-in");
            return;
        }
        let cancelled = false;
        userApi
            .getSessionAccess()
            .then((access) => {
                if (cancelled) return;
                router.replace(resolveSessionDestination(access, user?.unsafeMetadata?.signupIntent));
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, user, router, attempt]);

    const retry = () => {
        setFailed(false);
        setAttempt((n) => n + 1);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-canvas dark:bg-canvas-dark px-4">
            {failed ? (
                <div className="card max-w-sm text-center" role="alert">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg dark:bg-danger-bg-dark">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">
                        We couldn&apos;t reach RentManager
                    </p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                        Your account is fine. The service may be starting up. Please try again in a moment.
                    </p>
                    <button type="button" onClick={retry} className="btn-outline mx-auto">
                        Try again
                    </button>
                </div>
            ) : (
                <p
                    className="flex items-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark"
                    aria-live="polite"
                >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening your account…
                </p>
            )}
        </div>
    );
}

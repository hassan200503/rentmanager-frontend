"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Rendered by landlord pages when the signed-in account has no organisation
 * in the database yet. That is not a permission problem — it is an
 * unfinished setup — so the person is taken to onboarding instead of being
 * told to "ask an account owner", which a brand-new landlord cannot do.
 */
export function RedirectToOnboarding() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/onboarding");
    }, [router]);

    return (
        <div className="page-container">
            <p
                className="mt-16 flex items-center justify-center gap-2 text-sm text-fg-muted dark:text-fg-muted-dark"
                aria-live="polite"
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up your account…
            </p>
        </div>
    );
}

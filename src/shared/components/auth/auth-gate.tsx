"use client";

import { useAuth } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";
import { type ReactNode } from "react";
import { USER_TYPES, type UserType } from "@/lib/auth/clerk-metadata";
import { parseSessionClaims } from "@/lib/auth/session-claims";

/**
 * Client-side role gate for sensitive UI (buttons, forms, admin actions).
 *
 * Defense in depth — the proxy, layouts and the backend remain the
 * enforcement layers; this only prevents rendering privileged UI to the
 * wrong persona. Reads userType from the verified session claims (after the
 * Clerk JWT template is configured). While claims are loading or when
 * userType is unclassified, children are withheld (never rendered) — the
 * gate fails closed.
 *
 * Usage:
 *   <AuthGate allowedRoles={["landlord"]}>
 *     <DeletePropertyButton />
 *   </AuthGate>
 *
 *   <AuthGate allowedRoles={["admin"]} fallback={null}>...</AuthGate>
 */

interface AuthGateProps {
    /** Personas allowed to see `children`. */
    allowedRoles: readonly UserType[];
    children: ReactNode;
    /** Rendered instead of children when denied (default: nothing). */
    fallback?: ReactNode;
    /** Skeleton shown while claims resolve (default: nothing). */
    loading?: ReactNode;
}

export function AuthGate({ allowedRoles, children, fallback, loading }: AuthGateProps) {
    const { isLoaded, sessionClaims } = useAuth();

    if (!isLoaded) {
        return loading ?? null;
    }

    let userType: UserType | undefined;
    try {
        userType = parseSessionClaims(sessionClaims ?? null).userType ?? undefined;
    } catch {
        // Malformed claims → deny (fail closed), never guess.
        return fallback ?? null;
    }

    if (!userType || !allowedRoles.includes(userType)) {
        return fallback ?? null;
    }

    return <>{children}</>;
}

/** Premium "you don't have permission" empty state for gated sections. */
export function AuthGateDenied({
    title = "Restricted area",
    description = "You don't have permission to view this. If you believe this is a mistake, contact your administrator.",
}: {
    title?: string;
    description?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-border-subtle dark:bg-border-subtle-dark">
                <ShieldCheck className="h-7 w-7 text-fg-muted dark:text-fg-muted-dark opacity-60" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-semibold text-fg dark:text-fg-dark mb-1">{title}</h3>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark max-w-sm">{description}</p>
        </div>
    );
}

export { USER_TYPES };
export type { UserType };

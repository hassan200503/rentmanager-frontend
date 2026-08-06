import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AppShell from "@/shared/components/layout/AppShell";
import NotificationSync from "@/shared/components/dashboard/NotificationSync";
import CommandPalette from "@/shared/components/command-palette/CommandPalette";
import { extractRouteClaims } from "@/lib/auth/session-claims";

/**
 * /dashboard layout — server-side persona guard (defense in depth layer #2
 * after the proxy). Only DEFINITIVE contradictions redirect:
 *
 *   - userType 'renter'          → /portal (never the landlord workspace)
 *   - userType 'landlord_pending' → /onboarding
 *
 * Ambiguous claims (userType claim not yet configured / not migrated) pass
 * through — the proxy and backend decide, matching pre-userType behavior.
 * This avoids flash-of-unauthorized-content: decisions happen before
 * AppShell renders.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { sessionClaims } = await auth();

    let claims;
    try {
        claims = extractRouteClaims(sessionClaims ?? null);
    } catch {
        // Malformed claims → fail closed; the proxy sends the user to
        // sign-in on their next navigation.
        redirect("/public/sign-in");
    }

    if (claims.userType === "renter") {
        redirect("/portal");
    }
    if (claims.userType === "landlord_pending") {
        redirect("/onboarding");
    }

    return (
        <>
            <NotificationSync />
            <CommandPalette />
            <AppShell>{children}</AppShell>
        </>
    );
}

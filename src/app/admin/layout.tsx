import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import AdminShell from "@/shared/components/layout/AdminShell";
import { extractRouteClaims } from "@/lib/auth/session-claims";

/**
 * /admin layout — server-side RBAC guard (defense in depth layer #2).
 *
 * The proxy (layer #1) blocks non-admins before this renders; this layout
 * re-checks from verified session claims so even a direct render without
 * the proxy cannot leak the console:
 *
 *   - userType === 'admin'  → render console.
 *   - platformRole OWNER/ADMIN (legacy signal, pre-userType migration) →
 *     render console.
 *   - Any DEFINITIVE non-admin signal → notFound() (pretend the route
 *     doesn't exist — never leak that /admin is a real tree).
 *   - No signal at all (signed out / claims missing) → notFound(), fail
 *     closed. The client-side gate and the backend remain the final
 *     authorities.
 */

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { sessionClaims } = await auth();

    let claims;
    try {
        claims = extractRouteClaims(sessionClaims ?? null);
    } catch {
        notFound();
    }

    const hasPlatformRole = claims.platformRole === "OWNER" || claims.platformRole === "ADMIN";

    // Definitive non-admin → 404, no redirect (do not leak the tree).
    if (claims.userType && claims.userType !== "admin" && !hasPlatformRole) {
        notFound();
    }

    // No definitive signals (signed out, claims absent) → fail closed.
    if (!claims.userId) {
        notFound();
    }

    return <AdminShell>{children}</AdminShell>;
}

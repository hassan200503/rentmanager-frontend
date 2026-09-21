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
 *     render console. `platformRole` lives in the "backend" JWT template,
 *     so this layout fetches that token itself — the default session token
 *     never carries it (see src/proxy.ts).
 *   - Any DEFINITIVE non-admin signal → notFound() (pretend the route
 *     doesn't exist — never leak that /admin is a real tree).
 *   - No signal at all (signed out / claims missing) → notFound(), fail
 *     closed. The client-side gate and the backend remain the final
 *     authorities.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { sessionClaims, getToken } = await auth();

    let claims;
    try {
        claims = extractRouteClaims(sessionClaims ?? null);
    } catch {
        notFound();
    }

    // Decode `platformRole` from the backend template — the source of truth
    // for platform sub-roles (the default session token does not carry it).
    let platformRole = claims.platformRole;
    if (!platformRole && claims.userId) {
        try {
            const token = await getToken({ template: "backend" });
            if (token) {
                const payload = JSON.parse(
                    Buffer.from(token.split(".")[1], "base64").toString()
                ) as { platformRole?: string };
                const role = payload.platformRole;
                if (role === "OWNER" || role === "ADMIN") {
                    platformRole = role;
                }
            }
        } catch {
            // Token decode failed — treat as no signal and fail closed below.
        }
    }

    const hasPlatformRole = platformRole === "OWNER" || platformRole === "ADMIN";

    // Definitive non-admin → 404, no redirect (do not leak the tree).
    if (claims.userType && claims.userType !== "admin" && !hasPlatformRole) {
        notFound();
    }

    // No definitive signal (signed out, claims absent, template unreadable)
    // → fail closed.
    if (!claims.userId || (!hasPlatformRole && claims.userType !== "admin")) {
        notFound();
    }

    return <AdminShell>{children}</AdminShell>;
}
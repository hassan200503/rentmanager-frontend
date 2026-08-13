import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { extractRouteClaims } from "@/lib/auth/session-claims";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/**
 * /daraja/config server-side guard — defense in depth layer #2.
 *
 * The page holds landlord-level M-Pesa credentials, so beyond the proxy's
 * general sign-in gate we require — from the backend itself — that the
 * session belongs to a tenant OWNER before any part of the page renders.
 * The client-side `isOwner` gate stays as layer #3 (the backend
 * tenant-scoped endpoints remain the final authority).
 *
 * Fails closed: any ambiguity (no claims, /me unreachable, unexpected
 * response) → 404, never a render.
 */
export default async function DarajaConfigLayout({ children }: { children: React.ReactNode }) {
    const { sessionClaims, getToken } = await auth();

    let claims;
    try {
        claims = extractRouteClaims(sessionClaims ?? null);
    } catch {
        notFound();
    }

    if (!claims.userId) {
        notFound();
    }

    let isOwner = false;
    try {
        const token = await getToken({ template: "backend" });
        const res = await fetch(`${BACKEND_URL}/api/v1/me`, {
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(claims.tenantId ? { "X-Tenant-Id": claims.tenantId } : {}),
            },
            cache: "no-store",
        });
        if (res.ok) {
            const body = (await res.json()) as { data?: { role?: string } };
            isOwner = body?.data?.role === "OWNER";
        }
    } catch {
        // Unreachable backend → fail closed (do not render credential UI).
    }

    if (!isOwner) {
        notFound();
    }

    return <>{children}</>;
}
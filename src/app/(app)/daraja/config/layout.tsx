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
        // GET /api/v1/users/me — UserQueryController. This used to call
        // /api/v1/me, which has never existed: the fetch 404'd on every
        // request, isOwner stayed false, and the guard below rendered a
        // not-found page. The result was that this page was unreachable for
        // everyone, including owners, and it looked like a missing route
        // rather than a broken check.
        const res = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
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
        } else {
            // A refusal (401/403) is a real answer and stays quiet. Anything
            // else means the check itself is broken, and silence there is
            // what hid the bug above for as long as it lasted.
            if (res.status !== 401 && res.status !== 403) {
                console.error(
                    `[daraja/config] owner check could not be completed: GET /api/v1/users/me returned ${res.status}`
                );
            }
        }
    } catch (e) {
        // Unreachable backend → fail closed (do not render credential UI),
        // but say so: an operator seeing a 404 needs to be able to tell
        // "you are not the owner" apart from "the backend is down".
        console.error("[daraja/config] owner check could not reach the backend", e);
    }

    if (!isOwner) {
        notFound();
    }

    return <>{children}</>;
}
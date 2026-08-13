import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveRoutePolicy } from "@/lib/rbac/route-policy";
import { extractRouteClaims, type RouteClaims } from "@/lib/auth/session-claims";
import { auditRouteDecision, auditUnclassified } from "@/lib/auth/audit";

/**
 * Route-level RBAC proxy (Next.js 16 — formerly "middleware").
 *
 * The decision logic lives in src/lib/rbac/route-policy.ts (pure and
 * unit-tested). This file bridges Clerk's auth context to the policy,
 * runs the resulting action, and emits structured audit logs.
 *
 * Personas and their route trees (see lib/auth/clerk-metadata.ts):
 *   - admin            → /admin/*   (AdminShell)
 *   - landlord         → /dashboard/* (AppShell)
 *   - renter           → /portal/*   (TenantShell)
 *   - landlord_pending → /onboarding
 *
 * Claim sourcing:
 *   - `tenant_id` + `userType` come from the DEFAULT session token claims
 *     (userType appears once the Clerk JWT template is configured; until
 *     then it is absent and the policy falls back to legacy signals).
 *   - `platformRole` lives in the "backend" template — decoded lazily, and
 *     only when the request concerns the admin tree or routing needs it.
 *
 * Defense in depth: this proxy is the FIRST layer (blocks before render).
 * The backend is the authority — @PreAuthorize on /api/v1/admin/** plus
 * JWT org_id verification against X-Tenant-Id on every tenant-scoped call.
 * AMBIGUOUS claims never grant access (fail closed).
 */
export default clerkMiddleware(
    async (auth, req) => {
        const { userId, sessionClaims, redirectToSignIn, getToken } = await auth();

        // Parse/validate claims up front. Structural failures are EXPECTED
        // for unauthenticated visitors (there is no session token to parse).
        // They must never hijack public pages: collapse to the
        // unauthenticated shape and let the policy engine decide — public
        // paths render, protected paths send the user to the real sign-in
        // page (see signInUrl below).
        let claims: RouteClaims;
        try {
            claims = extractRouteClaims(sessionClaims ?? null);
        } catch {
            claims = {
                userId: null,
                tenantId: undefined,
                userType: undefined,
                platformRole: undefined,
            };
            // Only meaningful when a session token actually existed —
            // anonymous visitors have nothing to parse and log on every
            // public request.
            if (userId) {
                console.warn(
                    JSON.stringify({ event: "auth.invalid_claims", pathname: req.nextUrl.pathname })
                );
            }
        }

    const pathname = req.nextUrl.pathname;
    const needsRoleBoost =
        pathname === "/admin" || pathname.startsWith("/admin/") || !claims.userType;

    // platformRole is not on the default session token — decode the backend
    // template lazily. This doubles as the migration-window fallback for
    // admin detection until the userType claim is configured.
    if (userId && needsRoleBoost) {
        try {
            const token = await getToken({ template: "backend" });
            if (token) {
                const payload = JSON.parse(
                    Buffer.from(token.split(".")[1], "base64").toString()
                );
                const role = payload.platformRole as string | undefined;
                if (
                    (claims.platformRole === null || claims.platformRole === undefined) &&
                    typeof role === "string"
                ) {
                    claims = { ...claims, platformRole: role === "OWNER" || role === "ADMIN" ? role : undefined };
                }
            }
        } catch (error) {
            console.error(
                JSON.stringify({ event: "auth.backend_template_decode_failed", pathname }),
                error
            );
        }
    }

    if (!claims.userType && claims.userId) {
        auditUnclassified({
            userId: claims.userId,
            pathname,
            source: "proxy",
        });
    }

    const decision = resolveRoutePolicy({
        pathname,
        userId: claims.userId,
        tenantId: claims.tenantId,
        platformRole: claims.platformRole,
        userType: claims.userType,
        // Dev-only preview switch for testing the renter portal as a
        // landlord. Never set in production.
        devPortalOverride:
            process.env.NODE_ENV === "development" &&
            req.cookies.get("_dev_portal")?.value === "renter",
    });

    if (decision.action !== "next") {
        auditRouteDecision({
            userId: claims.userId,
            pathname,
            persona: claims.userType ?? undefined,
            tenantId: claims.tenantId,
            decision: decision.action,
            reason: decision.action === "redirect" ? `redirect ${decision.to}` : "sign-in required",
        });
    }

    switch (decision.action) {
        case "next":
            return NextResponse.next();
        case "sign-in":
            return redirectToSignIn();
        case "redirect":
            return NextResponse.redirect(new URL(decision.to, req.url));
    }
});

export const config = {
    // Run the RBAC proxy on app routes only. Static assets served from
    // public/ (images/, videos/, favicon, og.png, manifest, icon, robots,
    // sitemap) must bypass auth entirely — blocking them 302s the browser's
    // asset requests to sign-in and breaks hero media / 3D textures.
    matcher: [
        "/((?!_next/static|_next/image|api|public/sign-in|public/sign-up|images/|videos/|favicon\\.svg|file\\.svg|globe\\.svg|next\\.svg|vercel\\.svg|window\\.svg|og\\.png|manifest\\.json|icon|robots\\.txt|sitemap\\.xml).*)",
    ],
};
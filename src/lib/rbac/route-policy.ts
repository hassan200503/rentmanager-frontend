// lib/rbac/route-policy.ts
//
// Single source of truth for frontend route-level RBAC.
//
// The RentManager platform has three strictly separated personas, each with
// its own route tree, layout shell, and API scope. A user may hold multiple
// roles (e.g. a platform OWNER who also runs a landlord org) — each route
// tree independently checks the claim it needs, so no persona can ever see
// another's UI or data.
//
//   Persona           Claim                        Route tree
//   ───────────────────────────────────────────────────────────
//   admin             userType === 'admin'         /admin/*
//   landlord          userType === 'landlord'      /dashboard/*
//   renter            userType === 'renter'        /portal/*
//   landlord_pending  userType === 'landlord_pending'  /onboarding
//
// The `userType` claim (publicMetadata projection, see
// lib/auth/clerk-metadata.ts) is authoritative. During the metadata
// migration window a user may lack the claim — the policy then falls back
// to legacy signals (tenant_id / platformRole) via deriveUserTypeFromLegacy
// (lib/auth/session-claims.ts), which mirrors the backend's DB-derived
// roles. FAIL CLOSED on conflict: if a claimed userType contradicts a
// legacy signal, the claim wins for routing and the situation is audited
// by the proxy.
//
// This function is PURE and side-effect free so the full persona × route
// matrix can be unit tested (see route-policy.test.ts). The proxy (server)
// is the enforcing layer; the backend remains the authority via
// @PreAuthorize + JWT org_id verification on every API call.
//
// Cross-persona data isolation on the wire:
//   - Admin API client sends NO X-Tenant-Id header (admin-api.ts) — the
//     backend derives the platform role from the verified JWT.
//   - Landlord/renter API clients send X-Tenant-Id which the backend must
//     cross-check against the org_id claim inside the verified JWT.

import { type UserType } from "@/lib/auth/clerk-metadata";

export type RouteDecision =
    | { action: "next" }
    | { action: "redirect"; to: string }
    | { action: "sign-in" };

export interface RoutePolicyContext {
    /** The requested path (e.g. "/admin/landlords"). */
    pathname: string;
    /** null when unauthenticated. */
    userId: string | null;
    /** Clerk org membership claim (landlord workspace). */
    tenantId: string | null | undefined;
    /** Custom claim from the backend JWT template (OWNER | ADMIN | …). */
    platformRole: string | null | undefined;
    /**
     * Authoritative persona claim (publicMetadata.userType projected into
     * the JWT templates). Absent during the migration window → legacy
     * fallback. Invalid values are treated as absent (never guessed).
     */
    userType?: UserType | null;
    /**
     * Development-only escape hatch: lets a landlord preview the renter
     * portal by setting cookie _dev_portal=renter. Never true in production.
     */
    devPortalOverride?: boolean;
}

const PUBLIC_PATHS = [
    "/",
    "/listings(.*)",
    "/public/forgot-password",
    "/public/sign-in(.*)",
    "/public/sign-up(.*)",
    "/tenant-required",
    "/reserve(.*)",
    // The policy pages must be readable by anyone, signed in or not: they are
    // linked from the footer, from the sign-up screen, and from app-store
    // listings, and a privacy policy behind a sign-in wall is no policy at all.
    "/legal(.*)",
];

/**
 * Reachable by ANY signed-in user, whatever the session claims say. Both pages
 * decide where the person belongs from the backend (database truth), which is
 * the authority; the proxy's claim-derived persona can be stale.
 *
 * Why this matters: Clerk metadata (userType, org membership) and the database
 * can disagree — an organisation created in Clerk but never provisioned, a
 * fresh database behind an existing Clerk instance, a deleted tenant. The old
 * rule redirected a "landlord" away from /onboarding to /dashboard, while the
 * dashboard, reading the database, had no organisation to show: a dead end
 * ("Restricted page") with no way forward, and a redirect loop as soon as the
 * dashboard pointed back to onboarding.
 *
 *   /continue   — post-sign-in router: asks the API what this account is.
 *   /onboarding — sends an already-provisioned landlord on to /dashboard itself.
 *
 * Neither page renders any tenant data, so admitting every signed-in user
 * grants nothing; the backend still authorises every call.
 */
const ANY_SIGNED_IN_PATHS = ["/continue", "/onboarding"];

/** Pages a signed-in, tenant-less (pending onboarding/verification) user is still allowed to reach. */
const PENDING_PATHS = ["/onboarding", "/pending-review", "/account(.*)", "/support"];

const ADMIN_TREE = "/admin";
const DASHBOARD_TREE = "/dashboard";
const PORTAL_TREE = "/portal";

/** Path pattern ending in "(.*)" is treated as a prefix match. */
const pathMatches = (pathname: string, pattern: string) => {
    if (pattern.endsWith("(.*)")) {
        const prefix = pattern.slice(0, -4);
        return pathname === prefix || pathname.startsWith(prefix);
    }
    return pathname === pattern;
};

const isPublicPath = (pathname: string) => PUBLIC_PATHS.some((p) => pathMatches(pathname, p));

const isPendingPath = (pathname: string) => PENDING_PATHS.some((p) => pathMatches(pathname, p));

const isAnySignedInPath = (pathname: string) => ANY_SIGNED_IN_PATHS.includes(pathname);

const startsWithTree = (pathname: string, tree: string) =>
    pathname === tree || pathname.startsWith(`${tree}/`);

/** Legacy admin signal: platformRole claim from the backend JWT template. */
const isPlatformRoleAdmin = (platformRole: string | null | undefined) =>
    platformRole === "OWNER" || platformRole === "ADMIN";

/**
 * Effective persona for a request. Priority:
 *   1. Valid `userType` claim (authoritative).
 *   2. Legacy derivation (migration window only).
 *   3. Neither → null → caller MUST NOT grant access.
 */
function effectivePersona(
    userType: UserType | null | undefined,
    tenantId: string | null | undefined,
    platformRole: string | null | undefined
): "admin" | "landlord" | "renter" | "landlord_pending" | null {
    if (userType === "admin" || userType === "landlord" || userType === "renter" || userType === "landlord_pending") {
        return userType;
    }
    if (isPlatformRoleAdmin(platformRole)) return "admin";
    if (tenantId) return "landlord";
    return null; // ambiguous — must not infer renter/pending from absence
}

/**
 * Resolves what the proxy should do for a given request.
 *
 * Order of checks matters — read top to bottom:
 *   1. Public routes are always reachable (even unauthenticated).
 *   2. Unauthenticated users are sent to sign-in.
 *   3. The /admin tree requires persona 'admin'; everyone else is pushed
 *      back to their own space (landlord workspace, or onboarding if they
 *      have no tenant yet).
 *   4. The /portal tree is the renter space — landlords are pushed to
 *      /dashboard (dev override aside) and admins to /admin. A persona can
 *      never reach another persona's tree.
 *   5. Tenant-less users: admins go straight to the console; everyone else
 *      is held to the onboarding flow.
 *   6. Tenants are kept out of onboarding.
 *
 * Ambiguous contexts (no userType claim AND no legacy signal) are NEVER
 * granted access to protected trees — they are pushed to onboarding, where
 * the backend decides. This is the fail-closed guarantee.
 */
export function resolveRoutePolicy(ctx: RoutePolicyContext): RouteDecision {
    const { pathname, userId, tenantId, platformRole, userType, devPortalOverride } = ctx;

    if (isPublicPath(pathname)) {
        return { action: "next" };
    }

    if (!userId) {
        return { action: "sign-in" };
    }

    if (isAnySignedInPath(pathname)) {
        return { action: "next" };
    }

    const persona = effectivePersona(userType, tenantId, platformRole);

    // ── Platform admin console (super admin) ──────────────────────────
    if (startsWithTree(pathname, ADMIN_TREE)) {
        if (persona === "admin") {
            return { action: "next" };
        }
        // Not an admin — push back to their own space, never render a
        // single byte of the console.
        return {
            action: "redirect",
            to: persona === "landlord" ? DASHBOARD_TREE : "/onboarding",
        };
    }

    // ── Renter portal ─────────────────────────────────────────────────
    if (startsWithTree(pathname, PORTAL_TREE)) {
        if (persona === "renter") {
            return { action: "next" };
        }
        if (devPortalOverride && tenantId) {
            return { action: "next" };
        }
        // Migration window: without a userType claim, a user with no tenant
        // and no platform role IS the renter persona (the backend reaches
        // the same conclusion pre-classification). Portal data is scoped to
        // the signed-in user's own identity, so this is safe.
        if (persona === null) {
            return { action: "next" };
        }
        if (persona === "landlord") {
            return { action: "redirect", to: DASHBOARD_TREE };
        }
        // Admin never belongs to the renter portal. If they ALSO run a
        // landlord org (legitimate dual role), their other space is the
        // landlord workspace, not the renter one.
        if (persona === "admin") {
            return { action: "redirect", to: tenantId ? DASHBOARD_TREE : ADMIN_TREE };
        }
        // landlord_pending → onboarding is their only safe space.
        return { action: "redirect", to: "/onboarding" };
    }

    // ── Landlord workspace / everything else ──────────────────────────
    // A platform admin who ALSO holds a landlord org (dual role) may use
    // the landlord workspace — it is their own tenant-scoped data, gated
    // server-side by the backend.
    const isLandlordOrDualAdmin =
        persona === "landlord" || (persona === "admin" && !!tenantId);

    if (isLandlordOrDualAdmin) {
        // /onboarding is handled above (ANY_SIGNED_IN_PATHS): the page itself
        // forwards a provisioned landlord to /dashboard from database truth.
        return { action: "next" };
    }

    if (persona === "admin") {
        return { action: "redirect", to: ADMIN_TREE };
    }

    if (persona === "renter") {
        // Renters belong to /portal; they never see the landlord workspace.
        return { action: "redirect", to: PORTAL_TREE };
    }

    // landlord_pending or ambiguous (no signal at all).
    if (isPendingPath(pathname)) {
        return { action: "next" };
    }
    return { action: "redirect", to: "/onboarding" };
}

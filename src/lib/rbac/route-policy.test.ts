// lib/rbac/route-policy.test.ts
//
// Security contract tests for the frontend RBAC route policy.
//
// Personas, strictly separated route trees:
//   - Platform admin (OWNER | ADMIN) → /admin/*
//   - Landlord (tenant_id)            → /dashboard/*
//   - Renter                          → /portal/*
//   - Landlord (pending)              → /onboarding
//
// The `userType` claim is authoritative; when absent (metadata migration
// window) the policy falls back to legacy signals (tenant_id / platformRole)
// via deriveUserTypeFromLegacy. Every persona × route combination is pinned:
//   1. A persona never renders another persona's tree (no cross-persona UI).
//   2. Unauthenticated users are always pushed to sign-in.
//   3. Public routes are always reachable.
//   4. Ambiguous claims are NEVER granted access (fail closed).

import { describe, it, expect } from "vitest";
import { resolveRoutePolicy, type RoutePolicyContext } from "./route-policy";

// ── Personas (userType-claim era) ──────────────────────────────────────────

const adminUser: RoutePolicyContext = {
    pathname: "/admin",
    userId: "u-admin",
    tenantId: undefined,
    platformRole: undefined,
    userType: "admin",
};

// Platform owner who is ALSO a landlord — legitimate dual role.
const dualOwner: RoutePolicyContext = {
    pathname: "/admin",
    userId: "u-dual",
    tenantId: "org-landlord",
    platformRole: undefined,
    userType: "admin",
};

const landlordUser: RoutePolicyContext = {
    pathname: "/dashboard",
    userId: "u-landlord",
    tenantId: "org-landlord",
    platformRole: undefined,
    userType: "landlord",
};

const pendingLandlordUser: RoutePolicyContext = {
    pathname: "/onboarding",
    userId: "u-pending",
    tenantId: undefined,
    platformRole: undefined,
    userType: "landlord_pending",
};

const renterUser: RoutePolicyContext = {
    pathname: "/portal",
    userId: "u-renter",
    tenantId: undefined,
    platformRole: undefined,
    userType: "renter",
};

// ── Legacy-era personas (no userType claim yet) ────────────────────────────

const legacyOwner: RoutePolicyContext = {
    pathname: "/admin",
    userId: "u-owner",
    tenantId: undefined,
    platformRole: "OWNER",
    userType: undefined,
};

const legacyAdmin: RoutePolicyContext = {
    pathname: "/admin",
    userId: "u-admin",
    tenantId: undefined,
    platformRole: "ADMIN",
    userType: undefined,
};

const legacyLandlord: RoutePolicyContext = {
    pathname: "/dashboard",
    userId: "u-legacy-landlord",
    tenantId: "org-landlord",
    platformRole: undefined,
    userType: undefined,
};

const legacyRenter: RoutePolicyContext = {
    pathname: "/portal",
    userId: "u-legacy-renter",
    tenantId: undefined,
    platformRole: undefined,
    userType: undefined,
};

const anon: RoutePolicyContext = {
    pathname: "/dashboard",
    userId: null,
    tenantId: undefined,
    platformRole: undefined,
    userType: undefined,
};

const at = (base: RoutePolicyContext, pathname: string): RoutePolicyContext => ({
    ...base,
    pathname,
});

// ── 1. Unauthenticated ─────────────────────────────────────────────────────

describe("unauthenticated users", () => {
    it("are sent to sign-in from every protected tree", () => {
        for (const path of ["/admin", "/dashboard", "/portal", "/onboarding"]) {
            expect(resolveRoutePolicy(at(anon, path)), path).toEqual({ action: "sign-in" });
        }
    });

    it("can always reach public routes", () => {
        for (const path of ["/", "/listings", "/public/sign-in", "/reserve/abc", "/tenant-required"]) {
            expect(resolveRoutePolicy(at(anon, path)), path).toEqual({ action: "next" });
        }
    });

    it("can read the privacy policy and terms without signing in", () => {
        // A policy page behind a sign-in wall is no policy at all, and these
        // two URLs are quoted in app-store listings and on the sign-up screen,
        // where the reader has no account yet by definition.
        for (const path of ["/legal/privacy", "/legal/terms"]) {
            expect(resolveRoutePolicy(at(anon, path)), path).toEqual({ action: "next" });
        }
    });
});

// ── 2. /admin/* — platform admins only ────────────────────────────────────

describe("/admin/* tree", () => {
    it("allows a userType:admin user", () => {
        expect(resolveRoutePolicy(at(adminUser, "/admin"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(adminUser, "/admin/landlords"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(adminUser, "/admin/commission"))).toEqual({ action: "next" });
    });

    it("allows a dual admin+landlord user", () => {
        expect(resolveRoutePolicy(at(dualOwner, "/admin"))).toEqual({ action: "next" });
    });

    it("allows legacy OWNER / ADMIN platform roles (migration window)", () => {
        expect(resolveRoutePolicy(at(legacyOwner, "/admin"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(legacyAdmin, "/admin/settings"))).toEqual({ action: "next" });
    });

    it("rejects a landlord, redirecting to the landlord workspace", () => {
        expect(resolveRoutePolicy(at(landlordUser, "/admin"))).toEqual({
            action: "redirect",
            to: "/dashboard",
        });
        expect(resolveRoutePolicy(at(landlordUser, "/admin/landlords"))).toEqual({
            action: "redirect",
            to: "/dashboard",
        });
    });

    it("rejects a pending landlord, redirecting to onboarding", () => {
        expect(resolveRoutePolicy(at(pendingLandlordUser, "/admin"))).toEqual({
            action: "redirect",
            to: "/onboarding",
        });
    });

    it("rejects a renter, redirecting to onboarding", () => {
        expect(resolveRoutePolicy(at(renterUser, "/admin"))).toEqual({
            action: "redirect",
            to: "/onboarding",
        });
    });

    it("never lets a non-admin render the console", () => {
        const nonAdmins = [landlordUser, renterUser, pendingLandlordUser, legacyLandlord, legacyRenter, anon];
        for (const persona of nonAdmins) {
            for (const path of ["/admin", "/admin/landlords", "/admin/commission"]) {
                const d = resolveRoutePolicy(at(persona, path));
                expect(d.action, `${persona.userId} @ ${path}`).not.toBe("next");
            }
        }
    });
});

// ── 3. /dashboard/* — landlords only ──────────────────────────────────────

describe("/dashboard/* tree", () => {
    it("allows a landlord", () => {
        expect(resolveRoutePolicy(at(landlordUser, "/dashboard"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(landlordUser, "/dashboard/properties"))).toEqual({ action: "next" });
    });

    it("lets a dual admin use the landlord workspace (their own tenant data)", () => {
        expect(resolveRoutePolicy(at(dualOwner, "/dashboard"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(dualOwner, "/dashboard/properties"))).toEqual({ action: "next" });
    });

    it("routes a tenant-less platform admin to the console instead", () => {
        expect(resolveRoutePolicy(at(adminUser, "/dashboard"))).toEqual({
            action: "redirect",
            to: "/admin",
        });
        expect(resolveRoutePolicy(at(adminUser, "/dashboard/properties"))).toEqual({
            action: "redirect",
            to: "/admin",
        });
    });

    it("routes a renter to the portal", () => {
        expect(resolveRoutePolicy(at(renterUser, "/dashboard"))).toEqual({
            action: "redirect",
            to: "/portal",
        });
    });

    it("holds a pending landlord to onboarding routes only", () => {
        expect(resolveRoutePolicy(at(pendingLandlordUser, "/onboarding"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(pendingLandlordUser, "/pending-review"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(pendingLandlordUser, "/dashboard"))).toEqual({
            action: "redirect",
            to: "/onboarding",
        });
    });

    it("lets a claimed landlord reach onboarding; the page decides from the database", () => {
        // Previously redirected to /dashboard. When Clerk claims "landlord" but
        // the database has no organisation (fresh database, unprovisioned org),
        // that produced a dead end and a dashboard <-> onboarding loop. The
        // onboarding page forwards a genuinely provisioned landlord to
        // /dashboard itself, from backend truth.
        expect(resolveRoutePolicy(at(landlordUser, "/onboarding"))).toEqual({ action: "next" });
    });
});

// ── 4. /portal/* — renter space ───────────────────────────────────────────

describe("/portal/* tree", () => {
    it("allows a renter", () => {
        expect(resolveRoutePolicy(at(renterUser, "/portal"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(renterUser, "/portal/payments"))).toEqual({ action: "next" });
    });

    it("keeps landlords out of the renter portal", () => {
        expect(resolveRoutePolicy(at(landlordUser, "/portal"))).toEqual({
            action: "redirect",
            to: "/dashboard",
        });
    });

    it("keeps an admin out of the renter portal", () => {
        expect(resolveRoutePolicy(at(adminUser, "/portal"))).toEqual({
            action: "redirect",
            to: "/admin",
        });
        expect(resolveRoutePolicy(at(dualOwner, "/portal"))).toEqual({
            action: "redirect",
            to: "/dashboard",
        });
    });

    it("keeps a legacy renter in the portal / onboarding only", () => {
        // Legacy renter (no userType, no tenant) — treated as the renter
        // persona until the metadata migration lands.
        expect(resolveRoutePolicy(at(legacyRenter, "/portal"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(legacyRenter, "/dashboard"))).toEqual({
            action: "redirect",
            to: "/onboarding",
        });
    });

    it("honours the dev-only renter-preview override for landlords", () => {
        const dev = { ...landlordUser, devPortalOverride: true };
        expect(resolveRoutePolicy(at(dev, "/portal"))).toEqual({ action: "next" });
    });
});

// ── 5. Legacy migration window fallbacks ──────────────────────────────────

describe("legacy fallback (no userType claim)", () => {
    it("falls back to /admin for legacy OWNER/ADMIN", () => {
        expect(resolveRoutePolicy(at(legacyOwner, "/dashboard"))).toEqual({
            action: "redirect",
            to: "/admin",
        });
        expect(resolveRoutePolicy(at(legacyAdmin, "/dashboard/anything"))).toEqual({
            action: "redirect",
            to: "/admin",
        });
    });

    it("falls back to /dashboard for legacy tenants", () => {
        expect(resolveRoutePolicy(at(legacyLandlord, "/dashboard"))).toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(legacyLandlord, "/dashboard/properties"))).toEqual({ action: "next" });
    });

    it("never grants a legacy user access to admin", () => {
        expect(resolveRoutePolicy(at(legacyLandlord, "/admin"))).toEqual({
            action: "redirect",
            to: "/dashboard",
        });
        expect(resolveRoutePolicy(at(legacyRenter, "/admin"))).toEqual({
            action: "redirect",
            to: "/onboarding",
        });
    });
});

// ── 6. Cross-persona containment (defense-in-depth guarantee) ─────────────

describe("cross-persona containment", () => {
    const personas = [
        adminUser,
        dualOwner,
        landlordUser,
        pendingLandlordUser,
        renterUser,
        legacyOwner,
        legacyLandlord,
        legacyRenter,
    ];

    it("renders each persona's home tree(s) only", () => {
        const homes: Record<string, string[]> = {
            [adminUser.userId!]: ["/admin"],
            [dualOwner.userId!]: ["/admin", "/dashboard"], // dual role by design
            [landlordUser.userId!]: ["/dashboard"],
            [pendingLandlordUser.userId!]: ["/onboarding", "/pending-review"],
            [renterUser.userId!]: ["/portal"],
            [legacyOwner.userId!]: ["/admin"],
            [legacyLandlord.userId!]: ["/dashboard"],
            [legacyRenter.userId!]: ["/portal", "/onboarding", "/pending-review"],
        };
        for (const persona of personas) {
            for (const tree of ["/admin", "/dashboard", "/portal"]) {
                const d = resolveRoutePolicy(at(persona, tree));
                if (homes[persona.userId!].includes(tree)) {
                    expect(d.action, `${persona.userId} home ${tree}`).toBe("next");
                } else {
                    expect(d.action, `${persona.userId} must be rejected at ${tree}`).not.toBe("next");
                }
            }
        }
    });

    it("treats unknown platform roles exactly like no role (fail closed)", () => {
        const unknown: RoutePolicyContext = {
            pathname: "/admin",
            userId: "u-unknown",
            tenantId: undefined,
            platformRole: "SUPER_SECRET_BACKDOOR",
            userType: undefined,
        };
        expect(resolveRoutePolicy(unknown).action).not.toBe("next");
        expect(resolveRoutePolicy({ ...unknown, pathname: "/dashboard" })).toEqual({
            action: "redirect",
            to: "/onboarding",
        });
    });
});

// ── Post-sign-in router and onboarding: reachable by every signed-in user ──

describe("/continue and /onboarding", () => {
    it("require sign-in", () => {
        for (const pathname of ["/continue", "/onboarding"]) {
            expect(
                resolveRoutePolicy({ pathname, userId: null, tenantId: undefined, platformRole: undefined })
            ).toEqual({ action: "sign-in" });
        }
    });

    it("admit every signed-in persona, whatever the claims say", () => {
        const personas: RoutePolicyContext[] = [adminUser, dualOwner, landlordUser, pendingLandlordUser, renterUser];
        for (const persona of personas) {
            expect(resolveRoutePolicy(at(persona, "/continue")), persona.userId!).toEqual({ action: "next" });
            expect(resolveRoutePolicy(at(persona, "/onboarding")), persona.userId!).toEqual({ action: "next" });
        }
    });

    it("do not widen anything else: prefixes of those paths are not admitted", () => {
        expect(resolveRoutePolicy(at(renterUser, "/continue/admin"))).not.toEqual({ action: "next" });
        expect(resolveRoutePolicy(at(renterUser, "/onboardingx"))).not.toEqual({ action: "next" });
    });
});

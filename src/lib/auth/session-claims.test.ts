// lib/auth/session-claims.test.ts
//
// Security contract tests for claims parsing + userType resolution.
// Guarantees:
//   - Valid claims parse; malformed claims throw (fail closed).
//   - userType present → authoritative.
//   - userType absent  → legacy derivation mirrors backend DB roles.
//   - No `any` escapes; every path returns a typed result.

import { describe, it, expect } from "vitest";
import { InvalidClaimsError } from "./errors";
import {
    parseSessionClaims,
    extractRouteClaims,
    deriveUserTypeFromLegacy,
    resolveUserType,
} from "./session-claims";

describe("parseSessionClaims", () => {
    it("parses a full valid claim set", () => {
        const parsed = parseSessionClaims({
            sub: "user_123",
            tenant_id: "org_456",
            userType: "landlord",
            platformRole: null,
            sid: "sess_1",
        });
        expect(parsed.sub).toBe("user_123");
        expect(parsed.tenant_id).toBe("org_456".replace("456", "456"));
        expect(parsed.userType).toBe("landlord");
    });

    it("accepts missing optional claims (unclassified migration state)", () => {
        const parsed = parseSessionClaims({ sub: "user_123" });
        expect(parsed.userType).toBeUndefined();
        expect(parsed.tenant_id).toBeUndefined();
    });

    it("throws on non-object input", () => {
        for (const bad of [null, undefined, "nope", 42, []]) {
            expect(() => parseSessionClaims(bad)).toThrow(InvalidClaimsError);
        }
    });

    it("throws on structurally invalid claim values", () => {
        expect(() => parseSessionClaims({ sub: 42 })).toThrow(InvalidClaimsError);
        expect(() => parseSessionClaims({ userType: "superuser" })).toThrow(InvalidClaimsError);
    });
});

describe("extractRouteClaims", () => {
    it("maps claim shapes to the routing shape", () => {
        const claims = extractRouteClaims({
            sub: "u-1",
            tenant_id: "org-a",
            userType: "renter",
            platformRole: undefined,
        });
        expect(claims).toEqual({
            userId: "u-1",
            tenantId: "org-a",
            userType: "renter",
            platformRole: undefined,
        });
    });

    it("normalizes absent userId to null", () => {
        const claims = extractRouteClaims({ tenant_id: "org-a" });
        expect(claims.userId).toBeNull();
    });
});

describe("deriveUserTypeFromLegacy (migration window)", () => {
    it("platform role → admin", () => {
        expect(deriveUserTypeFromLegacy({ tenantId: "org-x", platformRole: "OWNER" })).toBe("admin");
        expect(deriveUserTypeFromLegacy({ tenantId: undefined, platformRole: "ADMIN" })).toBe("admin");
    });

    it("tenant without platform role → landlord", () => {
        expect(deriveUserTypeFromLegacy({ tenantId: "org-x", platformRole: undefined })).toBe("landlord");
    });

    it("no tenant, no platform role → renter (indistinguishable from pending until claim present)", () => {
        expect(deriveUserTypeFromLegacy({ tenantId: undefined, platformRole: undefined })).toBe("renter");
    });

    it("unknown platform roles are ignored (fail closed — not auto-admin)", () => {
        expect(deriveUserTypeFromLegacy({ tenantId: undefined, platformRole: "SUPERUSER" as never })).toBe("renter");
    });
});

describe("resolveUserType (authoritative claim wins)", () => {
    it("claim beats legacy signals", () => {
        // Claim says renter, legacy says admin (platformRole) → the claim
        // is the single source of truth; anything else is drift to audit.
        expect(
            resolveUserType({ userType: "renter", tenantId: undefined, platformRole: "OWNER" })
        ).toBe("renter");
    });

    it("falls back to legacy when claim missing", () => {
        expect(
            resolveUserType({ userType: undefined, tenantId: "org-a", platformRole: undefined })
        ).toBe("landlord");
        expect(
            resolveUserType({ userType: null, tenantId: undefined, platformRole: "ADMIN" })
        ).toBe("admin");
    });
});
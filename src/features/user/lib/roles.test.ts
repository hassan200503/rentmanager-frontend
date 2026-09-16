import { describe, expect, it } from "vitest";
import { hasRole, WRITE_ROLES } from "./roles";
import { UserRole } from "../types/user";

/**
 * hasRole() is the single predicate that gates every write control in the
 * frontend. WRITE_ROLES is the canonical set shared across all media and
 * command controllers. Testing the pure logic here means any regression in
 * the access-control rules fails loudly before it reaches a browser.
 */

describe("WRITE_ROLES", () => {
    it("contains OWNER and MANAGER", () => {
        expect(WRITE_ROLES).toContain(UserRole.OWNER);
        expect(WRITE_ROLES).toContain(UserRole.MANAGER);
    });

    it("does not contain STAFF", () => {
        // STAFF is read-only on all write endpoints (@PreAuthorize on the
        // backend). The frontend hides the controls via WRITE_ROLES — both
        // sides must agree on this boundary.
        expect(WRITE_ROLES).not.toContain(UserRole.STAFF);
    });
});

describe("hasRole", () => {
    it("returns true when the role is in the allowed list", () => {
        expect(hasRole(UserRole.OWNER, WRITE_ROLES)).toBe(true);
        expect(hasRole(UserRole.MANAGER, WRITE_ROLES)).toBe(true);
    });

    it("returns false when the role is not in the allowed list", () => {
        expect(hasRole(UserRole.STAFF, WRITE_ROLES)).toBe(false);
    });

    it("returns false when role is null (user still loading)", () => {
        // useCurrentUser() returns null while the query is in-flight.
        // Controls must stay hidden during load, not flash as permitted.
        expect(hasRole(null, WRITE_ROLES)).toBe(false);
    });

    it("returns false when role is undefined", () => {
        expect(hasRole(undefined, WRITE_ROLES)).toBe(false);
    });

    it("returns false against an empty allowed list", () => {
        expect(hasRole(UserRole.OWNER, [])).toBe(false);
        expect(hasRole(UserRole.MANAGER, [])).toBe(false);
    });

    it("returns true for STAFF when STAFF is in the allowed list", () => {
        // STAFF can read: some query-only controls pass all three roles.
        expect(hasRole(UserRole.STAFF, [UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF])).toBe(true);
    });
});

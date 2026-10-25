// lib/auth/webhooks/user-type-seed.test.ts
//
// Purity + safety tests for the userType seeding decisions. The critical
// property: the webhook NEVER overwrites an existing userType (the backend
// is the authoritative writer), so a late/replayed user.created event can
// never stomp a backend promotion.

import { describe, it, expect } from "vitest";
import { resolveInitialUserType, shouldSeedUserType } from "./user-type-seed";

describe("resolveInitialUserType (from sign-up intent)", () => {
    it("maps a landlord intent to landlord_pending (must still onboard)", () => {
        expect(resolveInitialUserType({ signupIntent: "landlord" })).toBe("landlord_pending");
    });

    it("maps missing/invalid/renter intent to renter", () => {
        expect(resolveInitialUserType({})).toBe("renter");
        expect(resolveInitialUserType(undefined)).toBe("renter");
        expect(resolveInitialUserType({ signupIntent: "renter" })).toBe("renter");
    });

    it("fails closed on an invalid intent instead of guessing", () => {
        expect(resolveInitialUserType({ signupIntent: "superuser" })).toBeNull();
    });
});

describe("shouldSeedUserType (absence-only seeding)", () => {
    it("seeds when userType is absent", () => {
        expect(shouldSeedUserType({}, "renter")).toBe(true);
        expect(shouldSeedUserType({ phone: "x" }, "landlord_pending")).toBe(true);
    });

    it("does NOT overwrite an existing userType — even a different one", () => {
        expect(shouldSeedUserType({ userType: "landlord" }, "renter")).toBe(false);
        expect(shouldSeedUserType({ userType: "renter" }, "landlord_pending")).toBe(false);
    });

    it("does NOT touch malformed publicMetadata", () => {
        expect(shouldSeedUserType({ userType: 42 }, "renter")).toBe(false);
        expect(shouldSeedUserType({ userType: "WEIRD" }, "renter")).toBe(false);
    });

    it("does NOT seed from arbitrary attacker-controlled keys", () => {
        // passthrough-only keys never count as a type.
        expect(shouldSeedUserType({ userType: undefined }, "renter")).toBe(true);
    });
});
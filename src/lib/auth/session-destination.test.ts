import { describe, it, expect } from "vitest";
import { resolveSessionDestination } from "./session-destination";
import type { SessionAccess } from "@/features/user/types/user";

const none: SessionAccess = {
    userId: "u1",
    landlordRole: null,
    landlordTenantId: null,
    renter: false,
    pendingOnboarding: true,
    platformAdmin: false,
};

describe("resolveSessionDestination", () => {
    it("sends a platform admin to the console, even one who also runs an organisation", () => {
        expect(resolveSessionDestination({ ...none, platformAdmin: true })).toBe("/admin");
        expect(
            resolveSessionDestination({ ...none, platformAdmin: true, landlordRole: "OWNER", landlordTenantId: "t1" })
        ).toBe("/admin");
    });

    it("sends every landlord role to the dashboard", () => {
        for (const landlordRole of ["OWNER", "MANAGER", "STAFF"] as const) {
            expect(
                resolveSessionDestination({ ...none, landlordRole, landlordTenantId: "t1", pendingOnboarding: false })
            ).toBe("/dashboard");
        }
    });

    it("does not treat a role without an organisation as a landlord", () => {
        expect(resolveSessionDestination({ ...none, landlordRole: "OWNER", landlordTenantId: null })).toBe("/onboarding");
    });

    it("sends a renter to the portal", () => {
        expect(resolveSessionDestination({ ...none, renter: true, pendingOnboarding: false })).toBe("/portal");
    });

    it("sends a new account to onboarding unless it signed up as a renter", () => {
        expect(resolveSessionDestination(none)).toBe("/onboarding");
        expect(resolveSessionDestination(none, "landlord")).toBe("/onboarding");
        expect(resolveSessionDestination(none, "renter")).toBe("/portal");
    });

    it("ignores a self-declared intent once the backend knows who the person is", () => {
        expect(resolveSessionDestination({ ...none, landlordRole: "OWNER", landlordTenantId: "t1" }, "renter")).toBe(
            "/dashboard"
        );
        expect(resolveSessionDestination({ ...none, renter: true }, "landlord")).toBe("/portal");
    });

    it("never trusts junk intent values", () => {
        expect(resolveSessionDestination(none, "admin")).toBe("/onboarding");
        expect(resolveSessionDestination(none, { role: "admin" })).toBe("/onboarding");
    });
});

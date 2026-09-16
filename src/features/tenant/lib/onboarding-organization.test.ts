import { describe, it, expect } from "vitest";
import { decideOnboardingOrganization } from "./onboarding-organization";

describe("decideOnboardingOrganization", () => {
    it("creates an organisation for a brand-new landlord with none active", () => {
        expect(decideOnboardingOrganization({ organizationId: null, membershipRole: null })).toEqual({ action: "create" });
        expect(decideOnboardingOrganization({ organizationId: undefined, membershipRole: undefined })).toEqual({
            action: "create",
        });
    });

    it("reuses an active organisation the person administers (retry, or one they made)", () => {
        expect(decideOnboardingOrganization({ organizationId: "org_1", membershipRole: "org:admin" })).toEqual({
            action: "reuse",
            organizationId: "org_1",
        });
    });

    it("never onboards into an organisation the person was only invited to", () => {
        for (const membershipRole of ["org:member", "org:manager", "", null, undefined, "admin", "ORG:ADMIN"]) {
            expect(
                decideOnboardingOrganization({ organizationId: "org_someone_else", membershipRole }),
                String(membershipRole)
            ).toEqual({ action: "create" });
        }
    });
});

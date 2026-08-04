import { describe, expect, it } from "vitest";
import { propertySchema } from "./property-schema";
import { PremisesType, PropertyType, derivePremisesType, isPremisesOverrideContradicting } from "../types/property";

const validBase = {
    name: "Green Villa",
    propertyType: PropertyType.APARTMENT,
    premisesType: undefined as PremisesType | undefined,
    premisesTypeOverrideReason: "",
    description: "A villa",
    address: {
        streetAddress: "1 Mombasa Road",
        city: "Mombasa",
        state: "",
        postalCode: "",
        country: "Kenya",
    },
    geoLocation: { latitude: 0, longitude: 0 },
    dimensions: { totalArea: 100, occupiedArea: 0, unitCount: 1 },
};

const parse = (patch: Partial<typeof validBase>) =>
    propertySchema.safeParse({ ...validBase, ...patch });

describe("propertySchema premises-classification governance", () => {
    it("accepts auto-classified property with no override", () => {
        const result = parse({ premisesType: undefined, premisesTypeOverrideReason: "" });
        expect(result.success).toBe(true);
    });

    it("rejects an override without a reason", () => {
        const result = parse({ premisesType: PremisesType.COMMERCIAL, premisesTypeOverrideReason: "" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toEqual(["premisesTypeOverrideReason"]);
        }
    });

    it("accepts an override with a reason", () => {
        const result = parse({
            premisesType: PremisesType.MIXED_USE,
            premisesTypeOverrideReason: "Ground-floor shops, flats above",
        });
        expect(result.success).toBe(true);
    });

    it("rejects a reason without an override", () => {
        const result = parse({ premisesType: undefined, premisesTypeOverrideReason: "No override here" });
        expect(result.success).toBe(false);
    });

    it("rejects an over-length reason", () => {
        const result = parse({
            premisesType: PremisesType.RESIDENTIAL,
            premisesTypeOverrideReason: "x".repeat(501),
        });
        expect(result.success).toBe(false);
    });
});

describe("derivePremisesType / isPremisesOverrideContradicting", () => {
    it("derives COMMERCIAL for commercial types, RESIDENTIAL otherwise", () => {
        expect(derivePremisesType(PropertyType.WAREHOUSE)).toBe(PremisesType.COMMERCIAL);
        expect(derivePremisesType(PropertyType.OFFICE)).toBe(PremisesType.COMMERCIAL);
        expect(derivePremisesType(PropertyType.COMMERCIAL)).toBe(PremisesType.COMMERCIAL);
        expect(derivePremisesType(PropertyType.APARTMENT)).toBe(PremisesType.RESIDENTIAL);
        expect(derivePremisesType(PropertyType.AIRBNB)).toBe(PremisesType.RESIDENTIAL);
        expect(derivePremisesType(PropertyType.HOSTEL)).toBe(PremisesType.RESIDENTIAL);
    });

    it("flags overrides that contradict the auto-derivation", () => {
        expect(isPremisesOverrideContradicting(PropertyType.APARTMENT, PremisesType.COMMERCIAL)).toBe(true);
        expect(isPremisesOverrideContradicting(PropertyType.WAREHOUSE, PremisesType.RESIDENTIAL)).toBe(true);
        expect(isPremisesOverrideContradicting(PropertyType.APARTMENT, PremisesType.RESIDENTIAL)).toBe(false);
        expect(isPremisesOverrideContradicting(PropertyType.WAREHOUSE, PremisesType.COMMERCIAL)).toBe(false);
        expect(isPremisesOverrideContradicting(PropertyType.APARTMENT, PremisesType.MIXED_USE)).toBe(true);
    });

    it("treats missing inputs as non-contradicting", () => {
        expect(isPremisesOverrideContradicting(undefined, PremisesType.RESIDENTIAL)).toBe(false);
        expect(isPremisesOverrideContradicting(PropertyType.APARTMENT, undefined)).toBe(false);
    });
});

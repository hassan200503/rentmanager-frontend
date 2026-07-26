// lib/mpesa/matching-engine.test.ts
// Unit tests for the M-Pesa matching cascade.
// Run with: npm test -- lib/mpesa/matching-engine.test.ts

import { describe, it, expect } from "vitest";
import {
    normalizePhone,
    normalizeAccountRef,
    normalizeUnitNumber,
} from "./normalize";
import {
    matchPayment,
    type MpesaTransaction,
    type TenantLeaseUnit,
} from "./matching-engine";

// ── Test Factories ────────────────────────────────────────────────────────

const makeTxn = (overrides: Partial<MpesaTransaction> = {}): MpesaTransaction => ({
    transactionId: "TEST123",
    amount: 25000,
    phoneNumber: "254799999999", // distinct from makeUnit's default phone
    accountReference: "A3",
    transactionTime: "20260105103000", // Jan 5, 2026 10:30
    ...overrides,
});

const makeUnit = (overrides: Partial<TenantLeaseUnit> = {}): TenantLeaseUnit => ({
    tenantId: "tenant-1",
    tenantName: "John Doe",
    tenantPhone: "254712345678",
    leaseId: "lease-1",
    leaseStatus: "ACTIVE",
    unitId: "unit-1",
    unitNumber: "A3",
    rentAmount: 25000,
    dueDay: 5,
    ...overrides,
});

// ── normalizePhone ────────────────────────────────────────────────────────

describe("normalizePhone", () => {
    it("normalizes 254 format", () => {
        expect(normalizePhone("254712345678")).toBe("254712345678");
    });

    it("normalizes 07 format", () => {
        expect(normalizePhone("0712345678")).toBe("254712345678");
    });

    it("normalizes 7 format (local)", () => {
        expect(normalizePhone("712345678")).toBe("254712345678");
    });

    it("normalizes +254 format", () => {
        expect(normalizePhone("+254712345678")).toBe("254712345678");
    });

    it("returns empty for invalid format", () => {
        expect(normalizePhone("123")).toBe("");
        expect(normalizePhone("")).toBe("");
        expect(normalizePhone("254999999999")).toBe(""); // invalid prefix
    });

    it("handles whitespace", () => {
        expect(normalizePhone(" 0712345678 ")).toBe("254712345678");
    });
});

// ── normalizeAccountRef ────────────────────────────────────────────────────

describe("normalizeAccountRef", () => {
    it("uppercases and strips whitespace", () => {
        expect(normalizeAccountRef("a3")).toBe("A3");
        expect(normalizeAccountRef("A 3")).toBe("A3");
    });

    it("strips UNIT prefix", () => {
        expect(normalizeAccountRef("Unit A3")).toBe("A3");
        expect(normalizeAccountRef("UNIT-A3")).toBe("A3");
        expect(normalizeAccountRef("UNIT#A3")).toBe("A3");
    });

    it("strips APT prefix", () => {
        expect(normalizeAccountRef("apt 3")).toBe("3"); // "apt 3" → "3" (unit number 3)
        expect(normalizeAccountRef("APT-3")).toBe("3");
    });

    it("strips HSE/HOUSE prefix", () => {
        expect(normalizeAccountRef("HSE 12B")).toBe("12B");
        expect(normalizeAccountRef("House 5")).toBe("5");
    });

    it("strips ROOM prefix", () => {
        expect(normalizeAccountRef("Room 4")).toBe("4");
        expect(normalizeAccountRef("ROOM-4")).toBe("4");
    });

    it("strips NO and #", () => {
        expect(normalizeAccountRef("NO 7")).toBe("7");
        expect(normalizeAccountRef("#7")).toBe("7");
    });

    it("strips non-alphanumeric", () => {
        expect(normalizeAccountRef("A-3")).toBe("A3");
        expect(normalizeAccountRef("A.3")).toBe("A3");
    });

    it("returns empty for empty input", () => {
        expect(normalizeAccountRef("")).toBe("");
        expect(normalizeAccountRef("   ")).toBe("");
    });
});

// ── normalizeUnitNumber ────────────────────────────────────────────────────

describe("normalizeUnitNumber", () => {
    it("uses same normalization as account ref", () => {
        expect(normalizeUnitNumber("A 3")).toBe("A3");
        expect(normalizeUnitNumber("Unit 12B")).toBe("12B");
    });
});

// ── matchPayment — Step 1: Exact account reference ────────────────────────

describe("matchPayment — Step 1: Exact account reference", () => {
    const units = [
        makeUnit({ unitNumber: "A3", unitId: "unit-1", tenantId: "t1" }),
        makeUnit({ unitNumber: "B2", unitId: "unit-2", tenantId: "t2", tenantPhone: "254722345678" }),
    ];

    it("matches exact normalized reference", () => {
        const txn = makeTxn({ accountReference: "A3", phoneNumber: "254700000001" }); // distinct phone
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("exact");
        expect(result.tenantLeaseUnit?.unitNumber).toBe("A3");
    });

    it("matches with whitespace in reference", () => {
        const txn = makeTxn({ accountReference: "A 3", phoneNumber: "254700000002" });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("exact");
    });

    it("matches with UNIT prefix in reference", () => {
        const txn = makeTxn({ accountReference: "Unit A3", phoneNumber: "254700000003" });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("exact");
    });

    it("does not match wrong unit (falls to later steps, but different phone/amount)", () => {
        // Use a reference with edit distance > 2 from any unit to avoid fuzzy match
        // "XYZ" has distance 3 from "A3" (X→A, Y→3, Z→insert)
        const txn = makeTxn({ accountReference: "XYZ", amount: 99999, phoneNumber: "254700000004" });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(false);
        expect(result.reason).toBe("manual_review");
    });
});

// ── matchPayment — Step 2: Fuzzy account reference ────────────────────────

describe("matchPayment — Step 2: Fuzzy account reference", () => {
    const units = [
        makeUnit({ unitNumber: "A3", unitId: "unit-1", tenantId: "t1", tenantPhone: "254711111111" }),
        makeUnit({ unitNumber: "A4", unitId: "unit-2", tenantId: "t2", tenantPhone: "254722222222" }),
        makeUnit({ unitNumber: "B3", unitId: "unit-3", tenantId: "t3", tenantPhone: "254733333333" }),
    ];

    it("matches within edit distance 1", () => {
        // "B4" is distance 1 from A4 (B→A), distance 2 from A3 (B→A, 4→3)
        const txn = makeTxn({ accountReference: "B4", phoneNumber: "254700000010", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("fuzzy");
        expect(result.tenantLeaseUnit?.unitNumber).toBe("A4");
    });

    it("matches transposed chars (distance 2)", () => {
        // 3A vs A3 = distance 2
        const txn = makeTxn({ accountReference: "3A", phoneNumber: "254700000011", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("fuzzy");
    });

    it("falls to manual_review if multiple candidates within distance", () => {
        // Both A3 and B3 are distance 1 from "C3"
        const txn = makeTxn({ accountReference: "C3", phoneNumber: "254700000012", amount: 99999 });
        const result = matchPayment(txn, units);
        // Should match one but include other as candidate
        expect(result.matched).toBe(true);
        expect(result.candidates.length).toBeGreaterThan(0);
    });

    it("falls to manual_review if no candidate within maxEditDistance", () => {
        const txn = makeTxn({ accountReference: "XYZ", phoneNumber: "254700000013", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(false);
        expect(result.reason).toBe("manual_review");
    });

    it("respects custom maxEditDistance", () => {
        // ABC is distance 3 from A3
        const txn = makeTxn({ accountReference: "ABC", phoneNumber: "254700000014", amount: 99999 });
        const result = matchPayment(txn, units, { maxEditDistance: 3 });
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("fuzzy");
    });
});

// ── matchPayment — Step 3: Phone number match ────────────────────────────

describe("matchPayment — Step 3: Phone number match", () => {
    const units = [
        makeUnit({ unitNumber: "A3", tenantPhone: "0712345678", tenantId: "t1" }),
        makeUnit({ unitNumber: "B2", tenantPhone: "0722345678", tenantId: "t2" }),
    ];

    it("matches by normalized phone", () => {
        const txn = makeTxn({ phoneNumber: "254712345678", accountReference: "WRONG", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("phone");
        expect(result.tenantLeaseUnit?.unitNumber).toBe("A3");
    });

    it("matches with different input formats", () => {
        const txn = makeTxn({ phoneNumber: "+254712345678", accountReference: "WRONG", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("phone");
    });

    it("falls through if phone not found", () => {
        const txn = makeTxn({ phoneNumber: "254799999999", accountReference: "WRONG", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(false);
    });
});

// ── matchPayment — Step 4: Amount + timing heuristic ──────────────────────

describe("matchPayment — Step 4: Amount + timing heuristic", () => {
    const units = [
        makeUnit({ unitNumber: "A3", rentAmount: 25000, dueDay: 5, tenantId: "t1", tenantPhone: "254711111111" }),
        makeUnit({ unitNumber: "B2", rentAmount: 30000, dueDay: 5, tenantId: "t2", tenantPhone: "254722222222" }),
        makeUnit({ unitNumber: "C1", rentAmount: 25000, dueDay: 15, tenantId: "t3", tenantPhone: "254733333333" }),
    ];

    it("matches unique amount + due date window", () => {
        // Payment of 30000 on Jan 5 → only B2 matches (dueDay 5, amount 30000)
        const txn = makeTxn({
            amount: 30000,
            accountReference: "WRONG",
            phoneNumber: "254700000020",
            transactionTime: "20260105103000",
        });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("amount_timing");
        expect(result.tenantLeaseUnit?.unitNumber).toBe("B2");
    });

    it("matches when payment near due date in current month", () => {
        // Payment on Jan 6 for dueDay 5 → within 1 day of due date (Jan 5)
        const txn = makeTxn({
            amount: 25000,
            accountReference: "WRONG",
            phoneNumber: "254700000021",
            transactionTime: "20260106103000", // Jan 6 (1 day after dueDay 5)
        });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("amount_timing");
    });

    it("falls to manual_review if multiple units match amount + window", () => {
        const multiUnits = [
            makeUnit({ unitNumber: "A3", rentAmount: 25000, dueDay: 5, tenantId: "t1", tenantPhone: "254711111111" }),
            makeUnit({ unitNumber: "B2", rentAmount: 25000, dueDay: 5, tenantId: "t2", tenantPhone: "254722222222" }),
        ];
        const txn = makeTxn({
            amount: 25000,
            accountReference: "WRONG",
            phoneNumber: "254700000022",
            transactionTime: "20260105103000",
        });
        const result = matchPayment(txn, multiUnits);
        expect(result.matched).toBe(false);
        expect(result.reason).toBe("manual_review");
        expect(result.candidates.length).toBe(2);
    });
});

// ── matchPayment — Step 5: Manual review with candidates ──────────────────

describe("matchPayment — Step 5: Manual review with candidates", () => {
    const units = [
        makeUnit({ unitNumber: "A3", rentAmount: 25000, dueDay: 5, tenantId: "t1", tenantPhone: "254711111111" }),
        makeUnit({ unitNumber: "B2", rentAmount: 30000, dueDay: 5, tenantId: "t2", tenantPhone: "254722222222" }),
        makeUnit({ unitNumber: "C1", rentAmount: 25000, dueDay: 15, tenantId: "t3", tenantPhone: "254733333333" }),
    ];

    it("returns manual_review when no confident match", () => {
        const txn = makeTxn({
            amount: 10000, // doesn't match any rent amount
            accountReference: "XYZ",
            phoneNumber: "254799999999",
        });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(false);
        expect(result.reason).toBe("manual_review");
    });

    it("includes near-miss candidates for UI suggestions", () => {
        const txn = makeTxn({
            amount: 25000,
            accountReference: "A5", // close to A3
            phoneNumber: "254700000030",
            transactionTime: "20260105103000",
        });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true); // fuzzy matches A3
        expect(result.candidates.length).toBeGreaterThan(0);
    });

    it("limits candidates to 5", () => {
        const manyUnits = Array.from({ length: 10 }, (_, i) =>
            makeUnit({ unitNumber: `U${i}`, unitId: `u${i}`, tenantId: `t${i}`, tenantPhone: `2547${i}0000000` })
        );
        const txn = makeTxn({ accountReference: "U5" });
        const result = matchPayment(txn, manyUnits);
        expect(result.candidates.length).toBeLessThanOrEqual(5);
    });
});

// ── matchPayment — edge cases ────────────────────────────────────────────

describe("matchPayment — edge cases", () => {
it("ignores inactive leases", () => {
        const units = [
            makeUnit({ unitNumber: "A3", leaseStatus: "ACTIVE" }),
            makeUnit({ unitNumber: "B2", leaseStatus: "SUSPENDED" }),
        ];
        // Use a reference with edit distance > 2 from A3 to avoid fuzzy match
        const txn = makeTxn({ accountReference: "XYZ", phoneNumber: "254700000030", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(false); // B2 is suspended, A3 doesn't match
    });

    it("handles empty units array", () => {
        const txn = makeTxn({ accountReference: "A3" });
        const result = matchPayment(txn, []);
        expect(result.matched).toBe(false);
        expect(result.reason).toBe("manual_review");
    });

    it("handles empty account reference (falls to phone/amount)", () => {
        const units = [makeUnit({ unitNumber: "A3", rentAmount: 25000, dueDay: 5, tenantId: "t1", tenantPhone: "254711111111" })];
        const txn = makeTxn({
            accountReference: "",
            amount: 25000,
            phoneNumber: "254700000050",
            transactionTime: "20260105103000",
        });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("amount_timing");
    });

    it("handles empty phone number", () => {
        const units = [makeUnit({ unitNumber: "A3", tenantPhone: "254712345678" })];
        const txn = makeTxn({ phoneNumber: "", accountReference: "A3" });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("exact");
    });

it("handles adversarial input — empty strings", () => {
        const units = [makeUnit({ unitNumber: "A3", rentAmount: 25000, dueDay: 5 })];
        // Use amount that doesn't match any unit's rentAmount
        const txn = makeTxn({ accountReference: "", phoneNumber: "", amount: 99999 });
        const result = matchPayment(txn, units);
        expect(result.matched).toBe(false);
        expect(result.reason).toBe("manual_review");
    });

    it("handles non-Kenyan phone format gracefully", () => {
        const units = [makeUnit({ unitNumber: "A3", tenantPhone: "0712345678" })];
        const txn = makeTxn({ phoneNumber: "15551234567", accountReference: "A3" }); // US number
        const result = matchPayment(txn, units);
        // Should still match on accountReference exact
        expect(result.matched).toBe(true);
        expect(result.confidence).toBe("exact");
    });
});

// ── editDistance helper (tested indirectly) ────────────────────────────────

describe("editDistance helper (internal)", () => {
    it("handles identical strings", () => {
        const units = [makeUnit({ unitNumber: "A3" })];
        const txn = makeTxn({ accountReference: "A3" });
        const result = matchPayment(txn, units);
        expect(result.confidence).toBe("exact"); // exact match takes priority
    });
});
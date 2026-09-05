import { describe, expect, it } from "vitest";
import { formatCurrency, formatCurrencyPrecise, formatRate, toMoneyNumber } from "./money";

/**
 * Every money figure a renter or landlord sees goes through these four
 * functions. They had no test coverage at all until now, which is how a
 * rounding change could have altered every amount in the product silently.
 *
 * The assertions below deliberately compare on digits and separators rather
 * than the exact currency prefix: Intl renders KES as "Ksh" or "KES"
 * depending on the ICU data bundled with the runtime, and pinning that would
 * make these tests fail on a different Node build for a reason that has
 * nothing to do with the behaviour being protected.
 */

const digits = (formatted: string) => formatted.replace(/[^\d.,-]/g, "").trim();

describe("toMoneyNumber", () => {
    it("accepts the string the backend actually sends", () => {
        // Every BigDecimal crosses the wire as a JSON string; a raw number
        // would become an IEEE-754 double on the way to a renter's screen.
        expect(toMoneyNumber("15000.00")).toBe(15000);
    });

    it("treats absent values as zero rather than NaN", () => {
        expect(toMoneyNumber(null)).toBe(0);
        expect(toMoneyNumber(undefined)).toBe(0);
        expect(toMoneyNumber("")).toBe(0);
    });

    it("refuses to propagate a non-finite value into arithmetic", () => {
        expect(toMoneyNumber("not-a-number")).toBe(0);
        expect(toMoneyNumber(Infinity)).toBe(0);
    });

    it("keeps negative amounts negative", () => {
        expect(toMoneyNumber("-250.50")).toBe(-250.5);
    });
});

describe("formatCurrency", () => {
    it("shows whole shillings without decimals", () => {
        expect(digits(formatCurrency("15000"))).toBe("15,000");
    });

    it("renders exact zero as a whole number, never 0.00", () => {
        // A zero balance shown to 2dp beside whole-shilling figures reads as
        // sloppy, and this is the most common value on a settled account.
        expect(digits(formatCurrency(0))).toBe("0");
        expect(digits(formatCurrency(null))).toBe("0");
    });

    it("keeps the cents on a genuine sub-shilling amount", () => {
        // Four separate call sites independently implemented this rule
        // before it was consolidated here: proration and overpayment
        // reconciliation can land under one shilling, and rounding those to
        // "Ksh 0" or "Ksh 1" misstates a real figure.
        expect(digits(formatCurrency("0.50"))).toBe("0.50");
        expect(digits(formatCurrency("-0.75"))).toBe("-0.75");
    });

    it("does not apply the sub-unit rule to amounts of one shilling or more", () => {
        expect(digits(formatCurrency("1"))).toBe("1");
        expect(digits(formatCurrency("1.49"))).toBe("1");
    });

    it("lets a caller override the rounding explicitly", () => {
        expect(digits(formatCurrency("1.49", { maximumFractionDigits: 2 }))).toBe("1.49");
    });

    it("honours a non-default currency", () => {
        expect(formatCurrency("100", { currency: "USD" })).toContain("100");
    });
});

describe("formatCurrencyPrecise", () => {
    it("always shows two decimals, including on whole amounts", () => {
        // Receipts and statements are reconciled line by line against an
        // M-Pesa message, so the scale has to be stable down the column.
        expect(digits(formatCurrencyPrecise("15000"))).toBe("15,000.00");
        expect(digits(formatCurrencyPrecise("0"))).toBe("0.00");
    });
});

describe("formatRate", () => {
    it("renders a commission rate at two decimals", () => {
        expect(formatRate("5.00")).toBe("5.00%");
        expect(formatRate("7.5")).toBe("7.50%");
    });

    it("shows a dash rather than 0% when no rate is set", () => {
        // "0%" is a claim about the commission; absence is not.
        expect(formatRate(null)).toBe("—");
        expect(formatRate(undefined)).toBe("—");
        expect(formatRate("")).toBe("—");
    });
});

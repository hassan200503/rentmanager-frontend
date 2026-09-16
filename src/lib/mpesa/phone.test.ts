import { describe, expect, it } from "vitest";

import { isValidMpesaPhone, normalizeMpesaPhone } from "./phone";

describe("M-Pesa phone", () => {
    it.each([
        ["0712345678", "254712345678"],
        ["712345678", "254712345678"],
        ["+254 712 345 678", "254712345678"],
        ["0112345678", "254112345678"],
        ["254112345678", "254112345678"],
    ])("accepts %s", (input, expected) => {
        expect(normalizeMpesaPhone(input)).toBe(expected);
        expect(isValidMpesaPhone(input)).toBe(true);
    });

    it.each(["071234567", "0212345678", "0122345678", "255712345678", ""])("rejects %s", (input) => {
        expect(isValidMpesaPhone(input)).toBe(false);
    });
});

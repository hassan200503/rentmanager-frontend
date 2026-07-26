// lib/mpesa/normalize.ts
// Pure normalization utilities for M-Pesa matching — no side effects, no dependencies.

/**
 * Normalize a Kenyan phone number to canonical form: 254XXXXXXXXX (no leading +, no leading 0)
 * Accepts: 254712345678, 0712345678, 712345678, +254712345678
 * Returns: 254712345678 (or empty string if unparseable)
 */
export function normalizePhone(phone: string): string {
    if (!phone) return "";

    let cleaned = phone.trim().replace(/^\+/, "");

    if (cleaned.startsWith("0")) {
        cleaned = "254" + cleaned.slice(1);
    } else if (!cleaned.startsWith("254")) {
        // Assume local format without country code (e.g., 712345678)
        if (cleaned.length === 9 && /^[17]\d{8}$/.test(cleaned)) {
            cleaned = "254" + cleaned;
        }
    }

    // Validate: must be 254 + 9 digits starting with 1 or 7
    if (!/^254[17]\d{8}$/.test(cleaned)) {
        return "";
    }

    return cleaned;
}

/**
 * Normalize an M-Pesa account reference (what tenant types in STK Push / C2B).
 * - Uppercase
 * - Strip whitespace and special chars
 * - Strip common unit prefixes: UNIT, APT, HSE, HOUSE, ROOM, NO, #
 * Examples:
 *   "a3" → "A3"
 *   "A 3" → "A3"
 *   "Unit A3" → "A3"
 *   "apt-3" → "A3"
 *   "HSE 12B" → "12B"
 */
export function normalizeAccountRef(ref: string): string {
    if (!ref) return "";

    let normalized = ref.trim().toUpperCase();

    // Remove common prefixes
    const prefixes = ["UNIT", "APT", "HSE", "HOUSE", "ROOM", "NO", "#"];
    for (const prefix of prefixes) {
        // Handle "UNIT A3", "UNIT-A3", "UNIT#A3", "UNIT A 3" etc.
        const regex = new RegExp(`^${prefix}[\\s\\-#]*`, "i");
        normalized = normalized.replace(regex, "");
    }

    // Strip remaining non-alphanumeric
    normalized = normalized.replace(/[^A-Z0-9]/g, "");

    return normalized;
}

/**
 * Normalize a unit number for comparison (same rules as account ref).
 */
export function normalizeUnitNumber(unitNumber: string): string {
    return normalizeAccountRef(unitNumber);
}
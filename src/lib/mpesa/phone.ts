/**
 * Kenyan mobile numbers for M-Pesa prompts.
 *
 * Kenya has two mobile ranges: 07XX and the newer 01XX (Safaricom issues
 * 0110–0115, all M-Pesa capable). The renter portal used to accept 07 only,
 * so a renter on an 011 line could not pay rent from the portal at all. The
 * backend rule is `KenyanMsisdn` — keep this in step with it.
 */

const MOBILE_NATIONAL = /^(?:7\d{8}|1[01]\d{7})$/;

/** Normalises to 254XXXXXXXXX. Returns the bare digits when unrecognised. */
export function normalizeMpesaPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 9 && MOBILE_NATIONAL.test(digits)) return `254${digits}`;
    if (digits.length === 10 && digits.startsWith("0") && MOBILE_NATIONAL.test(digits.slice(1))) {
        return `254${digits.slice(1)}`;
    }
    return digits;
}

export function isValidMpesaPhone(raw: string): boolean {
    const normalized = normalizeMpesaPhone(raw);
    return normalized.length === 12 && normalized.startsWith("254") && MOBILE_NATIONAL.test(normalized.slice(3));
}

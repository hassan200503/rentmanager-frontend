// lib/mpesa/matching-engine.ts
// Pure matching cascade — no side effects, no API calls.
// Determines which tenant/unit a payment belongs to.

import { normalizePhone, normalizeAccountRef, normalizeUnitNumber } from "./normalize";

// ── Types ────────────────────────────────────────────────────────────────

/** Minimal M-Pesa transaction shape from callback */
export interface MpesaTransaction {
    transactionId: string;        // TransID
    amount: number;               // TransAmount
    phoneNumber: string;          // MSISDN (raw)
    accountReference: string;     // BillRefNumber (what tenant typed)
    transactionTime: string;      // TransTime (YYYYMMDDHHmmss)
}

/** Minimal tenant/lease/unit shape needed for matching */
export interface TenantLeaseUnit {
    tenantId: string;
    tenantName: string;
    tenantPhone: string;          // raw phone on file
    leaseId: string;
    leaseStatus: string;          // "ACTIVE" | "SUSPENDED" | etc.
    unitId: string;
    unitNumber: string;           // e.g., "A3", "12B"
    rentAmount: number;           // expected monthly rent
    dueDay: number;               // day of month rent is due (1-28)
}

/** Result of a match attempt */
export type MatchConfidence = "exact" | "fuzzy" | "phone" | "amount_timing";

export interface MatchResult {
    matched: boolean;
    confidence: MatchConfidence | null;
    tenantLeaseUnit: TenantLeaseUnit | null;
    reason: "exact" | "fuzzy" | "phone" | "amount_timing" | "manual_review";
    // For manual_review: near-miss candidates the UI can surface as "Did you mean?"
    candidates: TenantLeaseUnit[];
}

/** Configuration for matching thresholds */
interface MatchConfig {
    maxEditDistance: number;      // for fuzzy account ref
    dueDateWindowDays: number;    // ± days around due date for amount+timing match
}

const DEFAULT_CONFIG: MatchConfig = {
    maxEditDistance: 2,
    dueDateWindowDays: 2,
};

// ── Helpers ──────────────────────────────────────────────────────────────

/** Parse M-Pesa TransTime (YYYYMMDDHHmmss) to Date */
function parseMpesaTime(transTime: string): Date {
    // TransTime format: YYYYMMDDHHmmss
    if (transTime.length >= 14) {
        const year = parseInt(transTime.slice(0, 4), 10);
        const month = parseInt(transTime.slice(4, 6), 10) - 1; // JS months 0-indexed
        const day = parseInt(transTime.slice(6, 8), 10);
        const hour = parseInt(transTime.slice(8, 10), 10);
        const minute = parseInt(transTime.slice(10, 12), 10);
        const second = parseInt(transTime.slice(12, 14), 10);
        return new Date(year, month, day, hour, minute, second);
    }
    // Fallback
    return new Date();
}

/** Levenshtein distance for fuzzy string matching */
function editDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // deletion
                    dp[i][j - 1],     // insertion
                    dp[i - 1][j - 1]  // substitution
                );
            }
        }
    }
    return dp[a.length][b.length];
}

/** Check if payment date is within window of unit's due date */
function isWithinDueWindow(paymentDate: Date, dueDay: number, windowDays: number): boolean {
    // Due date is the same day-of-month in the payment's month (or previous month if payment day < dueDay)
    const paymentDay = paymentDate.getDate();
    const paymentMonth = paymentDate.getMonth();
    const paymentYear = paymentDate.getFullYear();

    // Determine which month's due date we're checking against
    let dueMonth = paymentMonth;
    let dueYear = paymentYear;
    if (paymentDay < dueDay) {
        // Payment early in month → likely for previous month's rent
        dueMonth = paymentMonth - 1;
        if (dueMonth < 0) {
            dueMonth = 11;
            dueYear = paymentYear - 1;
        }
    }

    // Create the expected due date
    const dueDate = new Date(dueYear, dueMonth, dueDay);

    const diffMs = Math.abs(paymentDate.getTime() - dueDate.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays <= windowDays;
}

// ── Matching Cascade ────────────────────────────────────────────────────

/**
 * Core matching function — runs the 5-step cascade.
 * Stops at first match. Returns match with confidence + any near-miss candidates.
 */
export function matchPayment(
    txn: MpesaTransaction,
    tenantLeaseUnits: TenantLeaseUnit[],
    config: Partial<MatchConfig> = {}
): MatchResult {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Filter to only active leases
    const activeUnits = tenantLeaseUnits.filter(
        (u) => u.leaseStatus?.toUpperCase() === "ACTIVE"
    );

    if (activeUnits.length === 0) {
        return {
            matched: false,
            confidence: null,
            tenantLeaseUnit: null,
            reason: "manual_review",
            candidates: [],
        };
    }

    // Pre-normalize for performance
    const normTxnPhone = normalizePhone(txn.phoneNumber);
    const normTxnRef = normalizeAccountRef(txn.accountReference);
    const paymentDate = parseMpesaTime(txn.transactionTime);

    // ── Step 1: Exact normalized account reference match ──────────────────
    if (normTxnRef) {
        const exact = activeUnits.find((u) =>
            normalizeUnitNumber(u.unitNumber) === normTxnRef
        );
        if (exact) {
            return {
                matched: true,
                confidence: "exact",
                tenantLeaseUnit: exact,
                reason: "exact",
                candidates: [],
            };
        }
    }

    // ── Step 2: Fuzzy account reference match ────────────────────────────
    if (normTxnRef) {
        let bestFuzzy: { unit: TenantLeaseUnit; distance: number } | null = null;

        for (const unit of activeUnits) {
            const normUnit = normalizeUnitNumber(unit.unitNumber);
            const dist = editDistance(normTxnRef, normUnit);
            if (dist <= cfg.maxEditDistance) {
                if (!bestFuzzy || dist < bestFuzzy.distance) {
                    bestFuzzy = { unit, distance: dist };
                }
            }
        }

        if (bestFuzzy) {
            // Collect other close candidates for "did you mean?"
            const candidates = activeUnits
                .filter((u) => u !== bestFuzzy!.unit)
                .map((u) => ({
                    unit: u,
                    distance: editDistance(normTxnRef, normalizeUnitNumber(u.unitNumber)),
                }))
                .filter((c) => c.distance <= cfg.maxEditDistance)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3)
                .map((c) => c.unit);

            return {
                matched: true,
                confidence: "fuzzy",
                tenantLeaseUnit: bestFuzzy.unit,
                reason: "fuzzy",
                candidates,
            };
        }
    }

    // ── Step 3: Phone number match ───────────────────────────────────────
    if (normTxnPhone) {
        const phoneMatch = activeUnits.find((u) =>
            normalizePhone(u.tenantPhone) === normTxnPhone
        );
        if (phoneMatch) {
            return {
                matched: true,
                confidence: "phone",
                tenantLeaseUnit: phoneMatch,
                reason: "phone",
                candidates: [],
            };
        }
    }

    // ── Step 4: Amount + timing heuristic ───────────────────────────────
    const amountTimingMatches = activeUnits.filter((u) => {
        // Exact rent amount match
        if (u.rentAmount !== txn.amount) return false;
        // Within due date window
        return isWithinDueWindow(paymentDate, u.dueDay, cfg.dueDateWindowDays);
    });

    if (amountTimingMatches.length === 1) {
        // Unique candidate → confident match
        return {
            matched: true,
            confidence: "amount_timing",
            tenantLeaseUnit: amountTimingMatches[0],
            reason: "amount_timing",
            candidates: [],
        };
    }

    // ── Step 5: No confident match → manual review with candidates ──────
    // Prioritize candidates: those with close ref match, then phone match, then amount match
    const candidates = [...new Set([
        ...amountTimingMatches,
        ...(normTxnPhone
            ? activeUnits.filter((u) => normalizePhone(u.tenantPhone) === normTxnPhone)
            : []),
    ])].slice(0, 5);

    return {
        matched: false,
        confidence: null,
        tenantLeaseUnit: null,
        reason: "manual_review",
        candidates,
    };
}

// ── Export config for testing/override ───────────────────────────────────
export { DEFAULT_CONFIG, type MatchConfig };
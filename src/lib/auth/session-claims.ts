// lib/auth/session-claims.ts
//
// Parsing + validation of Clerk session claims. Every consumer of claims
// (proxy, layouts, client gates) must go through here so validation is
// uniform and fail-closed:
//
//   - If `userType` IS present and valid → authoritative.
//   - If `userType` is missing/invalid → "unclassified"; consumers fall
//     back to legacy signals (tenant_id / platformRole) for the migration
//     window, and MUST log the gap (see logUnclassifiedClaims).
//
// No raw `any` escapes this module.

import {
    sessionClaimsSchema,
    type PlatformRole,
    type SessionClaims,
    type UserType,
    USER_TYPES,
} from "./clerk-metadata";
import { InvalidClaimsError } from "./errors";

/**
 * Parses raw claims (anything — unknown from the network/JWT boundary) into
 * the validated SessionClaims shape. Throws InvalidClaimsError on
 * structurally invalid input (fail closed). Valid-but-missing userType is
 * NOT an error — that is the "unclassified" migration state, expressed as
 * `undefined` on the returned object.
 */
export function parseSessionClaims(raw: unknown): SessionClaims {
    if (raw === null || raw === undefined || typeof raw !== "object") {
        throw new InvalidClaimsError("Session claims missing or not an object");
    }
    const parsed = sessionClaimsSchema.safeParse(raw);
    if (!parsed.success) {
        throw new InvalidClaimsError(
            `Session claims failed validation: ${parsed.error.message}`
        );
    }
    return parsed.data;
}

export type { SessionClaims, UserType, PlatformRole };

/** Convenience: a typed set of the claim values routing cares about. */
export interface RouteClaims {
    userId: string | null;
    tenantId: string | null | undefined;
    userType: UserType | null | undefined;
    platformRole: PlatformRole | null | undefined;
}

/**
 * Minimal extractor used by server contexts (proxy) where the claims are
 * already a plain record. Validates everything; throws InvalidClaimsError
 * on malformed input.
 */
export function extractRouteClaims(claims: unknown): RouteClaims {
    const parsed = parseSessionClaims(claims);
    return {
        userId: parsed.sub ?? null,
        tenantId: parsed.tenant_id ?? undefined,
        userType: parsed.userType ?? undefined,
        platformRole: parsed.platformRole ?? undefined,
    };
}

/**
 * Migration-window fallback: derive a persona from legacy signals when the
 * userType claim is absent (existing users not yet backfilled). Mirrors the
 * backend's DB-derived coarse roles so the frontend and backend never
 * disagree during the transition.
 *
 * NOTE: "renter" and "landlord_pending" are indistinguishable from legacy
 * signals alone (both have no tenant_id) — callers that need that
 * distinction MUST wait for the userType claim; until then such users are
 * treated as renter (the /portal default), exactly as the backend treats
 * them pre-classification.
 */
export function deriveUserTypeFromLegacy(input: {
    tenantId: string | null | undefined;
    platformRole: PlatformRole | null | undefined;
}): UserType {
    const { tenantId, platformRole } = input;
    if (platformRole === "OWNER" || platformRole === "ADMIN") return "admin";
    if (tenantId) return "landlord";
    return "renter";
}

/**
 * Resolves the effective persona: authoritative claim when present,
 * legacy fallback otherwise. Always returns a concrete UserType so policy
 * code can branch on one value.
 */
export function resolveUserType(input: {
    userType: UserType | null | undefined;
    tenantId: string | null | undefined;
    platformRole: PlatformRole | null | undefined;
}): UserType {
    const { userType, tenantId, platformRole } = input;
    if (userType && USER_TYPES.includes(userType)) return userType;
    return deriveUserTypeFromLegacy({ tenantId, platformRole });
}

/** Structured log for claim gaps — observability for the migration window. */
export function logUnclassifiedClaims(opts: { userId?: string; pathname?: string; source: string }): void {
    console.warn(
        JSON.stringify({
            event: "auth.user_type_unclassified",
            source: opts.source,
            userId: opts.userId ?? null,
            pathname: opts.pathname ?? null,
            detail:
                "userType claim missing — legacy signals used. Ensure Clerk JWT template claims and metadata migration are complete.",
        })
    );
}

/** Runtime guard: is this value a valid UserType literal? */
export function isUserType(value: unknown): value is UserType {
    return typeof value === "string" && (USER_TYPES as readonly string[]).includes(value);
}

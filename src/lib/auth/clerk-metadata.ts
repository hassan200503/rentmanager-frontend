// lib/auth/clerk-metadata.ts
//
// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL USER-TYPE METADATA SCHEMA — single source of truth
// ═══════════════════════════════════════════════════════════════════════════
//
// Personas (strictly separated route trees, see lib/rbac/route-policy.ts):
//
//   userType          Meaning                          Route tree
//   ────────────────────────────────────────────────────────────────
//   renter            user-scoped renter identity      /portal/*
//   landlord_pending  authenticated, no tenant bound   /onboarding
//   landlord          bound to a landlord org          /dashboard/*
//   admin             platform superuser               /admin/*
//
// WRITER POLICY (zero drift):
//   The Java backend (ClerkServiceImpl) is the AUTHORITATIVE writer of
//   publicMetadata.userType — it owns every state transition and derives
//   type from database truth:
//     - tenant provisioning completes  → landlord_pending → landlord
//     - first TenantProfile created    → (renter) default already correct
//     - platform role assigned         → admin
//   The frontend ONLY seeds the initial value on user.created via the Clerk
//   webhook (app/api/webhooks/clerk/route.ts), from sign-up intent, and
//   never overwrites a value the backend has since promoted. If a webhook
//   and the backend disagree, the backend's last write wins (webhooks only
//   write when userType is missing).
//
// CLAIM PLACEMENT (Clerk Dashboard — must be applied manually):
//   Both JWT templates need custom claims so middleware, layouts and the
//   client gate can read them from verified session claims:
//
//   Default session token ("Session token") custom claims:
//     { "userType": "{{user.public_metadata.userType}}" }
//     (tenant_id is already mapped in this template today.)
//
//   "backend" template custom claims (already has platformRole; add):
//     { "userType": "{{user.public_metadata.userType}}" }
//
//   Until those claims exist, code MUST fail closed on ambiguity — every
//   consumer here treats a missing userType as "unclassified" and falls
//   back to legacy signals (tenant_id / platformRole) while logging the
//   gap (see lib/auth/session-claims.ts).
// ═══════════════════════════════════════════════════════════════════════════

import { z } from "zod";

export const USER_TYPES = ["renter", "landlord_pending", "landlord", "admin"] as const;

export type UserType = (typeof USER_TYPES)[number];

/** Sign-up intent a user can declare from the landing page CTAs. */
export const SIGNUP_INTENTS = ["renter", "landlord"] as const;

export type SignupIntent = (typeof SIGNUP_INTENTS)[number];

// ── Clerk metadata schemas ─────────────────────────────────────────────────

/**
 * publicMetadata — backend-writable only. The backend writes `userType`;
 * nothing on the client may mutate this object.
 * `.passthrough()`: other platform metadata (e.g. `platformRole`) coexists.
 */
export const clerkPublicMetadataSchema = z
    .object({
        userType: z.enum(USER_TYPES).optional(),
        onboardingComplete: z.boolean().optional(),
    })
    .passthrough();

export type ClerkPublicMetadata = z.infer<typeof clerkPublicMetadataSchema>;

/**
 * unsafeMetadata — client-writable; captures declared intent only.
 * NEVER used for authorization. `signupIntent` is copied to userType by the
 * user.created webhook; the backend remains the authority afterwards.
 */
export const clerkUnsafeMetadataSchema = z
    .object({
        signupIntent: z.enum(SIGNUP_INTENTS).optional(),
    })
    .passthrough();

export type ClerkUnsafeMetadata = z.infer<typeof clerkUnsafeMetadataSchema>;

// ── Session claims (verified JWT) ──────────────────────────────────────────

export const PLATFORM_ROLES = ["OWNER", "ADMIN"] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * Custom claims the Clerk JWT templates are configured to emit.
 * `sub` is standard; the rest are template-mapped claims.
 * `.passthrough()` tolerates other org/standard claims.
 */
export const sessionClaimsSchema = z
    .object({
        sub: z.string().optional(),
        tenant_id: z.string().nullable().optional(),
        userType: z.enum(USER_TYPES).nullable().optional(),
        platformRole: z.enum(PLATFORM_ROLES).nullable().optional(),
    })
    .passthrough();

export type SessionClaims = z.infer<typeof sessionClaimsSchema>;

/** Metadata key the webhook + backend use (kept in one place, no string drift). */
export const USER_TYPE_METADATA_KEY = "userType" as const;
export const SIGNUP_INTENT_METADATA_KEY = "signupIntent" as const;

// ── Defaults ───────────────────────────────────────────────────────────────

/**
 * Initial userType assigned on user.created. A declared landlord intent
 * yields landlord_pending (they still must complete onboarding to bind a
 * tenant); everything else starts as a renter. The backend re-classifies
 * on the first real state transition.
 */
export function initialUserType(intent: SignupIntent | undefined): "renter" | "landlord_pending" {
    return intent === "landlord" ? "landlord_pending" : "renter";
}

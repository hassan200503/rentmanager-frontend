// lib/auth/webhooks/user-type-seed.ts
//
// PURE, unit-testable decisions for the userType metadata webhook.
//
// WRITER CONTRACT:
//   - The backend is the AUTHORITATIVE writer of publicMetadata.userType.
//   - The webhook ONLY seeds a value when userType is ABSENT on the user,
//     so it can never stomp a backend promotion that landed between event
//     enqueue and processing. Seeding is idempotent.
//
// Primary seed site: user.created (from sign-up intent).
// Advisory seed site: organizationMembership.created — a user with an org
//   membership is not a bare renter; if unclassified, seed landlord_pending
//   so the edge routes them toward onboarding. The backend still owns the
//   definitive landlord promotion on tenant provisioning.

import {
    clerkUnsafeMetadataSchema,
    clerkPublicMetadataSchema,
    initialUserType,
    type UserType,
    USER_TYPE_METADATA_KEY,
} from "../clerk-metadata";

/**
 * Determines the userType to seed on user.created.
 * - signupIntent === "landlord" → landlord_pending (must still onboard).
 * - anything else / absent     → renter.
 * Returns null when intent is invalid (fail closed — let backend decide).
 *
 * The webhook only EVER seeds renter/landlord_pending (never landlord/admin —
 * those are backend promotions), hence the narrower return type.
 */
export function resolveInitialUserType(
    unsafeMetadataRaw: unknown
): "renter" | "landlord_pending" | null {
    const { success, data } = clerkUnsafeMetadataSchema.safeParse(unsafeMetadataRaw ?? {});
    if (!success) return null;
    return initialUserType(data.signupIntent);
}

/**
 * True when the webhook may seed `incoming` — i.e. userType is currently
 * ABSENT on the user's publicMetadata. Seeding only on absence is what
 * makes the whole pipeline safe against stomping backend writes:
 *
 *   user.created fires → webhook seeds "renter"
 *   (later) backend provisions the tenant and promotes to "landlord"
 *   (late/replayed user.created arrives) → seed BLOCKED (already "landlord")
 *
 * A DIFFERENT existing value never triggers a seed — differing values are
 * the backend's call (authoritative writer), and drift is surfaced by
 * observability, not fought at the webhook.
 */
export function shouldSeedUserType(
    existingPublicMetadataRaw: unknown,
    incoming: UserType
): boolean {
    void incoming; // seed decision depends only on absence, not the value
    const { success, data } = clerkPublicMetadataSchema.safeParse(
        existingPublicMetadataRaw ?? {}
    );
    if (!success) return false; // malformed metadata → do NOT touch, log elsewhere
    const existing = data[USER_TYPE_METADATA_KEY];
    return typeof existing !== "string" || existing.length === 0;
}

/** Convenience type for the webhook handler's return summary. */
export interface UserTypeSeedResult {
    userId: string;
    seeded: boolean;
    userType: UserType;
    reason: "user.created" | "organizationMembership.created";
}
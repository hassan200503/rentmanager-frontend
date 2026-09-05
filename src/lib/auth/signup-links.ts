// lib/auth/signup-links.ts
//
// Canonical sign-up URLs with declared intent. The user.created webhook
// reads `signupIntent` from unsafeMetadata to seed userType (renter vs
// landlord_pending) — so the intent-encoded CTAs are the ONLY place the
// initial persona is decided at sign-up time.
//
// IMPORTANT: intent is a UX hint (unsafeMetadata), never an authorization
// signal. The backend re-classifies from database truth at the first real
// transition.

import type { SignupIntent } from "./clerk-metadata";

/** Build a sign-up URL carrying a declared intent. */
export function signupHref(intent?: SignupIntent): string {
    return intent ? `/public/sign-up?intent=${intent}` : "/public/sign-up";
}

/** Landlord-intent sign-up (used by all "list your property" CTAs). */
export const SIGNUP_LANDLORD_HREF = signupHref("landlord");

/**
 * Renter-intent sign-up.
 *
 * "renter" has always been a valid SignupIntent and PERSONA_HOME has always
 * mapped it to /portal, but no constant existed and no CTA used it — every
 * sign-up link on the landing page was intent=landlord. A renter therefore
 * arrived with no declared intent, so the user.created webhook had nothing to
 * seed userType from and the persona was left to be inferred later.
 */
export const SIGNUP_RENTER_HREF = signupHref("renter");

/**
 * Default sign-up with no declared intent — the persona is decided by the
 * chooser on the page. Prefer one of the intent-carrying constants above
 * wherever the audience is already known from context.
 */
export const SIGNUP_DEFAULT_HREF = "/public/sign-up";
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

/** Default (renter/pending) sign-up. */
export const SIGNUP_DEFAULT_HREF = "/public/sign-up";
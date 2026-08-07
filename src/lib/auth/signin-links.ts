// lib/auth/signin-links.ts
//
// Canonical sign-in URLs with declared persona intent. This is the sign-in
// twin of lib/auth/signup-links.ts: landing-page CTAs deep-link to
// /public/sign-in?intent=landlord|renter so the persona chooser can
// pre-select the right experience and hint Clerk's post-auth redirect.
//
// ═══════════════════════════════════════════════════════════════════════════
// SECURITY CONTRACT (read before changing anything here)
// ═══════════════════════════════════════════════════════════════════════════
//   1. Intent is a UX hint ONLY — never an authorization signal. The proxy
//      (lib/rbac/route-policy.ts) routes by verified claims
//      (userType / tenant_id / platformRole) and fails closed on mismatch,
//      so a renter who picks "landlord" is corrected to /portal the moment
//      they land on /dashboard. This module only narrows where Clerk sends
//      the user right after auth; it cannot widen anything.
//   2. resolveSignInRedirect returns ONLY hardcoded, same-origin paths from
//      PERSONA_HOME. It never derives a URL from user input, so the value
//      handed to Clerk's <SignIn forceRedirectUrl> can never become an
//      open redirect.
//   3. An absent or invalid intent means "no hint": the page MUST NOT force
//      a redirect, preserving Clerk's return-to-origin flow (e.g. a renter
//      mid-reservation who is routed through sign-in keeps their return
//      URL). parseSignInIntent therefore returns undefined for anything
//      that is not exactly "landlord" | "renter".
// ═══════════════════════════════════════════════════════════════════════════

import { SIGNUP_INTENTS, type SignupIntent } from "./clerk-metadata";

/** Persona intent for sign-in. Same vocabulary as sign-up (zero drift). */
export type SignInIntent = SignupIntent;

const VALID_INTENTS: readonly SignInIntent[] = SIGNUP_INTENTS;

/**
 * Persona → post-auth landing path. HARDCODED and same-origin only.
 * Introducing any dynamic value here (env var, user input, stored value)
 * would create an open-redirect class of bug — do not.
 */
export const PERSONA_HOME: Readonly<Record<SignInIntent, string>> = {
    landlord: "/dashboard",
    renter: "/portal",
};

/**
 * Parse + validate a raw `intent` query value. Anything that is not exactly
 * "landlord" | "renter" parses to `undefined` (meaning "no hint") rather
 * than throwing or guessing — fail closed.
 */
export function parseSignInIntent(raw: string | null | undefined): SignInIntent | undefined {
    if (raw === null || raw === undefined) return undefined;
    return (VALID_INTENTS as readonly string[]).includes(raw)
        ? (raw as SignInIntent)
        : undefined;
}

/** Build a sign-in URL carrying a declared persona intent. */
export function signinHref(intent?: SignInIntent): string {
    return intent ? `/public/sign-in?intent=${intent}` : "/public/sign-in";
}

/**
 * Post-auth redirect for a declared persona. Returns `undefined` when no
 * intent is present — callers must then leave Clerk's default redirect
 * untouched (return-to-origin wins). Only ever returns a PERSONA_HOME value.
 */
export function resolveSignInRedirect(intent: SignInIntent | undefined): string | undefined {
    return intent ? PERSONA_HOME[intent] : undefined;
}

/** Landlord-intent sign-in (used by "Sign in as a landlord" CTAs). */
export const SIGNIN_LANDLORD_HREF = signinHref("landlord");

/** Renter-intent sign-in (used by "Sign in as a tenant or renter" CTAs). */
export const SIGNIN_RENTER_HREF = signinHref("renter");

/** Default sign-in (persona chooser decides; no forced redirect). */
export const SIGNIN_DEFAULT_HREF = "/public/sign-in";
// lib/auth/signin-links.test.ts
//
// Security contract tests for persona-aware sign-in links.
//
// Contract pinned here:
//   1. Only exactly "landlord" | "renter" parse as intent — anything else
//      (absent, empty, unknown, malicious) yields "no hint" (undefined).
//   2. resolveSignInRedirect only ever returns one of the two hardcoded
//      PERSONA_HOME paths — it can never become an open redirect.
//   3. The intent vocabulary is shared with sign-up (SIGNUP_INTENTS), so
//      persona naming never drifts between the sign-in and sign-up flows.

import { describe, it, expect } from "vitest";
import {
    parseSignInIntent,
    resolveSignInRedirect,
    signinHref,
    SIGNIN_DEFAULT_HREF,
    SIGNIN_LANDLORD_HREF,
    SIGNIN_RENTER_HREF,
    PERSONA_HOME,
    type SignInIntent,
} from "./signin-links";
import { SIGNUP_INTENTS } from "./clerk-metadata";

// ── 1. Intent parsing (fail closed) ────────────────────────────────────────

describe("parseSignInIntent", () => {
    it("accepts exactly the two valid persona intents", () => {
        expect(parseSignInIntent("landlord")).toBe("landlord");
        expect(parseSignInIntent("renter")).toBe("renter");
    });

    it("parses anything absent to undefined (no hint)", () => {
        expect(parseSignInIntent(null)).toBeUndefined();
        expect(parseSignInIntent(undefined)).toBeUndefined();
        expect(parseSignInIntent("")).toBeUndefined();
    });

    it("rejects unknown, forged or malformed values without throwing", () => {
        for (const raw of [
            "admin",
            "OWNER",
            "landlord,renter",
            "landlord?foo=bar",
            "/dashboard",
            "javascript:alert(1)",
            "%6candlord",
            "LANDLORD",
            "  landlord  ",
        ]) {
            expect(parseSignInIntent(raw), `raw=${raw}`).toBeUndefined();
        }
    });

    it("shares the sign-up intent vocabulary (zero drift)", () => {
        // If the persona vocabulary ever grows, this test forces a review
        // of both flows and the PERSONA_HOME mapping together.
        expect(SIGNUP_INTENTS).toEqual(["renter", "landlord"]);
    });
});

// ── 2. Redirect resolution (never an open redirect) ────────────────────────

describe("resolveSignInRedirect", () => {
    it("maps each persona to its hardcoded home", () => {
        expect(resolveSignInRedirect("landlord")).toBe(PERSONA_HOME.landlord);
        expect(resolveSignInRedirect("renter")).toBe(PERSONA_HOME.renter);
        expect(PERSONA_HOME.landlord).toBe("/dashboard");
        expect(PERSONA_HOME.renter).toBe("/portal");
    });

    it("returns undefined when no intent is declared", () => {
        expect(resolveSignInRedirect(undefined)).toBeUndefined();
    });

    it("only ever returns a hardcoded same-origin path", () => {
        const allowed = Object.values(PERSONA_HOME);
        const candidates: Array<SignInIntent | undefined> = ["landlord", "renter", undefined];
        for (const candidate of candidates) {
            const result = resolveSignInRedirect(candidate);
            if (result !== undefined) {
                expect(allowed).toContain(result);
            }
        }
        // Every value in PERSONA_HOME is an internal absolute path — never
        // scheme-relative or external (which would enable open redirects).
        for (const home of allowed) {
            expect(home.startsWith("/")).toBe(true);
            expect(home.startsWith("//")).toBe(false);
            expect(home.startsWith("http")).toBe(false);
        }
    });
});

// ── 3. URL construction ────────────────────────────────────────────────────

describe("signinHref", () => {
    it("encodes the intent into the query string", () => {
        expect(signinHref("landlord")).toBe("/public/sign-in?intent=landlord");
        expect(signinHref("renter")).toBe("/public/sign-in?intent=renter");
    });

    it("produces the bare path when no intent is given", () => {
        expect(signinHref(undefined)).toBe("/public/sign-in");
    });

    it("exports canonical constants for the landing page", () => {
        expect(SIGNIN_LANDLORD_HREF).toBe("/public/sign-in?intent=landlord");
        expect(SIGNIN_RENTER_HREF).toBe("/public/sign-in?intent=renter");
        expect(SIGNIN_DEFAULT_HREF).toBe("/public/sign-in");
    });

    it("round-trips through parseSignInIntent", () => {
        for (const intent of SIGNUP_INTENTS) {
            const parsed = parseSignInIntent(new URLSearchParams(signinHref(intent).split("?")[1]).get("intent"));
            expect(parsed).toBe(intent);
        }
    });
});
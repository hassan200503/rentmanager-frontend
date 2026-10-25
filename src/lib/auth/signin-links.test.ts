// lib/auth/signin-links.test.ts
//
// Pins the decision that sign-in carries no persona. If a role picker or an
// intent parameter comes back to the sign-in link, this fails and forces the
// conversation recorded at the top of signin-links.ts to happen again.

import { describe, it, expect } from "vitest";
import * as signinLinks from "./signin-links";

describe("sign-in link", () => {
    it("is a same-origin path with no persona or redirect parameters", () => {
        expect(signinLinks.SIGNIN_HREF).toBe("/public/sign-in");
        expect(signinLinks.SIGNIN_HREF).not.toContain("?");
    });

    it("exports no persona-specific sign-in links", () => {
        expect(Object.keys(signinLinks)).toEqual(["SIGNIN_HREF"]);
    });
});

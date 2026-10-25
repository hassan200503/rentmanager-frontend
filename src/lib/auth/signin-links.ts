// lib/auth/signin-links.ts
//
// The one sign-in URL. It deliberately carries no persona.
//
// Sign-in used to take `?intent=landlord|renter` and show "sign in as a
// landlord / as a renter" cards with a switch between them. A role is not
// something a person picks when signing in — it is what their account is.
// Offering the choice invited people to pick the other one, confused people
// who are both, and made access look self-selected even though the backend
// always enforced it. Everyone now signs in the same way and /continue routes
// from GET /users/me/access (see lib/auth/session-destination.ts).
//
// Sign-UP still carries intent (lib/auth/signup-links.ts): for a brand-new
// account it chooses the first step — organisation setup or the renter portal.

export const SIGNIN_HREF = "/public/sign-in";

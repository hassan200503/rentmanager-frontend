// lib/auth/session-destination.ts
//
// Where a signed-in person belongs, decided from what the BACKEND says the
// session is authorised for (GET /users/me/access), never from a persona the
// person picked on a sign-in screen. Pure, so every case is unit-tested.
//
// Order matters:
//   1. Platform admin      → /admin
//   2. Landlord org member → /dashboard (owner, manager and staff alike)
//   3. Renter              → /portal
//   4. Nobody yet          → a renter-intent sign-up waits in /portal (it
//                            shows "no tenancy yet"); anyone else is taken to
//                            /onboarding to set up their organisation.
//
// signupIntent only ever chooses between two places that grant nothing:
// the empty renter portal and the onboarding form. It cannot reach data.

import type { SessionAccess } from "@/features/user/types/user";

export type SessionDestination = "/admin" | "/dashboard" | "/portal" | "/onboarding";

export function resolveSessionDestination(
    access: SessionAccess,
    signupIntent?: unknown
): SessionDestination {
    if (access.platformAdmin) return "/admin";
    if (access.landlordRole && access.landlordTenantId) return "/dashboard";
    if (access.renter) return "/portal";
    return signupIntent === "renter" ? "/portal" : "/onboarding";
}

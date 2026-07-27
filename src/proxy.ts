import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/listings(.*)",
    "/public/forgot-password",
    "/public/sign-in(.*)",
    "/public/sign-up(.*)",
    "/tenant-required",
    "/reserve(.*)",
]);

// Pages a signed-in, tenant-less (pending onboarding/verification) user
// is still allowed to reach. Add more here as you build them.
const isAllowedWhilePending = createRouteMatcher([
    "/onboarding",
    "/pending-review",
    "/account(.*)",
    "/support",
]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return NextResponse.next();

    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
        return redirectToSignIn();
    }

    // Tenant portal route: any authenticated user may access /portal.
    // Landlords (with tenant_id claim) are redirected to /dashboard instead.
    // In development mode, setting cookie _dev_portal=renter bypasses this
    // so the same user can preview both landlord and renter portals.
    if (req.nextUrl.pathname.startsWith("/portal")) {
        const tenantId = sessionClaims?.tenant_id;
        if (tenantId) {
            if (
                process.env.NODE_ENV === "development" &&
                req.cookies.get("_dev_portal")?.value === "renter"
            ) {
                return NextResponse.next();
            }
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    }

    const tenantId = sessionClaims?.tenant_id;

    // NOTE: once the real KYC review step exists, this should also check
    // something like sessionClaims?.tenant_status === "active", not just
    // tenantId presence — for now, form submission = active immediately.
    if (!tenantId) {
        if (isAllowedWhilePending(req)) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Tenant is set — this user is done onboarding, so keep them out of it.
    if (req.nextUrl.pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (
        req.nextUrl.pathname.startsWith("/upgrade") &&
        sessionClaims?.subscription !== "premium"
    ) {
        return NextResponse.redirect(new URL("/upgrade", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api|public/sign-in|public/sign-up).*)",
    ],
};
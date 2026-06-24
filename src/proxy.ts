import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/listings(.*)",
    "/public/forgot-password",
    "/public/sign-in(.*)",
    "/public/sign-up(.*)",
    "/tenant-required",
]);

export default clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return NextResponse.next();

    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
        return redirectToSignIn();
    }

    const tenantId = sessionClaims?.tenant_id;
    if (!tenantId) {
        return NextResponse.redirect(new URL("/tenant-required", req.url));
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
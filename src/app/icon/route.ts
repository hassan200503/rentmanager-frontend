import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config/app-config";

export const runtime = "nodejs";

/**
 * How long a browser, the CDN and Next's own cache may keep the icon before
 * asking again. Five minutes: the owner changes the brand icon roughly never,
 * and the alternative — revalidating on every page load — cost 4.4 s of TTFB
 * measured from Nairobi, because each request made two upstream calls to a
 * 0.1-CPU instance before a single byte of the tab icon was sent.
 */
const ICON_TTL_SECONDS = 300;

// Next parses this segment config statically, so it has to be a literal —
// a reference to the constant above is rejected at build time as an
// "invalid segment configuration export". Keep the two in step.
export const revalidate = 300;

/**
 * Dynamic favicon: serves the owner-configured platform logo (public branding
 * endpoint) so the browser tab, the installed app and the page chrome all
 * follow one upload. Falls back to the static favicon.svg whenever the backend
 * is unreachable or no logo has been uploaded.
 *
 * Caching is deliberate and layered. The response is cacheable for
 * ICON_TTL_SECONDS by the browser and the CDN, and the two upstream fetches
 * carry the same revalidation window, so a warm icon is served without
 * touching the API at all. `stale-while-revalidate` then keeps the old icon
 * instant while a new one is fetched in the background, which matters most on
 * the free tier: when the API is asleep, visitors still get an icon rather
 * than a hung request. An upload therefore appears within five minutes rather
 * than immediately — the trade the measurement above justifies.
 *
 * The timeouts are short for the same reason: a slow or sleeping API must
 * never hold up the tab icon, and the fallback mark is always ready.
 */
export async function GET() {
    const fallbackSvg = await readFile(join(process.cwd(), "public", "favicon.svg"), "utf8");

    try {
        // appConfig.api.baseUrl already ends in /api/v1 (it's read straight
        // from NEXT_PUBLIC_API_URL, which is itself ".../api/v1") — every
        // other caller in this codebase appends only the path after that,
        // e.g. adminEndpoints.publicBranding() = "/public/platform/branding".
        // This route used to prepend "/api/v1" again, doubling it to
        // ".../api/v1/api/v1/...", which the backend answers with 401 (no
        // such route matches as expected) rather than 200 — so !brandingRes.ok
        // was always true and this route silently served the green
        // fallbackSvg on every request, never the configured logo.
        const brandingRes = await fetch(
            `${appConfig.api.baseUrl}/public/platform/branding`,
            { next: { revalidate: ICON_TTL_SECONDS }, signal: AbortSignal.timeout(2500) }
        );
        if (!brandingRes.ok) {
            return iconResponse(fallbackSvg, "image/svg+xml");
        }

        const body = (await brandingRes.json()) as { data?: { logoUrl?: string | null } };
        const logoUrl = body?.data?.logoUrl;
        if (!logoUrl) {
            return iconResponse(fallbackSvg, "image/svg+xml");
        }

        // An icon the owner uploaded is served by our own API and comes back
        // as a path ("/api/v1/public/platform/branding/logo"); a legacy
        // Cloudinary asset comes back absolute. Resolve the path against the
        // API origin, since this runs on the server with no page to be
        // relative to.
        const absoluteLogoUrl = logoUrl.startsWith("/")
            ? new URL(logoUrl, new URL(appConfig.api.baseUrl).origin).toString()
            : logoUrl;

        const imageRes = await fetch(absoluteLogoUrl, {
            next: { revalidate: ICON_TTL_SECONDS },
            signal: AbortSignal.timeout(3000),
        });
        if (!imageRes.ok) {
            return iconResponse(fallbackSvg, "image/svg+xml");
        }

        const buffer = new Uint8Array(await imageRes.arrayBuffer());
        const contentType = imageRes.headers.get("content-type") ?? "image/png";
        return iconResponse(buffer, contentType);
    } catch {
        return iconResponse(fallbackSvg, "image/svg+xml");
    }
}

function iconResponse(body: string | Uint8Array<ArrayBuffer>, contentType: string) {
    return new NextResponse(body, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control":
                `public, max-age=${ICON_TTL_SECONDS}, s-maxage=${ICON_TTL_SECONDS}, stale-while-revalidate=86400`,
            // Netlify's CDN reads this in preference to Cache-Control, and
            // without it a route handler's response is not held at the edge at
            // all — which is where the saving actually comes from.
            "Netlify-CDN-Cache-Control":
                `public, s-maxage=${ICON_TTL_SECONDS}, stale-while-revalidate=86400, durable`,
        },
    });
}

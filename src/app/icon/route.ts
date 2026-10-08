import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config/app-config";

export const runtime = "nodejs";

/**
 * The fallback mark, inlined rather than read from public/favicon.svg.
 *
 * It used to be `readFile(join(process.cwd(), "public", "favicon.svg"))`, on
 * the first line of GET and outside the try/catch. That works on a Node
 * server and fails on Cloudflare Workers, which have no filesystem: the
 * import threw before any error handling could run, so this route answered
 * 500 on the live site while every other page served fine. The fallback whose
 * whole job is to survive the backend being unreachable was itself the thing
 * that could not survive.
 *
 * Two kilobytes inlined removes the I/O, the failure mode and a runtime
 * dependency in one go. It is the same drawing as BadgeMark in
 * shared/components/brand/BrandBadge.tsx and public/favicon.svg — keep all
 * three in step.
 */
const FALLBACK_SVG = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- The RentManager brand mark: the same drawing as BadgeMark in
       src/shared/components/brand/BrandBadge.tsx, which every header uses.
       Keep the two in step. -->
  <defs>
    <linearGradient id="rm-fav-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="55%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#1E40AF" />
    </linearGradient>
    <linearGradient id="rm-fav-sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="rm-fav-glow" cx="0.5" cy="0.32" r="0.75">
      <stop offset="0%" stop-color="#93C5FD" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#93C5FD" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="url(#rm-fav-grad)" />
  <rect x="4" y="2" width="16" height="10" rx="4" fill="url(#rm-fav-glow)" />
  <rect x="0.5" y="0.5" width="23" height="23" rx="6" stroke="rgba(255,255,255,0.22)" stroke-width="0.75" />
  <rect x="1.5" y="1.5" width="21" height="9" rx="4.5" fill="url(#rm-fav-sheen)" />
  <path d="M5.5 11.2L9.4 8l3.9 3.2" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M13.3 8l2.6-2.1 2.6 2.1M15.9 5.9v2.4" stroke="white" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
  <rect x="12.6" y="10.8" width="7" height="7.6" rx="1.6" fill="white" opacity="0.92" />
  <rect x="14.3" y="13.1" width="2.2" height="4.1" rx="0.9" fill="#1E40AF" opacity="0.85" />
  <rect x="4.6" y="13.6" width="6" height="5" rx="1.2" stroke="white" stroke-width="1.1" opacity="0.85" />
  <path d="M6 15.4h3.2M6 17.3h2" stroke="white" stroke-width="0.9" stroke-linecap="round" opacity="0.6" />
</svg>`;

/**
 * How long a browser, the CDN and Next's own cache may keep the icon before
 * asking again. Five minutes: the owner changes the brand icon roughly never,
 * and the alternative — revalidating on every page load — cost 4.4 s of TTFB
 * measured from Nairobi, because each request made two upstream calls to a
 * 0.1-CPU instance before a single byte of the tab icon was sent.
 */
const ICON_TTL_SECONDS = 60;

// Next parses this segment config statically, so it has to be a literal —
// a reference to the constant above is rejected at build time as an
// "invalid segment configuration export". Keep the two in step.
//
// Sixty seconds rather than five minutes: this is the window an owner waits
// after uploading a new brand icon before the tab shows it, and five minutes
// of staring at the old icon reads as a failed upload. The cost of the
// shorter window is near zero — the response is a couple of kilobytes, it is
// still prerendered rather than computed per request, and stale-while-
// revalidate means nobody ever waits for the regeneration.
export const revalidate = 60;

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
    const fallbackSvg = FALLBACK_SVG;

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

import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config/app-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dynamic favicon: proxies the owner-configured platform logo (public
 * branding endpoint) so the browser tab reflects the current brand asset.
 * Falls back to the static favicon.svg whenever the backend is unreachable
 * or no logo has been uploaded.
 *
 * The response is `no-cache` — the browser MUST revalidate on every fresh
 * tab / page load, and since the handler re-fetches branding with
 * `no-store`, an uploaded logo shows up in the tab immediately. The icon
 * is a few KB, so revalidation cost is negligible; stale-while-revalidate
 * still serves the old icon instantly while the new one is fetched.
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
            { cache: "no-store", signal: AbortSignal.timeout(3000) }
        );
        if (!brandingRes.ok) {
            return iconResponse(fallbackSvg, "image/svg+xml");
        }

        const body = (await brandingRes.json()) as { data?: { logoUrl?: string | null } };
        const logoUrl = body?.data?.logoUrl;
        if (!logoUrl) {
            return iconResponse(fallbackSvg, "image/svg+xml");
        }

        const imageRes = await fetch(logoUrl, {
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
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
            "Cache-Control": "no-cache, max-age=0, must-revalidate, stale-while-revalidate=86400",
        },
    });
}

import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono, Instrument_Serif, Fraunces } from "next/font/google";
import dynamic from "next/dynamic";

import QueryProvider from "@/providers/query-provider";
import ThemeProvider from "@/providers/theme-provider";
import { Toaster } from "sonner";
import { appConfig } from "@/lib/config/app-config";
import { SkipLink } from "@/shared/components/SkipLink";

const DevPortalSwitcher = dynamic(
    () => import("@/shared/dev/DevPortalSwitcher")
);

// No `weight` list on purpose: naming weights makes next/font download one
// static file per weight (four, measured at ~35 KB each), while omitting it
// serves Inter's variable font as a single file that covers every weight the
// app uses. Same look, one request instead of four.
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
});

// Not preloaded: the monospace face is for figures in tables and the dashboard
// mock, all below the fold. Preloading it made three font files compete with
// the hero's own text for the first moments of a page load.
const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    weight: ["400", "500", "600"],
    preload: false,
});

// Upright only: nothing in the app sets the display face in italic, and the
// italic file was a second download on every page for no rendering.
const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    variable: "--font-display-face",
    weight: ["400"],
});

/* Premium brand wordmark face — Fraunces variable with optical sizing:
   tight, editorial serif that reads luxury real estate (Christie's,
   Sotheby's territory) while staying crisp at nav sizes. */
const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-brand-face",
    // Upright only, for the same reason as the display face: the wordmark is
    // never set in italic, so the italic file was pure weight.
    axes: ["opsz"],
});

const defaultMetadata = {
    title: "RentManager",
    description: "RentManager — property management for the Kenyan rental market. Collect rent, issue eTIMS-ready receipts, manage maintenance, and stay KRA compliant.",
};

export const metadata: Metadata = {
    // Always set: see appConfig.siteUrl for why an absolute fallback beats
    // undefined here. Without it, every relative canonical / og:url in the
    // app ships unresolved.
    metadataBase: new URL(appConfig.siteUrl),
    title: {
        default: `${defaultMetadata.title} — Property Management Platform`,
        template: `%s — ${defaultMetadata.title}`,
    },
    description: defaultMetadata.description,
    applicationName: "RentManager",
    keywords: ["rent manager", "property management", "kenya", "rental income", "MRI", "eTIMS", "landlord"],
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "en_KE",
        siteName: "RentManager",
        title: `${defaultMetadata.title} — Property Management Platform`,
        description: defaultMetadata.description,
        images: ["/og.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: `${defaultMetadata.title} — Property Management Platform`,
        description: defaultMetadata.description,
        images: ["/og.png"],
    },
    manifest: "/manifest.json",
    icons: {
        // /icon is the single source of truth for the browser-tab icon —
        // it already reads and serves public/favicon.svg itself, inline,
        // whenever the platform branding endpoint is unreachable or no logo
        // is configured (see src/app/icon/route.ts). A second, separate
        // `{ url: "/favicon.svg" }` entry used to sit here as a competing
        // <link rel="icon">: always green, never updated, and — depending on
        // the browser's own icon-selection heuristics — capable of winning
        // over the correctly-branded /icon link even when /icon was serving
        // the real (blue) configured logo. No `type` on /icon: its real
        // Content-Type varies with whatever the owner has uploaded (PNG,
        // SVG, whatever Cloudinary was given), and declaring a fixed type
        // that doesn't match the response risks the same kind of silent
        // browser fallback.
        icon: [{ url: "/icon" }],
    },
};

export const viewport: Viewport = {
    themeColor: "#0f172a",
};

import { ToastProvider } from "@/shared/components/dashboard/ToastProvider";
import { LenisProvider } from "@/shared/components/motion/LenisProvider";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en-KE" className={`${inter.variable} ${plexMono.variable} ${instrumentSerif.variable} ${fraunces.variable}`} suppressHydrationWarning>
        <body className="antialiased">
        <SkipLink />
        {/* No ClerkProvider here on purpose. It lives in (app)/layout.tsx, so
            the landing page, the listings and the policy pages no longer fetch
            Clerk's runtime and UI bundles -- about 240 KB from Clerk's domain,
            measured -- for pages that render no Clerk component. See
            (app)/layout.tsx for what is inside that boundary and what is not.

            Everything left in this layout is session-agnostic: none of
            QueryProvider, ThemeProvider, LenisProvider, ToastProvider, Toaster,
            SkipLink or DevPortalSwitcher reads a Clerk hook. */}
        <QueryProvider>
            <ThemeProvider>
                <LenisProvider>
                    <ToastProvider>
                        <Toaster position="top-right" richColors />
                        {children}
                        <DevPortalSwitcher />
                    </ToastProvider>
                </LenisProvider>
            </ThemeProvider>
        </QueryProvider>
        </body>
        </html>
    );
}
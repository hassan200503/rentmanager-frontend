import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import dynamic from "next/dynamic";

import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
import ThemeProvider from "@/providers/theme-provider";
import { Toaster } from "sonner";
import { appConfig } from "@/lib/config/app-config";
import { SkipLink } from "@/shared/components/SkipLink";

const DevPortalSwitcher = dynamic(
    () => import("@/shared/dev/DevPortalSwitcher")
);

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
    weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    variable: "--font-display-face",
    weight: ["400"],
    style: ["normal", "italic"],
});

const defaultMetadata = {
    title: "RentManager",
    description: "RentManager — property management for the Kenyan rental market. Collect rent, issue eTIMS-ready receipts, manage maintenance, and stay KRA compliant.",
};

export const metadata: Metadata = {
    metadataBase: appConfig.appUrl
        ? new URL(appConfig.appUrl)
        : undefined,
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
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
        ],
    },
};

export const viewport: Viewport = {
    themeColor: "#0f172a",
};

import { ToastProvider } from "@/shared/components/dashboard/ToastProvider";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${plexMono.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
        <body className="antialiased">
        <SkipLink />
        <QueryProvider>
            <AuthProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <Toaster position="top-right" richColors />
                        {children}
                        <DevPortalSwitcher />
                    </ToastProvider>
                </ThemeProvider>
            </AuthProvider>
        </QueryProvider>
        </body>
        </html>
    );
}
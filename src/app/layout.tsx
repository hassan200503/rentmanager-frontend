import "./globals.css";

import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import dynamic from "next/dynamic";

import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
import ThemeProvider from "@/providers/theme-provider";
import { Toaster } from "sonner";

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

export const metadata: Metadata = {
    title: "RentManager — Property Management Platform",
    description: "Multi-tenant property management system for the Kenyan rental market",
    icons: {
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
        ],
    },
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
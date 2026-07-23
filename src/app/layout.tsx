import "./globals.css";

import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";

import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
import ThemeProvider from "@/providers/theme-provider";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-display",
    weight: ["500", "600", "700"],
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    weight: ["400", "500", "600"],
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

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`} suppressHydrationWarning>
        <body className="antialiased">
        <QueryProvider>
            <AuthProvider>
                <ThemeProvider>
                    <Toaster position="top-right" richColors />
                    {children}
                </ThemeProvider>
            </AuthProvider>
        </QueryProvider>
        </body>
        </html>
    );
}
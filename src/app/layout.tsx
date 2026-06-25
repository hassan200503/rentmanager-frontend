import "./globals.css";

import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";

import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
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

export const metadata: Metadata = {
    title: "RentManager SaaS",
    description: "Multi-tenant property management system",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
        <body className="bg-background text-gray-900 antialiased font-sans">
        <QueryProvider>
            <AuthProvider>
                <Toaster position="top-right" richColors />
                {children}
            </AuthProvider>
        </QueryProvider>
        </body>
        </html>
    );
}
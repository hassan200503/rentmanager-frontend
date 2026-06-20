import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
import { Toaster } from "sonner";

import AppShell from "@/shared/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

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
        <html lang="en">
            <body className={inter.className}>
                <QueryProvider>
                    <AuthProvider>
                        {/* GLOBAL TOAST SYSTEM */}
                        <Toaster position="top-right" richColors />

                        {/* APP SHELL – provides Sidebar, Topbar and main content area */}
                        <AppShell>{children}</AppShell>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}

import "./globals.css";

import type { Metadata } from "next";

import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
import { Toaster } from "sonner";

import AppShell from "@/shared/components/layout/AppShell";

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
        <body className="bg-background text-gray-900 antialiased font-sans">
        <QueryProvider>
            <AuthProvider>
                <Toaster position="top-right" richColors />
                <AppShell>{children}</AppShell>
            </AuthProvider>
        </QueryProvider>
        </body>
        </html>
    );
}
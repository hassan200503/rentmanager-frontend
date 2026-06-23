import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import QueryProvider from "@/providers/query-provider";
import AuthProvider from "@/providers/auth-provider";
import { Toaster } from "sonner";

import AppShell from "@/shared/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
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
      <html lang="en" className={inter.variable}>
      <body className="bg-background text-gray-900 antialiased font-sans">
      <QueryProvider>
        <AuthProvider>
          {/* Global toast notifications */}
          <Toaster position="top-right" richColors />

          {/* Application shell – sidebar, topbar, main content */}
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </QueryProvider>
      </body>
      </html>
  );
}
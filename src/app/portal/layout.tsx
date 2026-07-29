// app/portal/layout.tsx
"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, LayoutDashboard, CreditCard, FileText, User } from "lucide-react";

const NAV_ITEMS = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/payments", label: "Payments", icon: CreditCard },
    { href: "/portal/lease", label: "Lease", icon: FileText },
];

export default function TenantPortalLayout({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, userId } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/public/sign-in");
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded) {
        return (
            <main className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand/25">
                        <ShieldCheck className="h-6 w-6 text-white" strokeWidth={2} />
                        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
                    </div>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Loading your portal…</p>
                </div>
            </main>
        );
    }

    if (!isSignedIn) return null;

    return (
        <div className="min-h-screen bg-bg dark:bg-bg-dark">
            <header className="sticky top-0 z-30 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-border/60 dark:border-border-dark/60">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent pointer-events-none" />
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-sm">
                                <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2} />
                                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
                            </div>
                            <div>
                                <h1 className="font-display text-base font-semibold text-fg dark:text-fg-dark leading-tight">Tenant Portal</h1>
                                <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">Your lease, payments & receipts</p>
                            </div>
                        </div>
                        <nav className="hidden sm:flex items-center gap-1">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== "/portal" && pathname?.startsWith(item.href));
                                return (
                                    <Link key={item.href} href={item.href} className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? "text-brand-800 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30" : "text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"}`}>
                                        <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="flex sm:hidden items-center gap-1">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== "/portal" && pathname?.startsWith(item.href));
                                return (
                                    <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors ${isActive ? "text-brand dark:text-brand-400" : "text-fg-subtle dark:text-fg-subtle-dark"}`}>
                                        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.75} />
                                        <span className="text-[10px] font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                        {userId && (
                            <div className="hidden sm:flex items-center gap-2 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/40">
                                    <User className="h-3 w-3 text-brand dark:text-brand-300" strokeWidth={2} />
                                </span>
                                <span className="max-w-[100px] truncate font-medium text-fg dark:text-fg-dark">{userId.slice(0, 8)}…</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
        </div>
    );
}

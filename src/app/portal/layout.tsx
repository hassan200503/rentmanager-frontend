// app/portal/layout.tsx
"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

export default function TenantPortalLayout({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/public/sign-in");
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded) {
        return (
            <main className="min-h-screen bg-canvas flex items-center justify-center">
                <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                    Loading portal…
                </div>
            </main>
        );
    }

    if (!isSignedIn) {
        return null;
    }

    return (
        <div className="min-h-screen bg-canvas">
            <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-border">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800">
                                <ShieldCheck className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                            </div>
                            <div>
                                <h1 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">Tenant Portal</h1>
                                <p className="text-xs text-ink-muted">Your lease, payments & receipts</p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-4 text-sm">
                            <a href="/portal" className="text-ink-muted hover:text-ink transition-colors">Dashboard</a>
                            <a href="/portal/payments" className="text-ink-muted hover:text-ink transition-colors">Payments</a>
                            <a href="/portal/lease" className="text-ink-muted hover:text-ink transition-colors">Lease</a>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
    );
}
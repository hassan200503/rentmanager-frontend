// app/portal/layout.tsx
"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { BrandBadge } from "@/shared/components/brand";
import TenantShell from "@/features/tenant-portal/components/tenant-shell";

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
            <main className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <BrandBadge size="lg" />
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Loading your portal…</p>
                </div>
            </main>
        );
    }

    if (!isSignedIn) return null;

    return <TenantShell>{children}</TenantShell>;
}

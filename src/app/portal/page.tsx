// app/portal/page.tsx
"use client";

import { Suspense } from "react";
import { PremiumTenantDashboard } from "@/features/tenant-portal/components/premium-tenant-dashboard";
import { Loader2 } from "lucide-react";

// Premium tenant dashboard — fintech-grade UI with analytics and high-conversion payment widget
export default function TenantPortalDashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Loading your dashboard...</p>
                </div>
            </div>
        }>
            <PremiumTenantDashboard />
        </Suspense>
    );
}
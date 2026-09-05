// app/portal/page.tsx
"use client";

import { Suspense } from "react";
import {
    PremiumTenantDashboard,
    TenantDashboardSkeleton,
} from "@/features/tenant-portal/components/premium-tenant-dashboard";

// Premium tenant dashboard — fintech-grade UI with analytics and high-conversion payment widget
//
// The Suspense fallback below only covers the brief window before this
// client component's own code finishes loading — the dashboard's actual
// data-loading state is handled inside PremiumTenantDashboard itself, with
// the same TenantDashboardSkeleton. Reusing it here too means a renter never
// sees a plain spinner flash into a shaped skeleton a moment later.
export default function TenantPortalDashboardPage() {
    return (
        <Suspense fallback={<TenantDashboardSkeleton />}>
            <PremiumTenantDashboard />
        </Suspense>
    );
}
// app/portal/page.tsx
"use client";

import { Suspense } from "react";
import { TenantDashboard } from "@/features/tenant-portal/components/tenant-dashboard";

export default function TenantPortalDashboardPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="card-elevated p-4 space-y-2">
                            <div className="skeleton h-3 w-1/3" />
                            <div className="skeleton h-7 w-1/2" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card-elevated p-4 lg:col-span-2"><div className="skeleton h-64 w-full" /></div>
                    <div className="card-elevated p-4"><div className="skeleton h-64 w-full" /></div>
                </div>
            </div>
        }>
            <TenantDashboard />
        </Suspense>
    );
}
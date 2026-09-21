// app/portal/landlord/page.tsx
"use client";

import { Suspense } from "react";
import { TenantLandlordPage } from "@/features/tenant-portal/components/tenant-landlord";

export default function TenantPortalLandlordPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="hero-card p-6 space-y-3">
                    <div className="skeleton h-20 w-20 rounded-2xl" />
                    <div className="skeleton h-6 w-1/3" />
                    <div className="skeleton h-4 w-1/4" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="card-elevated p-4 space-y-2">
                            <div className="skeleton h-3 w-1/3" />
                            <div className="skeleton h-7 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        }>
            <TenantLandlordPage />
        </Suspense>
    );
}

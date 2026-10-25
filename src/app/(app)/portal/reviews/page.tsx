// app/portal/reviews/page.tsx
"use client";

import { Suspense } from "react";
import { TenantReviewsPage } from "@/features/tenant-portal/components/tenant-reviews";

export default function TenantPortalReviewsPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="hero-card p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="skeleton h-9 w-9 rounded-xl" />
                        <div className="skeleton h-3 w-24" />
                    </div>
                    <div className="space-y-2">
                        <div className="skeleton h-8 w-44" />
                        <div className="skeleton h-4 w-2/3" />
                        <div className="skeleton h-4 w-1/3" />
                    </div>
                    <div className="skeleton h-28 w-full sm:w-60 rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[0, 1].map((i) => (
                        <div key={i} className="card-elevated p-6 space-y-3">
                            <div className="skeleton h-5 w-36" />
                            <div className="skeleton h-24 w-full" />
                            <div className="skeleton h-10 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        }>
            <TenantReviewsPage />
        </Suspense>
    );
}
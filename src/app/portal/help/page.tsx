// app/portal/help/page.tsx
import { Suspense } from "react";
import TenantHelp from "@/features/tenant-portal/components/tenant-help";

function HelpSkeleton() {
    return (
        <div className="page-container py-6 sm:py-8 space-y-4">
            <div className="hero-card p-6 space-y-3">
                <div className="skeleton h-11 w-11 rounded-xl" />
                <div className="skeleton h-6 w-48" />
                <div className="skeleton h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="card-elevated p-5 space-y-2">
                        <div className="skeleton h-11 w-11 rounded-xl" />
                        <div className="skeleton h-4 w-32" />
                        <div className="skeleton h-3 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PortalHelpPage() {
    return (
        <Suspense fallback={<HelpSkeleton />}>
            <TenantHelp />
        </Suspense>
    );
}

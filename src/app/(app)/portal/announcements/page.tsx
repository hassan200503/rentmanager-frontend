import { Suspense } from "react";
import TenantAnnouncements from "@/features/tenant-portal/components/tenant-announcements";

function AnnouncementsSkeleton() {
    return (
        <div className="page-container py-6 sm:py-8 space-y-4">
            <div className="skeleton h-8 w-48 rounded-lg" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-elevated p-4 flex items-center gap-4">
                    <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-48 rounded" />
                        <div className="skeleton h-3 w-32 rounded" />
                    </div>
                    <div className="skeleton h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}

export default function PortalAnnouncementsPage() {
    return (
        <Suspense fallback={<AnnouncementsSkeleton />}>
            <TenantAnnouncements />
        </Suspense>
    );
}

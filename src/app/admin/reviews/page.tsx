"use client";

import { Star } from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import { PageHeader } from "@/features/admin/components/admin-ui";
import { ReviewsAdmin } from "@/features/admin/components/reviews-admin";

export default function AdminReviewsPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="mx-auto max-w-7xl space-y-6 p-6">
                    <PageHeader
                        title="Review moderation"
                        subtitle="Approve or hide platform reviews — both directions"
                        icon={Star}
                        iconTone="from-emerald-500 to-emerald-600"
                    />
                    <ReviewsAdmin />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
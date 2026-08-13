"use client";

import { Star } from "lucide-react";
import { ReviewsPage } from "@/features/reviews/components/reviews-page";

export default function DashboardReviewsPage() {
    return (
        <div className="animate-fade-in-up space-y-6">
            <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/20 ring-1 ring-white/20">
                    <Star className="h-7 w-7 text-white" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Reviews</h1>
                    <p className="text-sm text-ink-muted/80">
                        Ratings from your renters, the ones you give back — and your feedback on RentManager
                        itself. Every review is moderated before going public.
                    </p>
                </div>
            </div>

            <ReviewsPage />
        </div>
    );
}
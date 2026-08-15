"use client";

import { Suspense } from "react";
import { PremiumPaymentSuccess } from "@/features/tenant-portal/components/premium-payment-success";
import { Loader2 } from "lucide-react";

// Premium payment success page with confetti animation and auto-pay upsell
export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Loading payment details...</p>
                </div>
            </div>
        }>
            <PremiumPaymentSuccess />
        </Suspense>
    );
}

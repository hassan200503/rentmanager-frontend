"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function TenantRequiredPage() {
    return (
        <div className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center px-6">
            <div className="w-full max-w-md text-center animate-fade-in-up">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-800">
                    <Building2 className="h-6 w-6 text-brand dark:text-brand-300" strokeWidth={2} />
                </div>
                <h1 className="text-xl font-semibold text-ink dark:text-white">
                    You need an organization to continue
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-fg-muted-dark">
                    Create or join a landlord organization to manage properties,
                    tenants, and rent collection.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link href="/onboarding" className="btn-primary inline-flex items-center gap-2">
                        Set up your account
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <Link href="/" className="btn-secondary">
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}

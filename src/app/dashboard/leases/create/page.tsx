// src/app/dashboard/leases/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { LeaseForm } from "@/features/lease/components/lease-form";

export default function CreateLeasePage() {
    const router = useRouter();

    return (
        <div className="page-container max-w-2xl">
            <button
                onClick={() => router.push("/dashboard/leases")}
                className="inline-flex items-center gap-1.5 text-sm text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors mb-4"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to tenants
            </button>

            <div className="mb-6 flex items-start gap-3 animate-fade-in-up">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                    <FileText className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-xs font-medium text-fg-muted dark:text-fg-muted-dark uppercase tracking-wide mb-1">Leases</p>
                    <h1 className="page-title mb-1">New lease</h1>
                    <p className="page-subtitle mb-0">Create a new lease agreement</p>
                </div>
            </div>

            <div className="card animate-fade-in-up">
                <LeaseForm />
            </div>
        </div>
    );
}

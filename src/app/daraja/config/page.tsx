"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Smartphone,
    ShieldCheck,
    Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { DarajaConfigCard } from "@/features/daraja/components/daraja-config-card";

function PageHeader() {
    return (
        <div className="mb-6 animate-fade-in-up">
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors mb-4"
            >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back to dashboard
            </Link>
            <div className="flex items-start gap-3">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                    <Smartphone className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="page-title mb-1">M-Pesa configuration</h1>
                    <p className="page-subtitle mb-0">Manage your Daraja credentials for accepting rent payments.</p>
                </div>
            </div>
        </div>
    );
}

function InlineLoading() {
    return (
        <div className="page-container max-w-xl">
            <PageHeader />
            <div className="card flex items-center justify-center gap-2 py-10 text-sm text-fg-muted dark:text-fg-muted-dark">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Loading…
            </div>
        </div>
    );
}

function InlinePermissionDenied() {
    return (
        <div className="page-container max-w-xl">
            <PageHeader />
            <div className="card text-center py-10">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                    <ShieldCheck className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Restricted page</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    You don&#39;t have permission to view this page. Ask an account owner for access.
                </p>
            </div>
        </div>
    );
}

export default function DarajaConfigPage() {
    const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();

    if (isUserLoading) return <InlineLoading />;
    if (!isOwner) return <InlinePermissionDenied />;
    if (!user?.tenantId) return <InlineLoading />;

    return (
        <div className="page-container max-w-xl">
            <PageHeader />
            <DarajaConfigCard tenantId={user.tenantId} />
        </div>
    );
}

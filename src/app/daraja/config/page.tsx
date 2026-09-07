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
import { PayoutDestinationCard } from "@/features/settings/components/payout-destination-card";

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
                    <h1 className="page-title mb-1">Payment settings</h1>
                    <p className="page-subtitle mb-0">
                        Configure your M-Pesa credentials and payment routing.
                    </p>
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
            <div className="space-y-5">
                {/* Collection: the credentials rent is taken with. */}
                <DarajaConfigCard tenantId={user.tenantId} />
                {/* Payout: where the money actually lands. Configuring Daraja
                    without this is a half-finished setup — B2CDisbursementService
                    refuses to disburse when tenants.payout_phone_number is
                    unset, so the landlord collects rent that cannot be paid
                    out. It also lives on /dashboard/settings, which is the
                    only route a MANAGER can reach it by; writing it is
                    OWNER-only server-side, matching this page's own gate. */}
                <PayoutDestinationCard />
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import { Loader2, ShieldCheck, Plug, RefreshCw } from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import { PageHeader } from "@/features/admin/components/admin-ui";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";
import { useIntegrationProvidersQuery } from "@/features/integrations/hooks/use-integration-queries";
import { IntegrationProviderCard } from "@/features/integrations/components/integration-provider-card";
import { RollToProductionButton } from "@/features/integrations/components/integration-rollout";

function ProviderCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 dark:border-border-dark">
                <div className="h-11 w-11 animate-pulse rounded-xl bg-border-subtle dark:bg-border-subtle-dark" />
                <div className="space-y-2">
                    <div className="h-3.5 w-40 animate-pulse rounded bg-border-subtle dark:bg-border-subtle-dark" />
                    <div className="h-3 w-52 animate-pulse rounded bg-border-subtle/60 dark:bg-border-subtle-dark/60" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                {[0, 1].map((i) => (
                    <div key={i} className="space-y-3">
                        <div className="h-5 w-40 animate-pulse rounded bg-border-subtle dark:bg-border-subtle-dark" />
                        {[0, 1].map((j) => (
                            <div key={j} className="h-9 animate-pulse rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function IntegrationsContent() {
    const { isPlatformOwner } = usePlatformRole();
    const { data, isLoading, isError, refetch, isFetching } = useIntegrationProvidersQuery();

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <PageHeader
                title="Integrations"
                subtitle="Connect and manage the providers that power the platform"
                icon={Plug}
                iconTone="from-emerald-500 to-teal-600"
                actions={
                    <span className="flex items-center gap-2">
                        <RollToProductionButton
                            providers={data ?? []}
                            isOwner={isPlatformOwner}
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-medium text-fg-muted dark:border-border-dark dark:bg-surface-dark dark:text-fg-muted-dark">
                            <ShieldCheck className="h-3.5 w-3.5 text-success-dark dark:text-success" strokeWidth={2} />
                            {isPlatformOwner ? "Owner — full control" : "Admin — read only"}
                        </span>
                    </span>
                }
            />

            {isLoading ? (
                <div className="space-y-6">
                    {[0, 1, 2].map((i) => (
                        <ProviderCardSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <div className="card flex flex-col items-center justify-center gap-3 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
                        <ShieldCheck className="h-6 w-6 text-danger-dark dark:text-danger" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                        Could not load the integrations
                    </p>
                    <p className="max-w-sm text-sm text-fg-muted dark:text-fg-muted-dark">
                        The control plane didn&apos;t respond. Check that the backend is reachable and
                        try again.
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                    >
                        {isFetching ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                        ) : (
                            <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
                        )}
                        Try again
                    </button>
                </div>
            ) : data && data.length > 0 ? (
                <div className="space-y-6">
                    {data.map((provider) => (
                        <IntegrationProviderCard key={provider.providerKey} provider={provider} isOwner={isPlatformOwner} />
                    ))}
                </div>
            ) : (
                <div className="card flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">No providers</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                        The provider catalog is empty — nothing to configure yet.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function IntegrationsPage() {
    const { isPlatformAdmin, isLoading, isDenied } = usePlatformRole();

    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-24 text-sm text-fg-muted dark:text-fg-muted-dark">
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        Checking credentials…
                    </div>
                ) : isDenied || !isPlatformAdmin ? (
                    <div className="mx-auto max-w-md p-8 pt-10 text-center">
                        <div className="mb-6 flex items-center justify-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                                <ShieldCheck className="h-10 w-10 text-red-600 dark:text-red-400" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h1 className="mb-3 text-xl font-bold text-fg dark:text-fg-dark">
                            Access denied
                        </h1>
                        <p className="mb-6 text-sm text-fg-muted dark:text-fg-muted-dark">
                            This is the RentManager Platform Admin Console. You don&#39;t have the
                            required platform administrator privileges to access this area.
                        </p>
                        <Link
                            href="/dashboard"
                            className="block w-full rounded-xl bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-600"
                        >
                            Go to landlord dashboard
                        </Link>
                        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                            <p className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                Platform administrator?
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Contact your system administrator to configure the platform role in
                                your Clerk account.
                            </p>
                        </div>
                    </div>
                ) : (
                    <IntegrationsContent />
                )}
            </div>
        </AdminErrorBoundary>
    );
}
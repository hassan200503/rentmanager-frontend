"use client";

import Link from "next/link";
import {
    ShieldCheck,
    Loader2,
    Building2,
    Users,
    Home,
    Send,
    Settings,
    Landmark,
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CircleDashed,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    UserCheck,
    UserX,
    UserPlus,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";
import { useAdminOverviewQuery } from "@/features/admin/hooks/use-admin-queries";
import { formatCurrency } from "@/features/admin/components/admin-ui";

function StatCard({
    label,
    value,
    icon: Icon,
    tone = "brand",
    hint,
}: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    tone?: "brand" | "emerald" | "violet" | "amber" | "blue" | "rose";
    hint?: string;
}) {
    const tones: Record<string, string> = {
        brand: "from-blue-500 to-blue-600",
        emerald: "from-emerald-500 to-emerald-600",
        violet: "from-violet-500 to-violet-600",
        amber: "from-amber-500 to-amber-600",
        blue: "from-sky-500 to-sky-600",
        rose: "from-rose-500 to-rose-600",
    };
    return (
        <div className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${tones[tone]} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
            </div>
            <p className="text-2xl font-bold text-fg dark:text-fg-dark mb-0.5">{value}</p>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{label}</p>
            {hint && (
                <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark mt-1">{hint}</p>
            )}
        </div>
    );
}

function SectionCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-6">
            <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">{title}</h3>
            {subtitle && (
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">{subtitle}</p>
            )}
            {children}
        </div>
    );
}

function ModuleCard({
    title,
    description,
    icon: Icon,
    tone = "brand",
    href,
    disabled = false,
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    tone?: "brand" | "emerald" | "violet" | "amber" | "blue" | "rose";
    href: string;
    disabled?: boolean;
}) {
    const tones: Record<string, string> = {
        brand: "from-blue-500 to-blue-600",
        emerald: "from-emerald-500 to-emerald-600",
        violet: "from-violet-500 to-violet-600",
        amber: "from-amber-500 to-amber-600",
        blue: "from-sky-500 to-sky-600",
        rose: "from-rose-500 to-rose-600",
    };
    const content = (
        <div className="flex items-start justify-between gap-3 p-5 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark hover:border-brand/40 dark:hover:border-brand/30 hover:shadow-md transition-all duration-200 h-full">
            <div className="flex items-start gap-3">
                <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${tones[tone]} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-0.5">{title}</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{description}</p>
                </div>
            </div>
            {disabled ? (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-border-subtle dark:bg-border-subtle-dark text-fg-subtle dark:text-fg-subtle-dark">
                    Soon
                </span>
            ) : (
                <ChevronRight className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark mt-1 shrink-0" strokeWidth={2} />
            )}
        </div>
    );
    if (disabled) return <div className="h-full opacity-70 cursor-not-allowed">{content}</div>;
    return <Link href={href} className="block h-full">{content}</Link>;
}

function OverviewContent() {
    const { data, isLoading, isError } = useAdminOverviewQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-fg-muted dark:text-fg-muted-dark">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Loading platform overview…
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load platform stats</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The admin overview endpoint is unreachable. Check the backend service and try again.
                </p>
            </div>
        );
    }

    const { platform, payments, disbursements } = data;

    const gmvDelta =
        payments.gmvPreviousMonth > 0
            ? ((payments.gmvCurrentMonth - payments.gmvPreviousMonth) / payments.gmvPreviousMonth) * 100
            : null;
    const commissionDelta =
        payments.commissionPreviousMonth > 0
            ? ((payments.commissionCurrentMonth - payments.commissionPreviousMonth) / payments.commissionPreviousMonth) * 100
            : null;

    const paymentTotal = payments.paymentRequestsPending + payments.paymentRequestsPaid + payments.paymentRequestsFailed;

    return (
        <div className="space-y-6">
            {/* Platform stats */}
            <div>
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">Landlord platform</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total landlords" value={platform.totalTenants} icon={Building2} tone="brand" />
                    <StatCard label="Active landlords" value={platform.activeTenants} icon={UserCheck} tone="emerald" hint={`${platform.activeTenants}/${platform.totalTenants} onboarded`} />
                    <StatCard label="Pending onboarding" value={platform.pendingOnboardingTenants} icon={UserPlus} tone="amber" />
                    <StatCard label="Suspended landlords" value={platform.suspendedTenants} icon={UserX} tone="rose" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <StatCard label="Total properties" value={platform.totalProperties} icon={Home} tone="violet" />
                    <StatCard label="Total units" value={platform.totalUnits} icon={Landmark} tone="blue" />
                    <StatCard label="Active leases" value={platform.activeLeases} icon={CheckCircle2} tone="emerald" />
                    <StatCard label="Total renters" value={platform.totalRenters} icon={Users} tone="amber" />
                </div>
            </div>

            {/* Payments & disbursements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard
                    title="Payments & commission"
                    subtitle="Current month vs previous month (GMV = gross rental volume)"
                >
                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                            <div>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-0.5">GMV this month</p>
                                <p className="text-lg font-bold text-fg dark:text-fg-dark">
                                    {formatCurrency(payments.gmvCurrentMonth)}
                                </p>
                            </div>
                            {gmvDelta !== null && (
                                <span className={`inline-flex items-center gap-1 text-xs font-medium ${gmvDelta >= 0 ? "text-success-dark" : "text-danger"}`}>
                                    {gmvDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> : <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />}
                                    {gmvDelta >= 0 ? "+" : ""}
                                    {gmvDelta.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                            <div>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-0.5">Platform commission this month</p>
                                <p className="text-lg font-bold text-fg dark:text-fg-dark">
                                    {formatCurrency(payments.commissionCurrentMonth)}
                                </p>
                            </div>
                            {commissionDelta !== null && (
                                <span className={`inline-flex items-center gap-1 text-xs font-medium ${commissionDelta >= 0 ? "text-success-dark" : "text-danger"}`}>
                                    {commissionDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> : <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />}
                                    {commissionDelta >= 0 ? "+" : ""}
                                    {commissionDelta.toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-6 pt-1">
                            <div className="flex items-center gap-2 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <span className="h-2 w-2 rounded-full bg-warning" />
                                {payments.paymentRequestsPending} pending
                            </div>
                            <div className="flex items-center gap-2 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <span className="h-2 w-2 rounded-full bg-success" />
                                {payments.paymentRequestsPaid} paid
                            </div>
                            <div className="flex items-center gap-2 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <span className="h-2 w-2 rounded-full bg-danger" />
                                {payments.paymentRequestsFailed} failed
                            </div>
                            <div className="flex items-center gap-2 text-xs text-fg-muted dark:text-fg-muted-dark ml-auto">
                                {paymentTotal} total
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Disbursements"
                    subtitle="MPESA payout pipeline across the platform"
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            { label: "Initiated", value: disbursements.initiated, icon: CircleDashed, chip: "bg-info/10 text-info-dark" },
                            { label: "Pending", value: disbursements.pending, icon: Clock, chip: "bg-warning/10 text-warning-dark" },
                            { label: "Succeeded", value: disbursements.success, icon: CheckCircle2, chip: "bg-success/10 text-success-dark" },
                            { label: "Failed", value: disbursements.failed, icon: XCircle, chip: "bg-danger/10 text-danger" },
                        ].map(({ label, value, icon: Icon, chip }) => (
                            <div key={label} className={`rounded-lg ${chip} px-4 py-3`}>
                                <Icon className="h-4 w-4 mb-2" strokeWidth={2} />
                                <p className="text-lg font-bold text-fg dark:text-fg-dark">{value}</p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{label}</p>
                            </div>
                        ))}
                        {disbursements.requiresManualAttention > 0 && (
                            <div className="rounded-lg bg-danger/10 text-danger-dark dark:text-danger px-4 py-3 col-span-2 sm:col-span-3 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                                <span className="text-xs font-medium">
                                    {disbursements.requiresManualAttention} payout{disbursements.requiresManualAttention > 1 ? "s" : ""} require manual attention
                                </span>
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* Modules */}
            <div>
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">Platform management</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ModuleCard title="Landlords" description="Oversee tenant orgs, billing mode and status" icon={Building2} tone="brand" href="/admin/landlords" disabled />
                    <ModuleCard title="Renters" description="Directory of all renters across the platform" icon={Users} tone="emerald" href="/admin/renters" disabled />
                    <ModuleCard title="Properties" description="Platform-wide property and unit inventory" icon={Home} tone="violet" href="/admin/properties" disabled />
                    <ModuleCard title="Disbursements" description="Monitor and retry MPESA payout batches" icon={Send} tone="blue" href="/admin/disbursements" disabled />
                    <ModuleCard title="Commission policy" description="Default and per-landlord commission rates" icon={Wallet} tone="amber" href="/admin/commission" disabled />
                    <ModuleCard title="Platform settings" description="Environment, billing and configuration" icon={Settings} tone="rose" href="/admin/settings" disabled />
                </div>
            </div>
        </div>
    );
}

function AdminConsolePage() {
    const { role, isPlatformAdmin, isLoading, isDenied } = usePlatformRole();

    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-24 text-sm text-fg-muted dark:text-fg-muted-dark">
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        Checking credentials…
                    </div>
                ) : isDenied || !isPlatformAdmin ? (
                    <div className="max-w-md mx-auto text-center p-8 mt-10">
                        <div className="flex items-center justify-center mb-6">
                            <div className="h-20 w-20 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <ShieldCheck className="h-10 w-10 text-red-600 dark:text-red-400" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-fg dark:text-fg-dark mb-3">
                            Access denied
                        </h1>
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6">
                            This is the RentManager Platform Admin Console. You don&#39;t have the required
                            platform administrator privileges to access this area.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard"
                                className="block w-full px-6 py-3 rounded-xl bg-brand hover:bg-brand-600 text-white font-medium transition-colors"
                            >
                                Go to landlord dashboard
                            </Link>
                        </div>
                        <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                                Platform administrator?
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                Contact your system administrator to configure the platform role in your Clerk account.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto p-6 space-y-6">
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                                    <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-fg dark:text-fg-dark flex items-center gap-2">
                                        Platform Admin Console
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand/20">
                                            {role}
                                        </span>
                                    </h1>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                        Platform-wide management and oversight tools
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard"
                                className="text-sm text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
                            >
                                Back to landlord dashboard
                            </Link>
                        </div>

                        <OverviewContent />
                    </div>
                )}
            </div>
        </AdminErrorBoundary>
    );
}

export default AdminConsolePage;

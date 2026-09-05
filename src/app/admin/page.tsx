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
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    CircleDashed,
    UserPlus,
    ArrowUpRight,
    Plug,
} from "lucide-react";import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";
import { useAdminOverviewQuery } from "@/features/admin/hooks/use-admin-queries";
import { PageHeader, formatCurrency } from "@/features/admin/components/admin-ui";
import { toMoneyNumber } from "@/shared/utils/money";

const TONE_MAP: Record<string, string> = {
    brand: "from-emerald-500 to-emerald-600",
    emerald: "from-emerald-500 to-emerald-600",
    violet: "from-violet-500 to-violet-600",
    amber: "from-amber-500 to-amber-600",
    blue: "from-sky-500 to-sky-600",
    rose: "from-rose-500 to-rose-600",
    teal: "from-teal-500 to-cyan-600",
};

function compactKes(value: number) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `K${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `K${(value / 1_000).toFixed(0)}K`;
    return `K${value}`;
}

function DeltaPill({ value }: { value: number | null }) {
    if (value === null) return null;
    const positive = value >= 0;
    return (
        <span className={`delta-pill ${positive ? "delta-pill-positive" : "delta-pill-negative"}`}>
            {positive ? <TrendingUp className="h-3 w-3" strokeWidth={2.5} /> : <TrendingDown className="h-3 w-3" strokeWidth={2.5} />}
            {positive ? "+" : ""}
            {value.toFixed(1)}%
        </span>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone = "brand",
    delta,
    hint,
}: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    tone?: string;
    delta?: number | null;
    hint?: string;
}) {
    return (
        <div className="stat-tile">
            <div className="flex items-start justify-between gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${TONE_MAP[tone] ?? TONE_MAP.brand} flex items-center justify-center shadow-lg shadow-brand-500/10`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                {delta !== undefined && <DeltaPill value={delta} />}
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-fg dark:text-fg-dark tabular-nums">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark">{label}</p>
            {hint && <p className="mt-1.5 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">{hint}</p>}
        </div>
    );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">{title}</h3>
            {subtitle && <p className="-mt-3 text-xs text-fg-muted dark:text-fg-muted-dark">{subtitle}</p>}
            {children}
        </div>
    );
}

function chartTooltipStyle() {
    return {
        borderRadius: "0.75rem",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-fg)",
        fontSize: "12px",
        boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
    };
}

function AttentionCard({
    icon: Icon,
    label,
    count,
    detail,
    href,
    tone,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    count: number;
    detail: string;
    href: string;
    tone: "amber" | "rose" | "violet";
}) {
    const chip = {
        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        rose: "bg-danger/10 text-danger",
        violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    }[tone];
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-4 transition-all duration-200 hover:border-brand/40 hover:shadow-md"
        >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg dark:text-fg-dark tabular-nums">
                    {count} <span className="font-medium text-fg-muted dark:text-fg-muted-dark">{label}</span>
                </p>
                <p className="truncate text-[11px] text-fg-subtle dark:text-fg-subtle-dark">{detail}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-fg-subtle dark:text-fg-subtle-dark transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" strokeWidth={2} />
        </Link>
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
    tone?: string;
    href: string;
    disabled?: boolean;
}) {
    const content = (
        <div className="flex items-start justify-between gap-3 p-5 rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark hover:border-brand/40 dark:hover:border-brand/30 hover:shadow-md transition-all duration-200 h-full">
            <div className="flex items-start gap-3">
                <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${TONE_MAP[tone] ?? TONE_MAP.brand} flex items-center justify-center`}>
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

    const gmvCurrentMonth = toMoneyNumber(payments.gmvCurrentMonth);
    const gmvPreviousMonth = toMoneyNumber(payments.gmvPreviousMonth);
    const commissionCurrentMonth = toMoneyNumber(payments.commissionCurrentMonth);
    const commissionPreviousMonth = toMoneyNumber(payments.commissionPreviousMonth);

    const gmvDelta =
        gmvPreviousMonth > 0
            ? ((gmvCurrentMonth - gmvPreviousMonth) / gmvPreviousMonth) * 100
            : null;
    const commissionDelta =
        commissionPreviousMonth > 0
            ? ((commissionCurrentMonth - commissionPreviousMonth) / commissionPreviousMonth) * 100
            : null;

    const paymentTotal = payments.paymentRequestsPending + payments.paymentRequestsPaid + payments.paymentRequestsFailed;
    const disbursementTotal = disbursements.initiated + disbursements.pending + disbursements.success + disbursements.failed;

    const revenueData = [
        { label: "GMV", current: gmvCurrentMonth, previous: gmvPreviousMonth },
        { label: "Commission", current: commissionCurrentMonth, previous: commissionPreviousMonth },
    ];

    const pipelineData = [
        { name: "Initiated", value: disbursements.initiated, color: "var(--color-info)" },
        { name: "Pending", value: disbursements.pending, color: "var(--color-warning)" },
        { name: "Succeeded", value: disbursements.success, color: "var(--color-success)" },
        { name: "Failed", value: disbursements.failed, color: "var(--color-danger)" },
    ].filter((d) => d.value > 0);

    const attention = [
        ...(payments.paymentRequestsFailed > 0
            ? [{ key: "failed-payments", icon: XCircle, label: "failed payments", count: payments.paymentRequestsFailed, detail: "M-Pesa payments that never settled", href: "/admin/payments", tone: "rose" as const }]
            : []),
        ...(payments.paymentRequestsPending > 0
            ? [{ key: "pending-payments", icon: Clock, label: "payments pending", count: payments.paymentRequestsPending, detail: "Awaiting STK confirmation", href: "/admin/payments", tone: "amber" as const }]
            : []),
        ...(disbursements.requiresManualAttention > 0
            ? [{ key: "manual", icon: AlertTriangle, label: "payouts need attention", count: disbursements.requiresManualAttention, detail: "Failed repeatedly — manual intervention required", href: "/admin/disbursements", tone: "rose" as const }]
            : []),
        ...(platform.pendingOnboardingTenants > 0
            ? [{ key: "onboarding", icon: UserPlus, label: "landlords onboarding", count: platform.pendingOnboardingTenants, detail: "Incomplete setup, pending activation", href: "/admin/landlords", tone: "violet" as const }]
            : []),
    ];

    return (
        <div className="space-y-6">
            {/* Primary KPI band */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="GMV this month"
                    value={formatCurrency(payments.gmvCurrentMonth)}
                    icon={TrendingUp}
                    tone="emerald"
                    delta={gmvDelta}
                    hint="Gross rental volume vs last month"
                />
                <StatCard
                    label="Platform commission"
                    value={formatCurrency(payments.commissionCurrentMonth)}
                    icon={Wallet}
                    tone="violet"
                    delta={commissionDelta}
                    hint="Revenue share collected this month"
                />
                <StatCard
                    label="Active landlords"
                    value={platform.activeTenants.toLocaleString()}
                    icon={Building2}
                    tone="brand"
                    hint={`${platform.activeTenants}/${platform.totalTenants} onboarded · ${platform.suspendedTenants} suspended`}
                />
                <StatCard
                    label="Payment requests"
                    value={paymentTotal.toLocaleString()}
                    icon={CircleDashed}
                    tone="amber"
                    hint={`${payments.paymentRequestsPending} pending · ${payments.paymentRequestsFailed} failed`}
                />
            </div>

            {/* Secondary platform stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Total properties" value={platform.totalProperties.toLocaleString()} icon={Home} tone="brand" />
                <StatCard label="Total units" value={platform.totalUnits.toLocaleString()} icon={Landmark} tone="blue" />
                <StatCard label="Active leases" value={platform.activeLeases.toLocaleString()} icon={CheckCircle2} tone="emerald" />
                <StatCard label="Total renters" value={platform.totalRenters.toLocaleString()} icon={Users} tone="violet" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Revenue pulse" subtitle="Current vs previous month (KES)">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: "var(--color-fg-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={compactKes} tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                                <Tooltip
                                    cursor={{ fill: "var(--color-border-subtle)", opacity: 0.6 }}
                                    contentStyle={chartTooltipStyle()}
                                    formatter={(value, name) => [formatCurrency(Number(value ?? 0)), name === "current" ? "This month" : "Last month"]}
                                />
                                <Bar dataKey="previous" fill="var(--color-border)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                                <Bar dataKey="current" fill="var(--color-brand)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-5 pt-1 text-[11px] text-fg-muted dark:text-fg-muted-dark">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> This month
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-border dark:bg-border-dark" /> Last month
                        </span>
                    </div>
                </SectionCard>

                <SectionCard title="Disbursement pipeline" subtitle="MPESA payout flow across the platform">
                    <div className="flex h-64 items-center">
                        <div className="relative h-52 w-52 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pipelineData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={62}
                                        outerRadius={88}
                                        paddingAngle={3}
                                        strokeWidth={0}
                                    >
                                        {pipelineData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={chartTooltipStyle()} formatter={(value, name) => [String(value ?? 0), name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-bold tracking-tight text-fg dark:text-fg-dark tabular-nums">
                                    {disbursementTotal.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark">total payouts</p>
                            </div>
                        </div>
                        <div className="ml-2 flex-1 space-y-2.5">
                            {pipelineData.map((entry) => (
                                <div key={entry.name} className="flex items-center gap-2 text-xs">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: entry.color }} />
                                    <span className="text-fg-muted dark:text-fg-muted-dark">{entry.name}</span>
                                    <span className="ml-auto font-semibold text-fg dark:text-fg-dark tabular-nums">{entry.value}</span>
                                </div>
                            ))}
                            {disbursements.requiresManualAttention > 0 && (
                                <div className="mt-2 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-[11px] font-medium text-danger">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                                    {disbursements.requiresManualAttention} require manual attention
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* Attention queue */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">Needs your attention</h3>
                    {attention.length > 0 && (
                        <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                            {attention.length} area{attention.length > 1 ? "s" : ""} flagged
                        </span>
                    )}
                </div>
                {attention.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {attention.map(({ key, ...item }) => (
                            <AttentionCard key={key} {...item} />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-5 py-4 text-sm text-fg-muted dark:text-fg-muted-dark">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success-dark dark:text-success" strokeWidth={2} />
                        All clear — no failed payments, stalled payouts or onboarding gaps.
                    </div>
                )}
            </div>

            {/* Modules */}
            <div>
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-3">Platform management</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ModuleCard title="Landlords" description="Oversee tenant orgs, billing mode and status" icon={Building2} tone="brand" href="/admin/landlords" />
                    <ModuleCard title="Renters" description="Directory of all renters across the platform" icon={Users} tone="emerald" href="/admin/renters" />
                    <ModuleCard title="Properties" description="Platform-wide property and unit inventory" icon={Home} tone="violet" href="/admin/properties" />
                    <ModuleCard title="Disbursements" description="Monitor and retry MPESA payout batches" icon={Send} tone="blue" href="/admin/disbursements" />
                    <ModuleCard title="Integrations" description="Configure M-Pesa, SMS, WhatsApp, email, storage and auth providers" icon={Plug} tone="teal" href="/admin/integrations" />
                    <ModuleCard title="Commission policy" description="Default and per-landlord commission rates" icon={Wallet} tone="amber" href="/admin/commission" />
                    <ModuleCard title="Platform settings" description="Branding, environment and configuration" icon={Settings} tone="rose" href="/admin/settings" />
                </div>
            </div>
        </div>
    );
}

function AdminConsolePage() {
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
                        <PageHeader
                            title="Overview"
                            subtitle="Platform health, revenue and attention in one glance"
                            icon={ShieldCheck}
                            iconTone="from-emerald-500 to-emerald-600"
                        />
                        <OverviewContent />
                    </div>
                )}
            </div>
        </AdminErrorBoundary>
    );
}

export default AdminConsolePage;

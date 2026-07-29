"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Receipt,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Smartphone,
  ArrowLeftRight,
  TrendingUp,
  Home,
  DoorOpen,
  Wrench,
  Sparkles,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Send,
} from "lucide-react";
import type { ElementType } from "react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { propertyApi } from "@/features/property/api/property-api";
import { PropertyStatus } from "@/features/property/types/property";
import { usePropertyDashboardMetrics } from "@/features/property/hooks/use-property-dashboard-metrics";
import { useActivityFeed } from "@/features/activity/hooks/use-activity-feed";
import { useDarajaStatusQuery } from "@/features/daraja/queries/use-daraja-status-query";
import PortfolioBar from "@/shared/components/dashboard/PortfolioBar";
import KpiCard, { KpiCardSkeleton } from "@/shared/components/dashboard/KpiCard";
import HealthScore from "@/shared/components/dashboard/HealthScore";
import PortfolioGrowthChart from "@/shared/components/dashboard/PortfolioGrowthChart";
import OccupancyTrendChart from "@/shared/components/dashboard/OccupancyTrendChart";
import PropertyDistributionChart from "@/shared/components/dashboard/PropertyDistributionChart";
import PropertyRanking, { PropertyRankingSkeleton } from "@/shared/components/dashboard/PropertyRanking";
import ActivityTimeline from "@/shared/components/dashboard/ActivityTimeline";
import PortfolioAlerts from "@/shared/components/dashboard/PortfolioAlerts";
import QuickActions from "@/shared/components/dashboard/QuickActions";
import FinancialOverview from "@/shared/components/dashboard/FinancialOverview";
import InsightsEngine from "@/shared/components/dashboard/InsightsEngine";
import { ScrollReveal } from "@/shared/components/motion/MotionComponents";
import { useOrgStore } from "@/stores/org-store";

function DashboardSkeleton() {
  return (
    <div className="page-container space-y-8">
      <div className="hero-card">
        <div className="skeleton h-4 w-32 mb-3" />
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-7 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated lg:col-span-2">
          <div className="skeleton h-64 w-full" />
        </div>
        <div className="card-elevated">
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function InlinePermissionDenied() {
  return (
    <div className="page-container">
      <div className="card max-w-xl mx-auto text-center mt-12">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
          <ShieldCheck className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Restricted page</p>
        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
          You don&apos;t have permission to view this page. Ask an account owner for access.
        </p>
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="page-container">
      <div className="card text-center py-10 max-w-xl mx-auto">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg dark:bg-danger-bg-dark">
          <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
        </div>
        <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&apos;t load your portfolio</p>
        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
          Please try again. If this keeps happening, contact support.
        </p>
        <button onClick={onRetry} className="btn-outline mx-auto">
          Retry
        </button>
      </div>
    </div>
  );
}

interface ModuleCardProps {
  icon: ElementType;
  title: string;
  note: string;
  href?: string;
}

function ModuleCard(props: ModuleCardProps) {
  const Icon = props.icon;
  const isAvailable = Boolean(props.href);

  const content = (
    <div className={`relative h-full rounded-2xl border transition-all duration-200 ${
      isAvailable
        ? "border-border/70 dark:border-border-dark/70 bg-surface dark:bg-surface-dark hover:border-brand-200 dark:hover:border-brand-700/40 hover:shadow-card-hover hover:-translate-y-0.5"
        : "border-dashed border-border dark:border-border-dark bg-transparent"
    }`}>
      {/* Subtle brand accent at top */}
      {isAvailable && (
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isAvailable ? "bg-brand-50 dark:bg-brand-800" : "bg-border-subtle dark:bg-border-subtle-dark"
          }`}>
            <Icon className={`h-4 w-4 ${isAvailable ? "text-brand dark:text-brand-300" : "text-fg-subtle dark:text-fg-subtle-dark"}`} strokeWidth={2} />
          </div>
          {isAvailable ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-700/30">
              Open
              <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
          ) : (
            <span className="rounded-full bg-border-subtle dark:bg-border-subtle-dark px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-fg-subtle dark:text-fg-subtle-dark">Coming soon</span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">{props.title}</h3>
        <p className="text-xs text-fg-muted dark:text-fg-muted-dark leading-relaxed">{props.note}</p>
      </div>
    </div>
  );

  if (props.href) {
    return <Link href={props.href} className="block h-full group">{content}</Link>;
  }

  return content;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toUpperCase?.() ?? "";
  const badgeMap: Record<string, string> = {
    ACTIVE: "badge-success",
    UNDER_MAINTENANCE: "badge-warning",
    MAINTENANCE: "badge-warning",
    DRAFT: "badge-neutral",
    ARCHIVED: "badge-neutral",
    VACANT: "badge-warning",
    PARTIALLY_OCCUPIED: "badge-info",
    FULLY_OCCUPIED: "badge-emerald",
    PENDING_PAYMENT: "badge-warning",
  };
  const cls = badgeMap[normalized] ?? "badge-neutral";
  return <span className={`${cls} !text-[10px]`}>{status?.toLowerCase()}</span>;
}

export default function DashboardPage() {
  const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();

  if (isUserLoading) return <div className="page-container"><DashboardSkeleton /></div>;
  if (!isOwner) return <InlinePermissionDenied />;
  if (!user?.tenantId) return <div className="page-container"><DashboardSkeleton /></div>;

  return <DashboardContent tenantId={user.tenantId} />;
}

type PropertyTableFilter = "active" | "all";

function DashboardContent({ tenantId }: { tenantId: string }) {
  const [propertyFilter, setPropertyFilter] = useState<PropertyTableFilter>("active");
  const tenantName = useOrgStore((state) => state.tenantName);

  const { metrics, isLoading: metricsLoading, isError: metricsError, refetch: refetchMetrics } =
    usePropertyDashboardMetrics(tenantId);
  const darajaStatus = useDarajaStatusQuery(tenantId);

  const propertiesQuery = useQuery({
    queryKey: ["properties", "dashboard-list", tenantId, propertyFilter],
    queryFn: () =>
      propertyApi.list(
        propertyFilter === "active"
          ? { page: 0, size: 5, status: PropertyStatus.ACTIVE }
          : { page: 0, size: 5 }
      ),
    enabled: Boolean(tenantId),
  });

  const {
    activities,
    isConnected,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useActivityFeed(tenantId);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  if (metricsLoading || propertiesQuery.isLoading) {
    return <div className="page-container"><DashboardSkeleton /></div>;
  }

  if (metricsError || propertiesQuery.isError) {
    return (
      <div className="page-container">
        <DashboardError
          onRetry={() => {
            refetchMetrics();
            propertiesQuery.refetch();
            refetchActivities();
          }}
        />
      </div>
    );
  }

  const isDarajaConnected = darajaStatus.data?.configured ?? false;
  const properties = propertiesQuery.data?.content ?? [];
  const lastUpdated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const occupancyRate =
    metrics.activeProperties > 0 ? Math.round((metrics.fullyOccupied / metrics.activeProperties) * 100) : null;
  const activeShare =
    metrics.totalProperties > 0 ? Math.round((metrics.activeProperties / metrics.totalProperties) * 100) : null;

  const portfolioHealthScore = occupancyRate != null
    ? Math.round(
        (occupancyRate * 0.6) +
        ((metrics.activeProperties / Math.max(metrics.totalProperties, 1)) * 100 * 0.2) +
        (metrics.vacant === 0 ? 20 : Math.max(0, 20 - metrics.vacant * 5))
      )
    : 0;

  const healthBreakdown = {
    occupancy: occupancyRate ?? 0,
    collections: portfolioHealthScore,
    maintenance: metrics.underMaintenance > 0 ? Math.max(0, 100 - metrics.underMaintenance * 15) : 100,
    revenue: occupancyRate != null ? Math.min(100, occupancyRate + 10) : 0,
  };

  const attentionCount = metrics.vacant + metrics.underMaintenance;

  return (
    <div className="page-container space-y-8">

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 1: Executive Hero — Portfolio Health, Revenue, Occupancy
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="hero-card"
      >
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-semibold text-fg dark:text-fg-dark">
                {greeting}{tenantName ? `, ${tenantName}` : ""}
              </p>
              <span className="status-dot-success status-dot-live" title="Live" />
            </div>
            <h1 className="page-title !text-[2rem] mb-1">Portfolio Overview</h1>
            <p className="page-subtitle !text-sm">
              Your rental business at a glance.
              <span className="text-fg-muted dark:text-fg-muted-dark ml-2 text-xs">
                Updated {lastUpdated}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard/properties/create" className="btn-primary !gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Property
            </Link>
            <button type="button" className="btn-ghost btn-sm">
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Hero metrics */}
        <div className="hero-metrics grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 relative z-10">
          <div className="kpi-metric">
            <span className="kpi-metric-label">Portfolio Health</span>
            <div className="flex items-baseline gap-2">
              <span className="kpi-metric-value" style={{ color: portfolioHealthScore >= 80 ? "var(--color-success)" : portfolioHealthScore >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                {portfolioHealthScore}%
              </span>
              <span className={`text-xs font-semibold ${portfolioHealthScore >= 80 ? "text-success" : portfolioHealthScore >= 60 ? "text-warning-dark dark:text-warning" : "text-danger"}`}>
                {portfolioHealthScore >= 80 ? "Healthy" : portfolioHealthScore >= 60 ? "Fair" : "Needs attention"}
              </span>
            </div>
          </div>
          <div className="kpi-metric">
            <span className="kpi-metric-label">Occupancy</span>
            <div className="flex items-baseline gap-2">
              <span className="kpi-metric-value">{occupancyRate != null ? `${occupancyRate}%` : "—"}</span>
              {occupancyRate != null && (
                <span className={`kpi-metric-change ${occupancyRate >= 80 ? "positive" : "negative"}`}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                    <path d={occupancyRate >= 80 ? "M4 1L6.5 6H1.5L4 1Z" : "M4 7L1.5 2H6.5L4 7Z"} fill="currentColor" />
                  </svg>
                  {occupancyRate}%
                </span>
              )}
            </div>
          </div>
          <div className="kpi-metric">
            <span className="kpi-metric-label">Monthly Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="kpi-metric-value">KES 0</span>
            </div>
          </div>
          <div className="kpi-metric">
            <span className="kpi-metric-label">Collection Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="kpi-metric-value">—</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 2: Portfolio Health + Executive KPIs
         ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      >
        {/* Portfolio Health — expanded executive component */}
        <div className="lg:col-span-1">
          <div className="card-elevated h-full">
            <h2 className="section-title !text-sm mb-4">Portfolio Health</h2>
            <HealthScore score={portfolioHealthScore} breakdown={healthBreakdown} />
          </div>
        </div>

        {/* KPI Cards row */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title !text-sm">Key Metrics</h2>
            {attentionCount > 0 && (
              <span className="badge badge-warning !text-[10px]">{attentionCount} need attention</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              icon={Building2}
              label="Total Properties"
              value={metrics.totalProperties}
              subtitle="in portfolio"
              badge={{ label: metrics.totalProperties > 0 ? "Active" : "Empty", variant: metrics.totalProperties > 0 ? "emerald" : "neutral" }}
              sparklineData={[2, 3, 5, 4, 6, 8, 10, 12, 14, 16, 18, metrics.totalProperties]}
            />
            <KpiCard
              icon={DoorOpen}
              label="Active Properties"
              value={metrics.activeProperties}
              subtitle={`${activeShare != null ? activeShare : 0}% of total`}
              trend={activeShare != null && activeShare >= 60 ? { value: 12, positive: true } : { value: 8, positive: false }}
              iconColor="var(--color-brand)"
              iconBg="var(--color-brand-50)"
            />
            <KpiCard
              icon={CheckCircle2}
              label="Fully Occupied"
              value={metrics.fullyOccupied}
              subtitle={`${occupancyRate != null ? occupancyRate : 0}% occupancy`}
              badge={occupancyRate != null && occupancyRate >= 80 ? { label: "Strong", variant: "emerald" } : { label: "Below target", variant: "warning" }}
              sparklineData={[45, 50, 55, 52, 58, 62, 65, 68, 72, 75, 78, occupancyRate ?? 0]}
            />
            <KpiCard
              icon={TrendingUp}
              label="Occupancy Rate"
              value={occupancyRate != null ? `${occupancyRate}%` : "—"}
              subtitle="of active properties"
              trend={occupancyRate != null && occupancyRate >= 80 ? { value: 5, positive: true } : undefined}
              iconColor={occupancyRate != null && occupancyRate >= 80 ? "var(--color-success)" : "var(--color-warning)"}
              iconBg={occupancyRate != null && occupancyRate >= 80 ? "var(--color-success-bg)" : "var(--color-warning-bg)"}
            />
            <KpiCard
              icon={AlertTriangle}
              label="Vacant"
              value={metrics.vacant}
              subtitle="properties to fill"
              badge={metrics.vacant > 0 ? { label: "Needs attention", variant: "warning" } : { label: "None", variant: "success" }}
              iconColor="var(--color-danger)"
              iconBg="var(--color-danger-bg)"
            />
            <KpiCard
              icon={Wrench}
              label="Under Maintenance"
              value={metrics.underMaintenance}
              subtitle="properties"
              badge={metrics.underMaintenance > 0 ? { label: "In progress", variant: "warning" } : { label: "None", variant: "success" }}
              iconColor="var(--color-warning)"
              iconBg="var(--color-warning-bg)"
            />
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 2: Financial Intelligence
         ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Financial Intelligence</h2>
            <Link href="/dashboard/payments" className="link-brand inline-flex items-center gap-1 text-xs hover:underline">
              View payments <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
          <FinancialOverview />
        </div>
      </ScrollReveal>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 3: Analytics Command Center
         ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <div>
          <h2 className="section-title mb-4">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Portfolio Growth */}
          <div className="card-elevated lg:col-span-1">
            <h3 className="section-header !text-sm !mb-0">Portfolio Growth</h3>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">12-month trend</p>
            <PortfolioGrowthChart currentProperties={metrics.activeProperties} />
          </div>

          {/* Occupancy Trend */}
          <div className="card-elevated lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="section-header !text-sm !mb-0">Occupancy Trend</h3>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Last 12 months</p>
              </div>
              {occupancyRate != null && (
                <span className={`badge ${occupancyRate >= 80 ? "badge-emerald" : "badge-warning"} !text-[10px]`}>
                  {occupancyRate}%
                </span>
              )}
            </div>
            <OccupancyTrendChart currentRate={occupancyRate} />
          </div>

          {/* Portfolio Composition */}
          <div className="card-elevated lg:col-span-1">
            <h3 className="section-header !text-sm !mb-0">Portfolio Composition</h3>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Active vs draft vs archived</p>
            <PortfolioBar
              active={metrics.activeProperties}
              underMaintenance={metrics.underMaintenance}
              draft={metrics.draft}
              archived={metrics.archived}
            />
          </div>
        </div>

        {/* Second row: Property Distribution + Top Properties + M-Pesa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="card-elevated">
            <h3 className="section-header !text-sm !mb-0">Property Distribution</h3>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">By type</p>
            <PropertyDistributionChart />
          </div>

          <div className="card-elevated">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-header !text-sm !mb-0">Top Properties</h3>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">By occupancy rate</p>
              </div>
              <Sparkles className="h-4 w-4 text-brand" strokeWidth={1.75} />
            </div>
            {propertiesQuery.isLoading ? <PropertyRankingSkeleton /> : <PropertyRanking properties={properties} />}
          </div>

          <div className="card-elevated">
            <h3 className="section-header !text-sm !mb-0">M-Pesa</h3>
            <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Payment gateway</p>
            {darajaStatus.isLoading ? (
              <div className="skeleton h-6 w-32" />
            ) : isDarajaConnected ? (
              <Link href="/daraja/config" className="flex items-start gap-3 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800">
                  <Smartphone className="h-4 w-4 text-brand dark:text-brand-300" strokeWidth={2} />
                </div>
                <div>
                  <span className="badge badge-emerald !text-[11px]">
                    <span className="status-dot-success status-dot-live" />
                    Connected
                  </span>
                  <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1 group-hover:text-brand transition-colors">
                    Manage configuration
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-border-subtle dark:bg-border-subtle-dark">
                  <Smartphone className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
                </div>
                <div>
                  <span className="badge badge-neutral !text-[11px]">Not connected</span>
                  <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1 mb-2">
                    Link your till or paybill to collect rent via M-Pesa.
                  </p>
                  <Link href="/daraja/config" className="btn-primary !text-xs !py-1.5 !px-3 inline-flex">
                    Set up M-Pesa
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 3: Insights + Alerts
         ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
              <Lightbulb className="h-3.5 w-3.5 text-brand dark:text-brand-300" strokeWidth={1.75} />
            </div>
            <h3 className="section-header !text-sm !mb-0">Insights</h3>
          </div>
          <InsightsEngine
            occupancyRate={occupancyRate}
            vacant={metrics.vacant}
            activeProperties={metrics.activeProperties}
            totalProperties={metrics.totalProperties}
            underMaintenance={metrics.underMaintenance}
          />
        </div>
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-bg dark:bg-warning-bg-dark">
              <AlertTriangle className="h-3.5 w-3.5 text-warning-dark dark:text-warning" strokeWidth={1.75} />
            </div>
            <h3 className="section-header !text-sm !mb-0">Alerts</h3>
            {attentionCount > 0 && (
              <span className="badge badge-warning !text-[10px] ml-auto">{attentionCount}</span>
            )}
          </div>
          <PortfolioAlerts
            vacant={metrics.vacant}
            underMaintenance={metrics.underMaintenance}
            occupancyRate={occupancyRate}
            totalProperties={metrics.totalProperties}
            activeProperties={metrics.activeProperties}
          />
        </div>
        </div>
      </ScrollReveal>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 4: Activity + Properties
         ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Timeline */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-header !text-sm !mb-0">Activity</h3>
              <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Live feed</p>
            </div>
          </div>
          <ActivityTimeline activities={activities} isConnected={isConnected} isLoading={activitiesLoading} />
        </div>

        {/* Properties Table */}
        <div className="card-elevated lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="section-header !text-sm !mb-0">Properties</h3>
              <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                {properties.length} {properties.length === 1 ? "property" : "properties"} &middot; {metrics.activeProperties} active
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl bg-border-subtle dark:bg-border-subtle-dark p-0.5">
                <button
                  type="button"
                  onClick={() => setPropertyFilter("active")}
                  aria-pressed={propertyFilter === "active"}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    propertyFilter === "active"
                      ? "bg-surface dark:bg-surface-dark text-fg shadow-sm"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyFilter("all")}
                  aria-pressed={propertyFilter === "all"}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    propertyFilter === "all"
                      ? "bg-surface dark:bg-surface-dark text-fg shadow-sm"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  All
                </button>
              </div>
              {properties.length > 0 && (
                <Link
                  href="/dashboard/properties"
                  className="link-brand inline-flex items-center gap-1 text-xs hover:underline"
                >
                  View all
                  <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
                </Link>
              )}
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Home className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
              </div>
              <p className="empty-state-title">
                {propertyFilter === "active" ? "No active properties" : "No properties yet"}
              </p>
              <p className="empty-state-description mb-4">
                {propertyFilter === "active"
                  ? "Activate a property or switch to \"All\" to see draft and archived listings."
                  : "Add your first property to start tracking occupancy and rent."}
              </p>
              <Link href="/dashboard/properties/create" className="btn-primary inline-flex w-fit">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Add property
              </Link>
            </div>
          ) : (
            <div className="table-container -mx-2">
              <table className="table-premium">
                <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Occupancy</th>
                  <th></th>
                </tr>
                </thead>
                <tbody>
                {properties.map((p) => (
                  <tr key={p.propertyId} className="table-row-hover transition-colors">
                    <td>
                      <Link href={`/dashboard/properties/${p.propertyId}`} className="flex items-center gap-3 group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 text-[12px] font-bold text-brand-dark dark:text-brand-200 transition-all group-hover:scale-105 group-hover:shadow-sm">
                          {p.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-fg group-hover:text-brand transition-colors">{p.name}</span>
                          <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark capitalize">{p.propertyType?.toLowerCase()}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-fg-muted dark:text-fg-muted-dark text-xs capitalize">{p.propertyType?.toLowerCase()}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <StatusBadge status={p.occupancyStatus ?? "VACANT"} />
                    </td>
                    <td className="text-right">
                      <ChevronRight className="h-4 w-4 inline-block text-fg-subtle dark:text-fg-subtle-dark opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </ScrollReveal>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 4: Quick Actions
         ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="section-title !text-sm">Quick Actions</h2>
          </div>
          <QuickActions />
        </div>
      </ScrollReveal>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 5: Module Quick Access
         ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark mb-3">
            Module access
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModuleCard
              icon={ArrowLeftRight}
              title="Payments"
              note="Live payments, charges, and adjustments feed"
              href="/dashboard/payments" />
            <ModuleCard
              icon={Receipt}
              title="Rent ledger"
              note="Collection status, overdue balances"
              href="/dashboard/rent-ledger" />
            <ModuleCard
              icon={Users}
              title="Tenants"
              note="Residents, lease terms, rent collection"
              href="/dashboard/leases" />
            <ModuleCard icon={Send} title="Disbursements" note="B2C payouts, settlement status, pending transfers" href="/dashboard/disbursements" />
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
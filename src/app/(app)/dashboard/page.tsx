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
import { usePropertyOccupancyQuery } from "@/features/unit/hooks/use-unit-summary-query";
import { useRentLedgerSummaryQuery } from "@/features/rentledger/hooks/use-rent-ledger-summary";
import { formatCurrency } from "@/shared/utils/money";
import { MPesaIcon } from "@/shared/components/icons/MPesaIcon";
import { typeStyle, typeLabel } from "@/shared/components/dashboard/property-type-meta";
import PortfolioBar from "@/shared/components/dashboard/PortfolioBar";
import KpiCard, { KpiCardSkeleton } from "@/shared/components/dashboard/KpiCard";
import PropertyDistributionChart from "@/shared/components/dashboard/PropertyDistributionChart";
import OccupancyMixChart from "@/shared/components/dashboard/OccupancyMixChart";
import PropertyRanking, { PropertyRankingSkeleton } from "@/shared/components/dashboard/PropertyRanking";
import ActivityTimeline from "@/shared/components/dashboard/ActivityTimeline";
import PortfolioAlerts from "@/shared/components/dashboard/PortfolioAlerts";
import QuickActions from "@/shared/components/dashboard/QuickActions";
import FinancialOverview from "@/shared/components/dashboard/FinancialOverview";
import InsightsEngine from "@/shared/components/dashboard/InsightsEngine";
import { ScrollReveal } from "@/shared/components/motion/MotionComponents";
import { useOrgStore } from "@/stores/org-store";
import { SetupChecklist } from "@/features/tenant/components/SetupChecklist";
import { RedirectToOnboarding } from "@/features/tenant/components/RedirectToOnboarding";

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
  const Icon = props.icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;
  const isAvailable = Boolean(props.href);

  const content = (
    <div className={`module-card ${
      isAvailable
        ? "border-border/70 bg-surface shadow-sm hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover dark:border-border-dark/70 dark:bg-surface-dark dark:hover:border-brand-700/40"
        : "border-dashed border-border dark:border-border-dark bg-transparent"
    }`}>
      {isAvailable && (
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent" />
      )}
      <div className="module-card-content p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${
            isAvailable ? "bg-brand-50 dark:bg-brand-800" : "bg-border-subtle dark:bg-border-subtle-dark"
          }`}>
            <Icon className={`h-4 w-4 ${isAvailable ? "text-brand dark:text-brand-300" : "text-fg-subtle dark:text-fg-subtle-dark"}`} strokeWidth={2} />
          </div>
          {isAvailable ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-700/30 shadow-sm">
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
    INACTIVE: "badge-neutral",
    ARCHIVED: "badge-neutral",
    PENDING_PAYMENT: "badge-warning",
  };
  const cls = badgeMap[normalized] ?? "badge-neutral";
  const label = status?.replace(/_/g, " ").toLowerCase();
  const isLive = normalized === "ACTIVE";
  return (
    <span className={`${cls} !text-[9px] !px-1.5 !py-px`}>
      <span className={`status-badge-dot ${isLive ? "status-dot-live" : ""}`} />
      {label}
    </span>
  );
}

const OCCUPANCY_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  FULLY_OCCUPIED: {
    label: "Fully occupied",
    cls: "bg-success/10 text-success-dark ring-success/25 dark:bg-success-bg-dark dark:text-success dark:ring-success/25",
    dot: "bg-success",
  },
  PARTIALLY_OCCUPIED: {
    label: "Partially occupied",
    cls: "bg-warning/10 text-warning-dark ring-warning/25 dark:bg-warning-bg-dark dark:text-warning dark:ring-warning/25",
    dot: "bg-warning",
  },
  VACANT: {
    label: "Vacant",
    cls: "bg-danger/10 text-danger-dark ring-danger/25 dark:bg-danger-bg-dark dark:text-danger dark:ring-danger/25",
    dot: "bg-danger",
  },
};

const OCCUPANCY_DEFAULT = {
  label: "Unknown",
  cls: "bg-border-subtle text-fg-muted ring-black/10 dark:bg-border-subtle-dark dark:text-fg-muted-dark dark:ring-white/10",
  dot: "bg-fg-subtle dark:bg-fg-subtle-dark",
};

function OccupancyBadge({ status }: { status: string }) {
  const meta = OCCUPANCY_BADGE[status?.toUpperCase?.() ?? ""] ?? OCCUPANCY_DEFAULT;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-1.5 py-px text-[9px] font-semibold ring-1 ${meta.cls}`}>
      <span className={`status-badge-dot ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export default function DashboardPage() {
  const { user, isOwner, isLoading: isUserLoading, error, refetch } = useCurrentUser();

  // Order matters. Each check used to fall through to "Restricted page": an
  // API that was briefly unreachable, and an account with no organisation in
  // the database yet, both read as "not an owner", telling a new landlord to
  // ask an owner who does not exist. Only a real non-owner role sees that.
  if (isUserLoading) return <div className="page-container"><DashboardSkeleton /></div>;
  if (error) return <DashboardError onRetry={() => void refetch()} />;
  if (!user?.tenantId) return <RedirectToOnboarding />;
  if (!isOwner) return <InlinePermissionDenied />;

  return <DashboardContent tenantId={user.tenantId} />;
}

type PropertyTableFilter = "active" | "all";

function DashboardContent({ tenantId }: { tenantId: string }) {
  const [propertyFilter, setPropertyFilter] = useState<PropertyTableFilter>("active");
  const tenantName = useOrgStore((state) => state.tenantName);

  const { metrics, isLoading: metricsLoading, isError: metricsError, refetch: refetchMetrics } =
    usePropertyDashboardMetrics(tenantId);
  const darajaStatus = useDarajaStatusQuery(tenantId);
  const propertyOccupancyQuery = usePropertyOccupancyQuery();
  const ledgerSummaryQuery = useRentLedgerSummaryQuery(Boolean(tenantId));

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

  const portfolioQuery = useQuery({
    queryKey: ["properties", "portfolio-analysis", tenantId],
    queryFn: () => propertyApi.list({ page: 0, size: 100 }),
    enabled: Boolean(tenantId),
  });
  const portfolioProperties = portfolioQuery.data?.content ?? [];

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

  // Occupied units over total units, computed in SQL by GET /units/summary.
  // This was fullyOccupied/activeProperties — a count of PROPERTIES whose
  // status was FULLY_OCCUPIED over active properties — so a 40-unit block
  // with 39 tenants contributed zero.
  // Real occupied/total per property, counted in SQL. Keyed for O(1) lookup
  // in the panel rather than a find() per row.
  //
  // Declared before the loading/error returns below, not after: every Hook
  // in a component must run on every render, and this one used to sit past
  // those early returns — so on the loading/error render it was skipped
  // while the surrounding useState/useMemo calls still ran, changing the
  // number of Hooks called between renders. React matches Hooks to state by
  // call order alone, so that mismatch is a real corruption risk, not a
  // lint nicety — caught by eslint's react-hooks/rules-of-hooks.
  const occupancyByProperty = useMemo(() => {
    const rows = propertyOccupancyQuery.data ?? [];
    return Object.fromEntries(
      rows.map((r) => [
        r.propertyId,
        { totalUnits: r.totalUnits, occupiedUnits: r.occupiedUnits, occupancyPercent: r.occupancyPercent },
      ])
    );
  }, [propertyOccupancyQuery.data]);

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

  const occupancyRate = metrics.occupancyRate;

  const activeShare =
    metrics.totalProperties > 0 ? Math.round((metrics.activeProperties / metrics.totalProperties) * 100) : null;

  /*
   * REMOVED: portfolioHealthScore and healthBreakdown.
   *
   * portfolioHealthScore was a hand-weighted formula over property counts
   * (occupancy * 0.6, plus an active-share term, plus a vacancy penalty)
   * presented to a landlord as a percentage with a "Healthy / Fair / Needs
   * attention" verdict attached. No such metric is defined anywhere in the
   * product, so the number could not be checked, explained, or reproduced.
   *
   * healthBreakdown was worse: `collections` was assigned that same score and
   * contained no collections data whatsoever, and `revenue` was literally
   * `occupancyRate + 10`.
   *
   * A landlord who asks "why is my portfolio health 73%?" deserves an answer.
   * Until one of these has a definition that survives that question, showing
   * a number is worse than showing nothing — it spends the credibility the
   * rent ledger has actually earned. Real occupancy and real money figures
   * now occupy the space instead.
   */

  const attentionCount = metrics.vacantUnits + metrics.underMaintenance;

  return (
    <div className="page-container space-y-8">

      {/* Setup checklist — visible only while onboarding_completed = false */}
      <SetupChecklist />

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
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-fg dark:text-fg-dark">
                {greeting}{tenantName ? `, ${tenantName}` : ""}
              </p>
              <span className="executive-chip px-2.5 py-1 text-[11px] font-semibold">
                <span className="status-dot-success status-dot-live" title="Live" />
                Live portfolio
              </span>
            </div>
            <h1 className="page-title !text-[2.25rem] mb-1">Portfolio Overview</h1>
            <p className="page-subtitle !text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
              Your rental business at a glance.
              <span className="rounded-full border border-border/70 bg-surface/70 px-2 py-0.5 text-xs text-fg-muted shadow-sm dark:border-border-dark/70 dark:bg-surface-dark/70 dark:text-fg-muted-dark">
                Updated {lastUpdated}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard/properties/create" className="btn-primary !gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Property
            </Link>
            <button
              type="button"
onClick={() => {
                refetchMetrics();
                propertiesQuery.refetch();
                portfolioQuery.refetch();
                refetchActivities();
                darajaStatus.refetch();
              }}
              className="btn-ghost btn-sm !h-9 !w-9 !rounded-xl !p-0"
              aria-label="Refresh dashboard"
              title="Refresh dashboard"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Hero metrics */}
        <div className="hero-metrics grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 relative z-10">
          {/* "Portfolio Health" removed — it displayed a hand-weighted formula
              over property counts as an authoritative percentage with a
              Healthy/Fair/Needs-attention verdict, and no such metric exists.
              The tiles beside it are all directly checkable. */}
          <div className="kpi-metric">
            <span className="kpi-metric-label">Units occupied</span>
            <div className="flex items-baseline gap-2">
              <span className="kpi-metric-value">
                {metrics.totalUnits > 0 ? `${metrics.occupiedUnits}/${metrics.totalUnits}` : "—"}
              </span>
            </div>
          </div>
          <div className="kpi-metric">
            <span className="kpi-metric-label">Unit occupancy</span>
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
            <span className="kpi-metric-label">Collected this month</span>
            <div className="flex items-baseline gap-2">
              <span className="kpi-metric-value">
                {ledgerSummaryQuery.data
                  ? formatCurrency(ledgerSummaryQuery.data.collectedThisMonth, {
                      currency: ledgerSummaryQuery.data.currency,
                    })
                  : "—"}
              </span>
            </div>
          </div>
          <div className="kpi-metric">
            <span className="kpi-metric-label">Overdue</span>
            <div className="flex items-baseline gap-2">
              <span
                className="kpi-metric-value"
                style={
                  ledgerSummaryQuery.data && ledgerSummaryQuery.data.overdueEntryCount > 0
                    ? { color: "var(--color-danger)" }
                    : undefined
                }
              >
                {ledgerSummaryQuery.data
                  ? formatCurrency(ledgerSummaryQuery.data.overdueTotal, {
                      currency: ledgerSummaryQuery.data.currency,
                    })
                  : "—"}
              </span>
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
        {/*
          The "Portfolio Health" panel is gone. It rendered a HealthScore with a
          four-part breakdown in which `collections` held no collections data
          (it was the overall score again) and `revenue` was occupancyRate + 10.
          A landlord acting on either would have been acting on nothing.

          The KPI row now spans the full width rather than a placeholder taking
          its place: an empty panel is still a claim that something belongs
          there.
        */}

        {/* KPI Cards row */}
        <div className="lg:col-span-4">
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
              value={metrics.occupiedUnits}
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
              value={metrics.vacantUnits}
              subtitle="properties to fill"
              badge={metrics.vacantUnits > 0 ? { label: "Needs attention", variant: "warning" } : { label: "None", variant: "success" }}
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
          {/* Portfolio Composition */}
          <div className="card-elevated">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-header !text-sm !mb-0">Portfolio Composition</h3>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Active vs draft vs archived</p>
              </div>
              <span className="badge badge-neutral !text-[10px] font-mono-nums">
                {metrics.totalProperties} total
              </span>
            </div>
            <PortfolioBar
              active={metrics.activeProperties}
              underMaintenance={metrics.underMaintenance}
              draft={metrics.draft}
              archived={metrics.archived}
            />
          </div>

          {/* Property Distribution */}
          <div className="card-elevated">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-header !text-sm !mb-0">Property Distribution</h3>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">By type &middot; live portfolio</p>
              </div>
              <span className="badge badge-neutral !text-[10px] font-mono-nums">
                {portfolioProperties.filter((p) => p.status !== PropertyStatus.DRAFT && p.status !== PropertyStatus.ARCHIVED).length} live
              </span>
            </div>
            <PropertyDistributionChart properties={portfolioProperties} isLoading={portfolioQuery.isLoading} />
          </div>

          {/* Occupancy Mix */}
          <div className="card-elevated">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-header !text-sm !mb-0">Occupancy Mix</h3>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Across active properties</p>
              </div>
              {/* Explicitly "of units": the chart below counts PROPERTIES by
                  occupancy status, so an unlabelled percentage here read as a
                  summary of the chart when it measures something else. */}
              {occupancyRate != null && (
                <span className={`badge ${occupancyRate >= 80 ? "badge-emerald" : "badge-warning"} !text-[10px]`}>
                  {occupancyRate}% of units
                </span>
              )}
            </div>
            <OccupancyMixChart properties={portfolioProperties} isLoading={portfolioQuery.isLoading} />
          </div>
        </div>

        {/* Second row: Needs attention + Portfolio Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="card-elevated">
            <div className="flex items-center justify-between mb-4">
              <div>
                {/* Was "Top Properties / By occupancy rate" — there is no
                    per-property occupancy rate in the system, and the one this
                    panel displayed was derived from the property name's
                    character codes. Vacancies first is a real ordering. */}
                <h3 className="section-header !text-sm !mb-0">Needs attention</h3>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Vacancies first</p>
              </div>
              <Sparkles className="h-4 w-4 text-brand" strokeWidth={1.75} />
            </div>
            {propertiesQuery.isLoading ? (
              <PropertyRankingSkeleton />
            ) : (
              <PropertyRanking properties={properties} occupancyByProperty={occupancyByProperty} />
            )}
          </div>

          {/* Portfolio Growth */}
          <div className="card-elevated lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="section-header !text-sm !mb-0">Portfolio Growth</h3>
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">Not available yet</p>
              </div>
              <span className="executive-chip px-2.5 py-1 text-[10px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Coming soon
              </span>
            </div>
            <div className="relative h-64 overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-br from-surface via-border-subtle/40 to-surface dark:border-border-dark/60 dark:from-surface-dark dark:via-border-subtle-dark/30 dark:to-surface-dark">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                  backgroundSize: "3rem 3rem",
                  maskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
                  WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
                }}
                aria-hidden
              />
              <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" aria-hidden />
              <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 shadow-sm ring-1 ring-brand/15 dark:bg-brand-900/25 dark:ring-brand-300/15">
                  <TrendingUp className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg dark:text-fg-dark">Portfolio history isn&apos;t tracked yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                    Nothing was recording it before, so there&apos;s nothing to chart yet.
                    Your full payment history — every transaction, dated — lives in the Rent Ledger.
                  </p>
                </div>
                <Link href="/dashboard/rent-ledger" className="btn-secondary inline-flex items-center gap-1.5 !text-xs !py-2 !px-3.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={2} />
                  Explore rent ledger
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </ScrollReveal>

      {/* ═══════════════════════════════════════════════════════════
         LEVEL 3: Insights + Alerts
         ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
              <Lightbulb className="h-3.5 w-3.5 text-brand dark:text-brand-300" strokeWidth={1.75} />
            </div>
            <h3 className="section-header !text-sm !mb-0">Insights</h3>
          </div>
          <InsightsEngine
            occupancyRate={occupancyRate}
            vacant={metrics.vacantUnits}
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
            vacant={metrics.vacantUnits}
            underMaintenance={metrics.underMaintenance}
            occupancyRate={occupancyRate}
            totalProperties={metrics.totalProperties}
            activeProperties={metrics.activeProperties}
          />
        </div>
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-black/10 dark:ring-white/15">
              <MPesaIcon className="h-5 w-5" />
            </div>
            <h3 className="section-header !text-sm !mb-0">Payment Gateway</h3>
          </div>
          {darajaStatus.isLoading ? (
            <div className="space-y-3">
              <div className="skeleton h-20 w-full rounded-2xl" />
            </div>
          ) : isDarajaConnected ? (
            <div className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4FC136] via-[#43B02A] to-[#2E8B1F] p-4 shadow-[0_10px_28px_-12px_rgba(67,176,42,0.55)]">
                <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" aria-hidden />
                <div className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-black/10 blur-2xl" aria-hidden />
                <div className="relative flex items-center gap-3.5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-md ring-1 ring-white/50">
                    <MPesaIcon className="h-11 w-11" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold tracking-tight text-white">M-Pesa</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-px text-[9px] font-bold uppercase tracking-wide text-white ring-1 ring-white/25">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        Connected
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-white/85">
                      Rent and deposits paid straight to your M-Pesa
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" strokeWidth={2.25} />
                </div>
              </div>
              <Link
                href="/daraja/config"
                className="group/manage mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-brand dark:text-brand-300 transition-colors hover:text-brand-700 dark:hover:text-brand-200"
              >
                Payment settings
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover/manage:translate-x-0.5 group-hover/manage:-translate-y-0.5" strokeWidth={2} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/60 p-3.5 dark:border-border-dark/60 dark:bg-surface-dark/60">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/10 dark:ring-white/15">
                <MPesaIcon className="h-9 w-9" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="badge badge-neutral !text-[9px] !px-1.5 !py-px">Not connected</span>
                <p className="mt-1 text-[11px] leading-snug text-fg-muted dark:text-fg-muted-dark">
                  Link your till or paybill to collect rent via M-Pesa.
                </p>
                <Link href="/daraja/config" className="btn-primary mt-2.5 inline-flex !text-xs !py-1.5 !px-3">
                  Set up M-Pesa
                </Link>
              </div>
            </div>
          )}
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="section-header !text-sm !mb-0">Properties</h3>
              <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                {properties.length} {properties.length === 1 ? "property" : "properties"} &middot; {metrics.activeProperties} active
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-border-subtle/80 p-0.5 shadow-inner dark:border-border-dark/60 dark:bg-border-subtle-dark/80">
                <button
                  type="button"
                  onClick={() => setPropertyFilter("active")}
                  aria-pressed={propertyFilter === "active"}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    propertyFilter === "active"
                      ? "bg-surface dark:bg-surface-dark text-fg dark:text-fg-dark shadow-sm"
                      : "text-fg-muted hover:text-fg dark:text-fg-muted-dark dark:hover:text-fg-dark"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyFilter("all")}
                  aria-pressed={propertyFilter === "all"}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    propertyFilter === "all"
                      ? "bg-surface dark:bg-surface-dark text-fg dark:text-fg-dark shadow-sm"
                      : "text-fg-muted hover:text-fg dark:text-fg-muted-dark dark:hover:text-fg-dark"
                  }`}
                >
                  All
                </button>
              </div>
              {properties.length > 0 && (
                <Link
                  href="/dashboard/properties"
                  className="link-brand inline-flex items-center gap-1 text-[11px] hover:underline"
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
{properties.map((p) => {
                  const typeKey = String(p.propertyType ?? "UNKNOWN").toUpperCase();
                  const { icon: TypeIcon, color } = typeStyle(typeKey);
                  const typeName = typeLabel(typeKey);
                  return (
                    <tr key={p.propertyId} className="group/property-row table-row-hover transition-colors">
                      <td>
                        <Link href={`/dashboard/properties/${p.propertyId}`} className="flex items-center gap-2.5 group">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800 text-[11px] font-bold text-brand-dark dark:text-brand-200 ring-1 ring-brand/10 transition-all group-hover:scale-105 group-hover:shadow-sm">
                            {p.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate text-[13px] font-semibold text-fg group-hover:text-brand transition-colors">
                            {p.name}
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[11px]">
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-black/5 dark:ring-white/10"
                            style={{ backgroundColor: `${color}14`, color }}
                          >
                            <TypeIcon className="h-2.5 w-2.5" strokeWidth={2} />
                          </span>
                          <span className="capitalize text-fg-muted dark:text-fg-muted-dark">{typeName}</span>
                        </span>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <OccupancyBadge status={p.occupancyStatus ?? "VACANT"} />
                      </td>
                      <td className="text-right">
                        <ChevronRight className="h-3.5 w-3.5 inline-block text-fg-subtle opacity-0 transition-all group-hover/property-row:translate-x-0.5 group-hover/property-row:opacity-100 dark:text-fg-subtle-dark" strokeWidth={1.5} />
                      </td>
                    </tr>
                  );
                })}
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

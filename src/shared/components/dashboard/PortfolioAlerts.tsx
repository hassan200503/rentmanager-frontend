"use client";

import { AlertTriangle, Info, X, CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface Alert {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  variant: "warning" | "info" | "success";
}

interface PortfolioAlertsProps {
  vacant: number;
  underMaintenance: number;
  occupancyRate: number | null;
  totalProperties: number;
  activeProperties: number;
}

export default function PortfolioAlerts({
  vacant,
  underMaintenance,
  occupancyRate,
  totalProperties,
  activeProperties,
}: PortfolioAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts: Alert[] = [];

  if (vacant > 0) {
    alerts.push({
      id: "vacant",
      title: `${vacant} vacant ${vacant === 1 ? "property" : "properties"}`,
      description: `These properties are not generating revenue. Consider reviewing pricing or running promotions.`,
      actionLabel: "Review",
      actionHref: "/dashboard/properties",
      variant: "warning",
    });
  }

  if (underMaintenance > 0) {
    alerts.push({
      id: "maintenance",
      title: `${underMaintenance} ${underMaintenance === 1 ? "property is" : "properties are"} under maintenance`,
      description: `These units are temporarily unavailable. Track progress of ongoing work.`,
      actionLabel: "View",
      actionHref: "/dashboard/properties",
      variant: "info",
    });
  }

  if (occupancyRate != null && occupancyRate < 80 && activeProperties > 0) {
    alerts.push({
      id: "occupancy",
      title: `Occupancy at ${occupancyRate}%`,
      description: `Below the 80% target. Focus on leasing vacant units to improve performance.`,
      variant: "warning",
    });
  }

  if (totalProperties === 0) {
    alerts.push({
      id: "no-properties",
      title: "No properties yet",
      description: "Add your first property to start tracking occupancy, revenue, and portfolio health.",
      actionLabel: "Add Property",
      actionHref: "/dashboard/properties/create",
      variant: "info",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      title: "All clear",
      description: "No issues detected. Your portfolio is running smoothly.",
      variant: "success",
    });
  }

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  const iconMap = {
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle2,
  };

  const alertClassMap = {
    warning: "alert-warning",
    info: "alert-info",
    success: "alert-success",
  };

  const colorMap = {
    warning: "text-warning-dark dark:text-warning",
    info: "text-info-dark dark:text-info",
    success: "text-success-dark dark:text-success",
  };

  const iconBgMap = {
    warning: "bg-warning-bg dark:bg-warning-bg-dark",
    info: "bg-info-bg dark:bg-info-bg-dark",
    success: "bg-success-bg dark:bg-success-bg-dark",
  };

  return (
    <div className="space-y-2.5">
      {visible.map((alert) => {
        const Icon = iconMap[alert.variant];
        return (
          <div
            key={alert.id}
            className={`alert-card ${alertClassMap[alert.variant]} animate-slide-up shadow-sm`}
            style={{ animationDelay: `${alerts.indexOf(alert) * 50}ms` }}
          >
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${iconBgMap[alert.variant]}`}>
              <Icon className={`h-4 w-4 ${colorMap[alert.variant]}`} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-fg dark:text-fg-dark">{alert.title}</p>
              <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{alert.description}</p>
              {alert.actionLabel && alert.actionHref && (
                <Link
                  href={alert.actionHref}
                  className="mt-3 inline-flex items-center gap-1 rounded-full border border-brand/20 bg-white/50 px-2.5 py-1 text-xs font-semibold hover:no-underline dark:bg-white/5"
                  style={{ color: "var(--color-brand)" }}
                >
                  {alert.actionLabel}
                  <ExternalLink className="h-3 w-3" strokeWidth={2} />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
              className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="h-3.5 w-3.5 text-fg-muted" strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

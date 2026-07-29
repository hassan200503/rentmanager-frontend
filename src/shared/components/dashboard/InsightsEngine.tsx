"use client";

import { Lightbulb, TrendingUp, TrendingDown, Building2, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Insight {
  icon: typeof Lightbulb;
  text: string;
  recommendation?: string;
  actionLabel?: string;
  actionHref?: string;
  tone: "neutral" | "positive" | "negative";
}

interface InsightsEngineProps {
  occupancyRate: number | null;
  vacant: number;
  activeProperties: number;
  totalProperties: number;
  underMaintenance: number;
}

export default function InsightsEngine({
  occupancyRate,
  vacant,
  activeProperties,
  totalProperties,
  underMaintenance,
}: InsightsEngineProps) {
  const insights: Insight[] = [];

  if (totalProperties === 0) {
    insights.push({
      icon: Lightbulb,
      text: "Your portfolio is empty. Add your first property to get started.",
      recommendation: "Adding at least one property unlocks the full dashboard experience.",
      actionLabel: "Add Property",
      actionHref: "/dashboard/properties/create",
      tone: "neutral",
    });
  } else if (activeProperties === 0) {
    insights.push({
      icon: Lightbulb,
      text: `${totalProperties} ${totalProperties === 1 ? "property exists" : "properties exist"} but none are active.`,
      recommendation: "Activate a property to start tracking occupancy, rent, and performance.",
      actionLabel: "View Properties",
      actionHref: "/dashboard/properties",
      tone: "neutral",
    });
  } else {
    if (occupancyRate != null) {
      if (occupancyRate >= 80) {
        insights.push({
          icon: TrendingUp,
          text: `Strong occupancy at ${occupancyRate}%.`,
          recommendation: "Consider adjusting rental rates to maximize revenue.",
          tone: "positive",
        });
      } else {
        insights.push({
          icon: TrendingDown,
          text: `Occupancy dropped to ${occupancyRate}%.`,
          recommendation: "Review pricing and run promotions to attract tenants.",
          tone: "negative",
        });
      }
    }

    if (vacant > 0) {
      insights.push({
        icon: Building2,
        text: `${vacant} ${vacant === 1 ? "property is" : "properties are"} vacant.`,
        recommendation: vacant === 1 ? "Review its pricing and listing visibility." : "Review their pricing and listing visibility.",
        actionLabel: "Review",
        actionHref: "/dashboard/properties",
        tone: "negative",
      });
    }

    if (underMaintenance > 0) {
      insights.push({
        icon: BarChart3,
        text: `${underMaintenance} ${underMaintenance === 1 ? "property is" : "properties are"} under maintenance.`,
        recommendation: "Track ongoing work to minimize downtime.",
        actionLabel: "View",
        actionHref: "/dashboard/properties",
        tone: "neutral",
      });
    }

    if (occupancyRate != null && occupancyRate >= 80 && vacant === 0 && underMaintenance === 0) {
      insights.push({
        icon: Lightbulb,
        text: "Portfolio is in great shape!",
        recommendation: "All properties are active and occupied. Focus on retention and growth.",
        tone: "positive",
      });
    }
  }

  const toneStyles: Record<string, { bg: string; icon: string; border: string }> = {
    positive: { bg: "bg-success-bg/50 dark:bg-success-bg-dark/30", icon: "text-success dark:text-success", border: "border-success/20" },
    negative: { bg: "bg-warning-bg/50 dark:bg-warning-bg-dark/30", icon: "text-warning-dark dark:text-warning", border: "border-warning/20" },
    neutral: { bg: "bg-info-bg/50 dark:bg-info-bg-dark/30", icon: "text-info dark:text-info", border: "border-info/20" },
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        const styles = toneStyles[insight.tone];
        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border p-4 ${styles.bg} ${styles.border} animate-slide-up`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles.bg} ${styles.icon}`}>
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg dark:text-fg-dark">{insight.text}</p>
              {insight.recommendation && (
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">{insight.recommendation}</p>
              )}
              {insight.actionLabel && insight.actionHref && (
                <Link
                  href={insight.actionHref}
                  className="link-brand inline-flex items-center gap-1 text-xs font-semibold mt-2 hover:underline"
                >
                  {insight.actionLabel}
                  <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
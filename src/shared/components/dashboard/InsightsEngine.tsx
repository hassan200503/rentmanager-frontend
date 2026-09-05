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
        // "dropped to" asserted a change over time. This component holds a
        // single current figure and no prior period, so it cannot know whether
        // occupancy rose, fell, or has been flat since the portfolio was
        // created — a landlord who has just added their first units would have
        // been told their occupancy had dropped.
        insights.push({
          icon: TrendingDown,
          text: `Occupancy is ${occupancyRate}%.`,
          recommendation: "Review pricing and listing visibility on vacant units.",
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

  const toneStyles: Record<string, { bg: string; icon: string; border: string; accent: string }> = {
    positive: { bg: "bg-success-bg/55 dark:bg-success-bg-dark/30", icon: "text-success dark:text-success", border: "border-success/20", accent: "bg-success" },
    negative: { bg: "bg-warning-bg/55 dark:bg-warning-bg-dark/30", icon: "text-warning-dark dark:text-warning", border: "border-warning/20", accent: "bg-warning" },
    neutral: { bg: "bg-info-bg/55 dark:bg-info-bg-dark/30", icon: "text-info dark:text-info", border: "border-info/20", accent: "bg-info" },
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        const styles = toneStyles[insight.tone];
        return (
          <div
            key={i}
            className={`relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${styles.bg} ${styles.border} animate-slide-up`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className={`absolute inset-y-3 left-0 w-0.5 rounded-r-full ${styles.accent}`} />
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10 ${styles.icon}`}>
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
                  className="link-brand mt-3 inline-flex items-center gap-1 rounded-full border border-brand/20 bg-white/50 px-2.5 py-1 text-xs font-semibold shadow-sm hover:no-underline dark:bg-white/5"
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

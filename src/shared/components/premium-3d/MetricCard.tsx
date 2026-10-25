"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
  iconColor?: string;
  delay?: number;
  className?: string;
}

/**
 * Premium 3D metric card for displaying KPIs
 * 
 * @example
 * ```tsx
 * <MetricCard
 *   icon={DollarSign}
 *   label="Monthly Revenue"
 *   value="KES 1.2M"
 *   trend={{ value: 23, label: "this month", direction: "up" }}
 *   iconColor="cyan"
 * />
 * ```
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor = "cyan",
  delay = 0,
  className = "",
}: MetricCardProps) {
  const iconColorClasses = {
    cyan: "text-[#00D9FF]",
    brand: "text-brand-400",
    gold: "text-[#FFB84D]",
    purple: "text-purple-400",
  };

  const iconBgClasses = {
    cyan: "from-[#00D9FF]/15 to-[#0099FF]/10",
    brand: "from-brand-400/15 to-brand-600/10",
    gold: "from-[#FFB84D]/15 to-[#F59E0B]/10",
    purple: "from-purple-400/15 to-purple-600/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{
        y: -6,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
        },
      }}
      className={`metric-card-3d ${className}`}
    >
      {/* Icon */}
      <div className={`metric-icon bg-gradient-to-br ${iconBgClasses[iconColor as keyof typeof iconBgClasses] || iconBgClasses.cyan}`}>
        <Icon className={`w-6 h-6 ${iconColorClasses[iconColor as keyof typeof iconColorClasses] || iconColorClasses.cyan}`} />
      </div>

      {/* Label */}
      <div className="metric-label-3d">{label}</div>

      {/* Value */}
      <div className="metric-value-3d">{value}</div>

      {/* Trend */}
      {trend && (
        <div className={`metric-trend-3d ${trend.direction === "down" ? "negative" : ""}`}>
          {trend.direction === "up" ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {trend.direction === "up" ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Wallet, Smartphone, Percent, ArrowLeftRight } from "lucide-react";

const financialCards = [
  {
    icon: DollarSign,
    label: "Monthly Revenue",
    value: "KES 0",
    subtitle: "Expected this month",
    trend: { value: 12, positive: true },
    color: "var(--color-brand)",
    bg: "var(--color-brand-50)",
  },
  {
    icon: TrendingUp,
    label: "Collected Today",
    value: "KES 0",
    subtitle: "No payments today",
    trend: { value: 0, positive: true },
    color: "var(--color-success)",
    bg: "var(--color-success-bg)",
  },
  {
    icon: Wallet,
    label: "Outstanding Balance",
    value: "KES 0",
    subtitle: "Across all properties",
    color: "var(--color-danger)",
    bg: "var(--color-danger-bg)",
  },
  {
    icon: Smartphone,
    label: "M-Pesa Success Rate",
    value: "—",
    subtitle: "No transactions yet",
    color: "var(--color-info)",
    bg: "var(--color-info-bg)",
  },
  {
    icon: Percent,
    label: "Collection Efficiency",
    value: "—",
    subtitle: "Rent collected vs expected",
    color: "var(--color-brand-400)",
    bg: "var(--color-brand-50)",
  },
  {
    icon: ArrowLeftRight,
    label: "Cash Flow",
    value: "KES 0",
    subtitle: "Net this period",
    trend: { value: 5, positive: true },
    color: "var(--color-warning)",
    bg: "var(--color-warning-bg)",
  },
];

function MiniTrend({ value, positive }: { value: number; positive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${positive ? "text-success" : "text-danger"}`}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
        <path d={positive ? "M4 1L6.5 6H1.5L4 1Z" : "M4 7L1.5 2H6.5L4 7Z"} fill="currentColor" />
      </svg>
      {value}%
    </span>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function FinancialOverview() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
    >
      {financialCards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            variants={item}
            className="card-elevated !p-4 group cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 group-hover:shadow-sm group-hover:scale-105"
                style={{ backgroundColor: card.bg }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color: card.color }} />
              </div>
              {card.trend && (
                <MiniTrend value={card.trend.value} positive={card.trend.positive} />
              )}
            </div>
            <p className="kpi-label !text-[10px] mb-0.5">{card.label}</p>
            <p className="text-sm font-bold font-mono-nums tracking-tight mb-0.5 text-fg dark:text-fg-dark">
              {card.value}
            </p>
            <p className="text-[10px] text-fg-muted dark:text-fg-muted-dark">{card.subtitle}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

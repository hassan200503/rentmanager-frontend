"use client";

import Link from "next/link";
import {
  Plus,
  Building2,
  Receipt,
  FileText,
  UserPlus,
  FileBarChart,
  Settings,
  LifeBuoy,
  ArrowUpRight,
} from "lucide-react";

interface QuickAction {
  icon: typeof Plus;
  label: string;
  description: string;
  href: string;
  color: string;
  bg: string;
}

const actions: QuickAction[] = [
  { icon: Plus, label: "Add Property", description: "Create a new property listing", href: "/dashboard/properties/create", color: "var(--color-brand)", bg: "var(--color-brand-50)" },
  { icon: FileText, label: "Create Lease", description: "Draft a lease agreement", href: "/dashboard/leases/create", color: "var(--color-info)", bg: "var(--color-info-bg)" },
  { icon: Receipt, label: "Record Payment", description: "Log a rent payment", href: "/dashboard/payments", color: "var(--color-success)", bg: "var(--color-success-bg)" },
  { icon: Building2, label: "Manage Portfolio", description: "View all properties", href: "/dashboard/properties", color: "var(--color-brand-400)", bg: "var(--color-brand-50)" },
  { icon: UserPlus, label: "Invite Tenant", description: "Add a new tenant", href: "/dashboard/leases", color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  { icon: FileBarChart, label: "Generate Report", description: "Export portfolio data", href: "/dashboard/rent-ledger", color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
  { icon: Settings, label: "Settings", description: "Configure your account", href: "/dashboard/settings", color: "var(--color-fg-muted)", bg: "var(--color-border-subtle)" },
  { icon: LifeBuoy, label: "Support", description: "Get help with the platform", href: "/dashboard/settings", color: "var(--color-info)", bg: "var(--color-info-bg)" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border dark:border-border-dark p-4 transition-all duration-200 hover:border-brand-200 dark:hover:border-brand-600 hover:shadow-card-hover hover:-translate-y-0.5 bg-surface dark:bg-surface-dark animate-fade-in-up"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 group-hover:shadow-sm group-hover:scale-105"
              style={{ backgroundColor: action.bg }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} style={{ color: action.color }} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-fg dark:text-fg-dark">{action.label}</span>
              <ArrowUpRight className="h-3 w-3 text-fg-muted dark:text-fg-muted-dark opacity-0 group-hover:opacity-100 transition-all duration-200" strokeWidth={2} />
            </div>
            <span className="text-[11px] text-fg-muted dark:text-fg-muted-dark leading-tight">{action.description}</span>
          </Link>
        );
      })}
    </div>
  );
}
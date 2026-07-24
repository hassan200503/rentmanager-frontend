"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  ClipboardList,
  Users,
  Smartphone,
  UserCog,
  Settings,
  Archive,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Search,
  HelpCircle,
  Keyboard,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { BrandBadge } from "@/shared/components/brand";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Portfolio", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/dashboard/payments", label: "Payments", icon: Receipt },
  { href: "/dashboard/rent-ledger", label: "Rent Ledger", icon: ClipboardList },
  { href: "/dashboard/leases", label: "Tenants", icon: Users },
  { href: "/daraja/config", label: "M-Pesa", icon: Smartphone },
  { href: "/dashboard/team", label: "Team", icon: UserCog },
];

const secondaryNavItems: NavItem[] = [
  { href: "/dashboard/archive", label: "Archived", icon: Archive },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function isItemActive(pathname: string | null, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname?.startsWith(href) ?? false;
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300 shadow-sm"
          : "text-fg-muted hover:text-fg dark:text-fg-muted-dark dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-brand dark:bg-brand-400" />
      )}
      <span
        className={`shrink-0 transition-all duration-150 ${
          active
            ? "text-brand dark:text-brand-400"
            : "text-fg-subtle dark:text-fg-subtle-dark group-hover:text-fg-muted dark:group-hover:text-fg-muted-dark"
        }`}
      >
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={active ? 2.5 : 2} />
      </span>
      <span className={active ? "font-semibold" : ""}>{item.label}</span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useState(() => { setMounted(true); });

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const initials =
    [user?.firstName, user?.lastName]
      .filter((part): part is string => Boolean(part))
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border dark:border-border-dark shrink-0">
        <BrandBadge size="md" />
        <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-border-subtle dark:bg-border-subtle-dark text-[11px] font-medium text-fg-muted dark:text-fg-muted-dark cursor-default">
          <span className="status-dot-success status-dot-live" />
          v1.0
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5 custom-scrollbar">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
          Main
        </p>
        {navItems.map((item, i) => (
          <div key={item.href} style={{ animationDelay: `${i * 30}ms` }} className="animate-sidebar-in">
            <NavLink
              item={item}
              active={isItemActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          </div>
        ))}

        <div className="my-4 h-px bg-border dark:bg-border-dark" aria-hidden />

        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
          Workspace
        </p>
        {secondaryNavItems.map((item, i) => (
          <div key={item.href} style={{ animationDelay: `${(navItems.length + i) * 30}ms` }} className="animate-sidebar-in">
            <NavLink
              item={item}
              active={isItemActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border dark:border-border-dark shrink-0 space-y-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-brand-50/50 dark:bg-brand-900/15 border border-brand-100/50 dark:border-brand-800/30">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-800 text-[13px] font-semibold text-brand-700 dark:text-brand-300">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-fg dark:text-fg-dark">{fullName || "Account"}</p>
            <p className="truncate text-[11px] text-fg-muted dark:text-fg-muted-dark">{user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-fg-subtle dark:text-fg-subtle-dark hover:text-fg dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <Moon className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="w-60 hidden md:flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark">
        <SidebarBody />
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="md:hidden fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark shadow-card"
      >
        <Menu className="h-4.5 w-4.5" strokeWidth={2} />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative w-60 flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark shadow-dropdown">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
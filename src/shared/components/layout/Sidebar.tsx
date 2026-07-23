"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import {
  DashboardIcon,
  PropertiesIcon,
  TransactionsIcon,
  RentLedgerIcon,
  TenantsIcon,
  MPesaIcon,
  TeamIcon,
  SettingsIcon,
} from "@/shared/components/icons";
import { AppLogo } from "@/shared/components/brand";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/dashboard/properties", label: "Properties", icon: PropertiesIcon },
  { href: "/dashboard/payments", label: "Transactions", icon: TransactionsIcon },
  { href: "/dashboard/rent-ledger", label: "Rent ledger", icon: RentLedgerIcon },
  { href: "/dashboard/leases", label: "Tenants", icon: TenantsIcon },
  { href: "/daraja/config", label: "M-Pesa", icon: MPesaIcon },
  { href: "/dashboard/team", label: "Team", icon: TeamIcon },
];

const secondaryNavItems: NavItem[] = [
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
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
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-out ${
        active
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "text-fg-muted hover:text-fg dark:text-fg-muted-dark dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
      )}
      <span
        className={`shrink-0 transition-all duration-150 ease-out ${
          active
            ? "text-emerald-600 dark:text-emerald-400 scale-105"
            : "text-fg-subtle dark:text-fg-subtle-dark group-hover:text-fg-muted dark:group-hover:text-fg-muted-dark group-hover:translate-x-0.5"
        }`}
      >
        <Icon width={20} height={20} strokeWidth={active ? 2.5 : 2} />
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
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border dark:border-border-dark shrink-0">
        <span className="text-emerald-600 dark:text-emerald-500">
          <AppLogo size={22} />
        </span>
        <span className="font-display text-[15px] font-semibold text-fg dark:text-fg-dark tracking-tight">
          RentManager
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}

        <div className="my-3 h-px bg-border dark:bg-border-dark" aria-hidden />

        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="p-3 border-t border-border dark:border-border-dark shrink-0 space-y-3">
        <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-100/50 dark:border-emerald-800/30 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Pilot build
          </p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">
            More modules rolling out soon
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-fg dark:text-fg-dark">{fullName || "Account"}</p>
            <p className="truncate text-[11px] text-fg-muted dark:text-fg-muted-dark">{user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-subtle dark:text-fg-subtle-dark hover:text-fg dark:hover:text-fg-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
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
      <aside className="w-64 hidden md:flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark">
        <SidebarBody />
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="md:hidden fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark shadow-card"
      >
        <Menu className="h-4.5 w-4.5" strokeWidth={2} />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative w-64 flex flex-col bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-md text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
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
